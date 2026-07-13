import { useState, useEffect } from 'react';
import { Table, Button, Card, Form, Modal, InputGroup, Row, Col } from 'react-bootstrap';
import { FiSearch, FiPrinter, FiShoppingBag, FiCalendar, FiDownload } from 'react-icons/fi';
import TicketLayout from './TicketLayout';

function SalesHistory({ sales }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [showReprintModal, setShowReprintModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPaymentMethod, filterStartDate, filterEndDate]);

  // Filter sales based on search term, payment method, and dates
  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPaymentMethod =
      filterPaymentMethod === '' ||
      sale.paymentMethod === filterPaymentMethod;

    let matchesDate = true;
    // Extract sale date as YYYY-MM-DD local string
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

    return matchesSearch && matchesPaymentMethod && matchesDate;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const sortedSales = [...filteredSales].sort((a, b) => new Date(b.date) - new Date(a.date));
  const currentSales = sortedSales.slice(indexOfFirstItem, indexOfLastItem);

  const handleOpenReprint = (sale) => {
    setSelectedSale(sale);
    setShowReprintModal(true);
  };

  // Helper to format date
  const formatSaleDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const getPaymentMethodStyle = (method) => {
    switch (method) {
      case 'Efectivo':
        return {
          backgroundColor: 'rgba(25, 135, 84, 0.08)',
          color: '#198754',
          borderColor: 'rgba(25, 135, 84, 0.2)'
        };
      case 'Tarjeta':
        return {
          backgroundColor: 'rgba(13, 110, 253, 0.08)',
          color: '#0d6efd',
          borderColor: 'rgba(13, 110, 253, 0.2)'
        };
      case 'Transferencia':
        return {
          backgroundColor: 'rgba(111, 66, 193, 0.08)',
          color: '#6f42c1',
          borderColor: 'rgba(111, 66, 193, 0.2)'
        };
      case 'QR':
        return {
          backgroundColor: 'rgba(13, 202, 240, 0.08)',
          color: '#0dcaf0',
          borderColor: 'rgba(13, 202, 240, 0.2)'
        };
      case 'Cuenta Corriente':
        return {
          backgroundColor: 'rgba(220, 53, 69, 0.08)',
          color: '#dc3545',
          borderColor: 'rgba(220, 53, 69, 0.2)'
        };
      default:
        return {
          backgroundColor: 'rgba(108, 117, 125, 0.08)',
          color: '#6c757d',
          borderColor: 'rgba(108, 117, 125, 0.2)'
        };
    }
  };

  const setTodayFilter = () => {
    const localToday = new Date();
    const y = localToday.getFullYear();
    const m = String(localToday.getMonth() + 1).padStart(2, '0');
    const d = String(localToday.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    setFilterStartDate(todayStr);
    setFilterEndDate(todayStr);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPaymentMethod('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const exportToExcel = () => {
    // Headers
    const headers = ['ID Venta', 'Fecha y Hora', 'Cliente', 'Método de Pago', 'Unidades Vendidas', 'Total ($)'];

    // Rows mapping
    const rows = sortedSales.map(sale => {
      const totalItemsCount = sale.items.reduce((acc, curr) => acc + curr.quantity, 0);
      return [
        sale.id,
        new Date(sale.date).toLocaleString('es-AR'),
        sale.clientName,
        sale.paymentMethod,
        totalItemsCount,
        sale.total
      ];
    });

    // Create CSV content (Excel-compatible with semi-colons and BOM)
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(val => {
        if (typeof val === 'string') {
          // Escape quotes and wrap
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(';'))
    ].join('\n');

    // UTF-8 BOM so Excel renders Spanish characters (like accents) correctly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_ventas_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2 className="mb-4 fw-bold" style={{ color: 'var(--primary-color)' }}>
        Historial de Ventas y Tickets
      </h2>

      {/* Advanced Filters Card */}
      <Card className="custom-card border-0 mb-4 shadow-sm">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col lg={4} md={6}>
              <Form.Label className="fw-semibold text-muted small mb-1">BUSCADOR</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <FiSearch color="var(--text-muted)" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por ID de venta o Cliente..."
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col lg={3} md={6}>
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

            <Col lg={2.5} md={6} sm={6} xs={6}>
              <Form.Label className="fw-semibold text-muted small mb-1">DESDE</Form.Label>
              <Form.Control
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </Col>

            <Col lg={2.5} md={6} sm={6} xs={6}>
              <Form.Label className="fw-semibold text-muted small mb-1">HASTA</Form.Label>
              <Form.Control
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap gap-2">
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={setTodayFilter}
                className="d-flex align-items-center gap-1 border-primary-custom"
                style={{ color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
              >
                Ventas de Hoy
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearFilters}
              >
                Limpiar Filtros
              </Button>
            </div>

            <Button
              variant="success"
              size="sm"
              onClick={exportToExcel}
              disabled={filteredSales.length === 0}
              className="d-flex align-items-center gap-2 border-0 shadow-sm px-3"
              style={{ backgroundColor: '#198754' }}
            >
              <FiDownload /> Exportar Excel
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Sales List Table */}
      <Card className="custom-card border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0 text-nowrap">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Código de Venta</th>
                  <th className="py-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Fecha y Hora</th>
                  <th className="py-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Cliente</th>
                  <th className="py-3 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Productos / Cantidad</th>
                  <th className="py-3 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Método de Pago</th>
                  <th className="py-3 text-end" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total</th>
                  <th className="px-4 py-3 text-center" style={{ width: '120px' }}>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No se encontraron registros de ventas con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  currentSales.map((sale) => {
                    const totalItemsCount = sale.items.reduce((acc, curr) => acc + curr.quantity, 0);
                    return (
                      <tr key={sale.id}>
                        <td className="px-4 py-3 fw-bold">{sale.id}</td>
                        <td>
                          <div className="d-flex align-items-center gap-1 small text-muted">
                            <FiCalendar size={13} /> {formatSaleDate(sale.date)}
                          </div>
                        </td>
                        <td className="fw-semibold" style={{ color: 'var(--primary-color)' }}>
                          {sale.clientName}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-secondary-subtle text-secondary border px-2 py-1">
                            <FiShoppingBag size={12} className="me-1" />
                            {totalItemsCount} {totalItemsCount === 1 ? 'unidad' : 'unidades'}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className="badge px-2.5 py-1.5 fw-semibold border"
                            style={getPaymentMethodStyle(sale.paymentMethod)}
                          >
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="text-end font-monospace fw-bold" style={{ color: 'var(--accent-color)' }}>
                          ${sale.total.toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 text-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenReprint(sale)}
                            className="d-flex align-items-center gap-1.5 mx-auto"
                          >
                            <FiPrinter size={13} /> Reimprimir
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 no-print px-3 pb-2">
              <span className="text-muted small">
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredSales.length)} de {filteredSales.length} ventas
              </span>
              <div className="d-flex gap-1">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  style={{ borderRadius: '6px' }}
                >
                  Anterior
                </Button>
                <span className="btn btn-sm btn-light fw-bold disabled" style={{ borderRadius: '6px' }}>
                  Pág. {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={{ borderRadius: '6px' }}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Reprint Ticket Modal */}
      <Modal show={showReprintModal} onHide={() => setShowReprintModal(false)} centered>
        <Modal.Header closeButton className="no-print border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>Reimpresión de Ticket</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <TicketLayout
            type="sale"
            data={selectedSale}
            onClose={() => setShowReprintModal(false)}
          />
        </Modal.Body>
      </Modal>

      <style>{`
        .bg-secondary-subtle {
          background-color: #f1f5f9 !important;
        }
        .border-primary-custom:hover {
          background-color: rgba(227, 209, 187, 0.15) !important;
        }
      `}</style>
    </div>
  );
}

export default SalesHistory;
