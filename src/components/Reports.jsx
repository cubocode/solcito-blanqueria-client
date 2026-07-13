import React, { useState } from 'react';
import { Card, Row, Col, Table, Button, Form, InputGroup, Tab, Nav, Badge } from 'react-bootstrap';
import { FiBarChart2, FiCalendar, FiDollarSign, FiShoppingBag, FiTrendingUp, FiDownload, FiFilter, FiActivity, FiTag } from 'react-icons/fi';

function Reports({ sales, products }) {
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [reportType, setReportType] = useState('sales'); // 'sales' or 'products'

  // Quick range filters
  const setQuickRange = (rangeType) => {
    const today = new Date();
    let start = new Date();
    
    if (rangeType === 'today') {
      // todayStr YYYY-MM-DD
      const todayStr = today.toISOString().slice(0, 10);
      setFilterStartDate(todayStr);
      setFilterEndDate(todayStr);
      return;
    } else if (rangeType === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (rangeType === 'prevMonth') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setFilterStartDate(start.toISOString().slice(0, 10));
      setFilterEndDate(end.toISOString().slice(0, 10));
      return;
    } else if (rangeType === 'quarter') {
      start.setMonth(today.getMonth() - 3);
    } else if (rangeType === 'year') {
      start = new Date(today.getFullYear(), 0, 1);
    } else if (rangeType === 'all') {
      setFilterStartDate('');
      setFilterEndDate('');
      return;
    }

    setFilterStartDate(start.toISOString().slice(0, 10));
    setFilterEndDate(today.toISOString().slice(0, 10));
  };

  // 1. Filter Sales
  const filteredSales = sales.filter(sale => {
    const matchesPaymentMethod =
      filterPaymentMethod === '' ||
      sale.paymentMethod === filterPaymentMethod;

    let matchesDate = true;
    const saleDateObj = new Date(sale.date);
    const y = saleDateObj.getFullYear();
    const m = String(saleDateObj.getMonth() + 1).padStart(2, '0');
    const d = String(saleDateObj.getDate()).padStart(2, '0');
    const saleLocalDateStr = `${y}-${m}-${d}`;

    if (filterStartDate) {
      matchesDate = matchesDate && saleLocalDateStr >= filterStartDate;
    }
    if (filterEndDate) {
      matchesDate = matchesDate && saleLocalDateStr <= filterEndDate;
    }

    return matchesPaymentMethod && matchesDate;
  });

  // Category Map from active products
  const categoryMap = {};
  products.forEach(p => {
    categoryMap[p.name.toLowerCase()] = p.category;
    categoryMap[p.code.toLowerCase()] = p.category;
  });

  // Helper to fallback category
  const getProductCategory = (name, code) => {
    if (categoryMap[name.toLowerCase()]) return categoryMap[name.toLowerCase()];
    if (code && categoryMap[code.toLowerCase()]) return categoryMap[code.toLowerCase()];
    return 'General';
  };

  // 2. Calculations for Statistics
  let totalRevenue = 0;
  let totalUnitsSold = 0;
  const productQuantities = {};
  const daySales = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // Sun-Sat
  const dayCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const categorySales = {};

  filteredSales.forEach(sale => {
    totalRevenue += sale.total;
    
    // Day of the week (Sun=0, Mon=1...)
    const day = new Date(sale.date).getDay();
    daySales[day] += sale.total;
    dayCount[day] += 1;

    sale.items.forEach(item => {
      totalUnitsSold += item.quantity;

      // Product quantities
      const prodName = item.productName || 'Producto Eliminado';
      productQuantities[prodName] = (productQuantities[prodName] || 0) + item.quantity;

      // Category Sales
      const cat = getProductCategory(prodName, item.productId);
      categorySales[cat] = (categorySales[cat] || 0) + item.subtotal;
    });
  });

  const avgTicket = filteredSales.length ? (totalRevenue / filteredSales.length) : 0;

  // Top 5 Products
  const topProducts = Object.entries(productQuantities)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxProductQty = topProducts[0]?.qty || 1;

  // Best Selling Days calculation
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayStats = dayNames.map((name, index) => ({
    name,
    amount: daySales[index],
    count: dayCount[index]
  }));

  const maxDayAmount = Math.max(...dayStats.map(d => d.amount), 1);

  // Category sales sorted
  const sortedCategories = Object.entries(categorySales)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const maxCategoryAmount = sortedCategories[0]?.amount || 1;

  // Detailed Product aggregation for Tab 2
  const detailedProducts = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      const prodName = item.productName || 'Producto Eliminado';
      const cat = getProductCategory(prodName, item.productId);
      if (!detailedProducts[prodName]) {
        detailedProducts[prodName] = {
          name: prodName,
          category: cat,
          quantity: 0,
          revenue: 0
        };
      }
      detailedProducts[prodName].quantity += item.quantity;
      detailedProducts[prodName].revenue += item.subtotal;
    });
  });

  const detailedProductsList = Object.values(detailedProducts).sort((a, b) => b.revenue - a.revenue);

  // Export CSV functions
  const exportSalesReport = () => {
    const headers = ['ID Venta', 'Fecha y Hora', 'Cliente', 'Método de Pago', 'Cantidad Items', 'Total ($)'];
    const rows = filteredSales.map(sale => [
      sale.id,
      new Date(sale.date).toLocaleString('es-AR'),
      sale.clientName,
      sale.paymentMethod,
      sale.items.reduce((acc, curr) => acc + curr.quantity, 0),
      sale.total
    ]);

    downloadCSV(headers, rows, `reporte_ventas_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportProductsReport = () => {
    const headers = ['Producto', 'Categoría', 'Unidades Vendidas', 'Facturación ($)'];
    const rows = detailedProductsList.map(p => [
      p.name,
      p.category,
      p.quantity,
      p.revenue
    ]);

    downloadCSV(headers, rows, `reporte_productos_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadCSV = (headers, rows, filename) => {
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(val => {
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold m-0" style={{ color: 'var(--primary-color)' }}>
          Reportes y Estadísticas
        </h2>
        
        {/* Quick Range Selection */}
        <div className="d-flex gap-1.5 flex-wrap">
          <Button variant="light" size="sm" onClick={() => setQuickRange('today')} className="border">Hoy</Button>
          <Button variant="light" size="sm" onClick={() => setQuickRange('month')} className="border">Este Mes</Button>
          <Button variant="light" size="sm" onClick={() => setQuickRange('prevMonth')} className="border">Mes Anterior</Button>
          <Button variant="light" size="sm" onClick={() => setQuickRange('quarter')} className="border">Últimos 3 Meses</Button>
          <Button variant="light" size="sm" onClick={() => setQuickRange('year')} className="border">Este Año</Button>
          <Button variant="light" size="sm" onClick={() => setQuickRange('all')} className="border">Todo</Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="custom-card border-0 mb-4 shadow-sm">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-end">
            <Col md={3} sm={6}>
              <Form.Label className="fw-semibold text-muted small mb-1">MÉTODO DE PAGO</Form.Label>
              <Form.Select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
              >
                <option value="">Todos los métodos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="QR">QR</option>
                <option value="Cuenta Corriente">Cuenta Corriente</option>
              </Form.Select>
            </Col>

            <Col md={3} sm={6}>
              <Form.Label className="fw-semibold text-muted small mb-1">DESDE (FECHA)</Form.Label>
              <Form.Control
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </Col>

            <Col md={3} sm={6}>
              <Form.Label className="fw-semibold text-muted small mb-1">HASTA (FECHA)</Form.Label>
              <Form.Control
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </Col>

            <Col md={3} sm={6} className="d-grid">
              <Button 
                variant="outline-secondary" 
                size="md"
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setFilterPaymentMethod('');
                }}
              >
                Limpiar Filtros
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Statistical KPIs Cards */}
      <Row className="g-3 mb-4">
        <Col lg={3} sm={6}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #10b981' }}>
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div className="p-3 rounded-circle text-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <FiDollarSign size={24} />
              </div>
              <div>
                <span className="text-muted small d-block uppercase fw-semibold">Ingresos Totales</span>
                <strong className="h4 mb-0 fw-bold d-block text-dark">${totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} sm={6}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #3b82f6' }}>
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div className="p-3 rounded-circle text-primary" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <FiShoppingBag size={24} />
              </div>
              <div>
                <span className="text-muted small d-block uppercase fw-semibold">Total de Ventas</span>
                <strong className="h4 mb-0 fw-bold d-block text-dark">{filteredSales.length} transac.</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} sm={6}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div className="p-3 rounded-circle text-purple" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                <FiTrendingUp size={24} />
              </div>
              <div>
                <span className="text-muted small d-block uppercase fw-semibold">Ticket Promedio</span>
                <strong className="h4 mb-0 fw-bold d-block text-dark">${avgTicket.toLocaleString('es-AR', { maximumFractionDigits: 1 })}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} sm={6}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #f59e0b' }}>
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div className="p-3 rounded-circle text-amber" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <FiActivity size={24} />
              </div>
              <div>
                <span className="text-muted small d-block uppercase fw-semibold">Unidades Vendidas</span>
                <strong className="h4 mb-0 fw-bold d-block text-dark">{totalUnitsSold} unidades</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tab.Container defaultActiveKey="charts">
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="charts" className="fw-semibold px-4"><FiBarChart2 size={16} className="me-2" /> Gráficos Estadísticos</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="tables" className="fw-semibold px-4"><FiFilter size={16} className="me-2" /> Listados y Exportación</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* Tab 1: Charts Dashboard */}
          <Tab.Pane eventKey="charts">
            <Row className="g-4">
              
              {/* Chart: Most Sold Products */}
              <Col lg={6}>
                <Card className="custom-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3" style={{ color: 'var(--primary-color)' }}>
                      Top 5: Productos más Vendidos
                    </h5>
                    <p className="text-muted small mb-4">Muestra los productos con mayor volumen físico de unidades entregadas en el rango actual.</p>
                    
                    <div className="d-flex flex-column gap-3.5 mt-2">
                      {topProducts.length === 0 ? (
                        <div className="text-center py-5 text-muted small">No hay datos de ventas registrados en este rango.</div>
                      ) : (
                        topProducts.map((p, idx) => {
                          const percent = Math.max(10, Math.round((p.qty / maxProductQty) * 100));
                          return (
                            <div key={p.name}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-semibold small text-truncate" style={{ maxWidth: '75%', color: 'var(--text-color)' }}>
                                  {idx + 1}. {p.name}
                                </span>
                                <Badge bg="light" className="text-dark border font-monospace">{p.qty} unidades</Badge>
                              </div>
                              <div className="progress" style={{ height: '14px', borderRadius: '8px', backgroundColor: '#f1f5f9' }}>
                                <div 
                                  className="progress-bar progress-bar-striped progress-bar-animated"
                                  role="progressbar" 
                                  style={{ 
                                    width: `${percent}%`, 
                                    borderRadius: '8px',
                                    background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))' 
                                  }}
                                  aria-valuenow={percent} 
                                  aria-valuemin="0" 
                                  aria-valuemax="100"
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Chart: Best Selling Days */}
              <Col lg={6}>
                <Card className="custom-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3" style={{ color: 'var(--primary-color)' }}>
                      Día que más se Vende (Monetario)
                    </h5>
                    <p className="text-muted small mb-4">Total de facturación monetaria agregada por día de la semana.</p>
                    
                    {totalRevenue === 0 ? (
                      <div className="text-center py-5 text-muted small">No hay datos de ventas registrados en este rango.</div>
                    ) : (
                      <div className="d-flex align-items-end justify-content-between mt-4 px-2" style={{ height: '200px' }}>
                        {dayStats.map((d) => {
                          const percent = Math.max(5, Math.round((d.amount / maxDayAmount) * 100));
                          return (
                            <div key={d.name} className="d-flex flex-column align-items-center flex-grow-1 mx-1" style={{ height: '100%' }}>
                              <div className="d-flex flex-column justify-content-end align-items-center flex-grow-1 w-100">
                                {/* Tooltip display on hover */}
                                <div className="text-center text-muted font-monospace mb-2" style={{ fontSize: '0.65rem' }}>
                                  ${Math.round(d.amount)}
                                </div>
                                <div 
                                  className="w-75 rounded-top"
                                  style={{
                                    height: `${percent}%`,
                                    background: 'linear-gradient(180deg, var(--accent-color), var(--primary-color))',
                                    opacity: d.amount > 0 ? 0.95 : 0.2,
                                    transition: 'height 0.5s ease',
                                    minHeight: '4px'
                                  }}
                                  title={`$${d.amount.toLocaleString()} - ${d.count} ventas`}
                                />
                              </div>
                              <span className="fw-semibold text-muted text-center mt-2 d-block" style={{ fontSize: '0.75rem', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {d.name.slice(0, 3)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Chart: Sales by Category */}
              <Col lg={12}>
                <Card className="custom-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3" style={{ color: 'var(--primary-color)' }}>
                      Ventas por Categoría de Productos
                    </h5>
                    <p className="text-muted small mb-4">Distribución monetaria de las ventas agregada según la categoría del producto entregado.</p>
                    
                    {sortedCategories.length === 0 ? (
                      <div className="text-center py-4 text-muted small">No hay categorías registradas en las ventas de este rango.</div>
                    ) : (
                      <Row className="g-3">
                        {sortedCategories.map((c) => {
                          const percent = Math.round((c.amount / totalRevenue) * 100);
                          const progressWidth = Math.round((c.amount / maxCategoryAmount) * 100);
                          return (
                            <Col md={6} key={c.category}>
                              <div className="p-3 bg-light rounded-3 border">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="fw-bold d-flex align-items-center gap-1.5" style={{ color: 'var(--primary-color)' }}>
                                    <FiTag size={14} className="text-accent" /> {c.category}
                                  </span>
                                  <div className="text-end">
                                    <strong className="d-block" style={{ fontSize: '1rem' }}>${c.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                                    <span className="text-muted small font-monospace">{percent}% del total</span>
                                  </div>
                                </div>
                                <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}>
                                  <div 
                                    className="progress-bar"
                                    role="progressbar" 
                                    style={{ 
                                      width: `${progressWidth}%`, 
                                      borderRadius: '4px',
                                      backgroundColor: 'var(--accent-color)' 
                                    }}
                                    aria-valuenow={progressWidth} 
                                    aria-valuemin="0" 
                                    aria-valuemax="100"
                                  />
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          {/* Tab 2: Detailed Tables & Exports */}
          <Tab.Pane eventKey="tables">
            <Card className="custom-card border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                  <div>
                    <h5 className="fw-bold m-0" style={{ color: 'var(--primary-color)' }}>
                      Listados y Exportación de Datos
                    </h5>
                    <span className="text-muted small">Filtra y descarga las planillas detalladas para conciliar en Excel.</span>
                  </div>
                  <div className="d-flex gap-2">
                    <Form.Select 
                      size="sm" 
                      value={reportType} 
                      onChange={(e) => setReportType(e.target.value)}
                      style={{ width: '180px' }}
                    >
                      <option value="sales">Listado de Ventas</option>
                      <option value="products">Productos Vendidos</option>
                    </Form.Select>
                    
                    <Button
                      variant="success"
                      size="sm"
                      className="d-flex align-items-center gap-2 border-0"
                      style={{ backgroundColor: '#198754' }}
                      onClick={reportType === 'sales' ? exportSalesReport : exportProductsReport}
                      disabled={filteredSales.length === 0}
                    >
                      <FiDownload /> Exportar Excel
                    </Button>
                  </div>
                </div>

                {reportType === 'sales' ? (
                  // Sales list report table
                  <div className="table-responsive">
                    <Table hover className="align-middle text-nowrap">
                      <thead className="bg-light">
                        <tr>
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5">Fecha</th>
                          <th className="py-2.5">Cliente</th>
                          <th className="py-2.5">Método de Pago</th>
                          <th className="py-2.5 text-center">Unidades</th>
                          <th className="py-2.5 text-end px-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted small">No hay transacciones registradas en este rango.</td>
                          </tr>
                        ) : (
                          filteredSales.map(sale => {
                            const qty = sale.items.reduce((acc, curr) => acc + curr.quantity, 0);
                            return (
                              <tr key={sale.id}>
                                <td className="px-3 fw-bold">{sale.id}</td>
                                <td>{new Date(sale.date).toLocaleDateString('es-AR') + ' ' + new Date(sale.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="fw-semibold" style={{ color: 'var(--primary-color)' }}>{sale.clientName}</td>
                                <td>{sale.paymentMethod}</td>
                                <td className="text-center">{qty}</td>
                                <td className="text-end font-monospace fw-bold px-3" style={{ color: 'var(--accent-color)' }}>
                                  ${sale.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  // Product units report table
                  <div className="table-responsive">
                    <Table hover className="align-middle text-nowrap">
                      <thead className="bg-light">
                        <tr>
                          <th className="py-2.5 px-3">Producto</th>
                          <th className="py-2.5">Categoría</th>
                          <th className="py-2.5 text-center">Unidades Vendidas</th>
                          <th className="py-2.5 text-end px-3">Facturación Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedProductsList.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted small">No hay registros en las ventas de este rango.</td>
                          </tr>
                        ) : (
                          detailedProductsList.map(p => (
                            <tr key={p.name}>
                              <td className="px-3 fw-semibold" style={{ color: 'var(--primary-color)' }}>{p.name}</td>
                              <td>{p.category}</td>
                              <td className="text-center font-monospace">{p.quantity}</td>
                              <td className="text-end font-monospace fw-bold px-3" style={{ color: 'var(--accent-color)' }}>
                                ${p.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <style>{`
        .bg-success-subtle {
          background-color: rgba(25, 135, 84, 0.08) !important;
        }
        .bg-primary-subtle {
          background-color: rgba(59, 130, 246, 0.08) !important;
        }
        .bg-purple-subtle {
          background-color: rgba(139, 92, 246, 0.08) !important;
        }
        .bg-amber-subtle {
          background-color: rgba(245, 158, 11, 0.08) !important;
        }
        .text-purple {
          color: #8b5cf6 !important;
        }
        .text-amber {
          color: #f59e0b !important;
        }
        .text-teal {
          color: #14b8a6 !important;
        }
        .progress-bar-striped {
          background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent) !important;
        }
      `}</style>
    </div>
  );
}

export default Reports;
