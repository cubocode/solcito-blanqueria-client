import { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Table, Card, Modal, InputGroup } from 'react-bootstrap';
import { FiTrash2, FiSearch, FiShoppingCart, FiUser, FiCheckCircle, FiPlus, FiMinus } from 'react-icons/fi';
import TicketLayout from './TicketLayout';
import { useToast } from '../context/ToastContext';

function SalesPanel({ 
  products, 
  clients, 
  onAddSale, 
  cashSession,
  cart,
  setCart,
  paymentMethod,
  setPaymentMethod,
  selectedClientId,
  setSelectedClientId
}) {
  const showToast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentSaleReceipt, setCurrentSaleReceipt] = useState(null);

  // Search handler (live database query with 300ms debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim() === '') {
        setSearchResults([]);
        return;
      }
      try {
        const response = await fetch(`http://localhost:3001/api/productos?q=${encodeURIComponent(searchTerm)}`);
        if (response.ok) {
          const data = await response.json();
          // Map backend products to the POS selector items format
          const mapped = data.map((prod) => ({
            id: prod.codigo,
            dbProductId: prod.id,
            name: prod.nombre,
            category: prod.categoria,
            measure: prod.kit?.nombre || '-',
            stock: prod.cantidad,
            minStock: prod.umbral,
            costPrice: parseFloat(prod.precio_costo) || 0,
            salePrice: parseFloat(prod.precio_venta) || 0,
            supplier: prod.kit?.nombre || 'General'
          }));
          setSearchResults(mapped);
        }
      } catch (err) {
        console.error('Error al realizar búsqueda en BD:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Add to cart
  const addToCart = (product) => {
    // Check stock
    const existingCartItem = cart.find(item => item.id === product.id);
    const currentQty = existingCartItem ? existingCartItem.quantity : 0;

    if (product.stock <= currentQty) {
      showToast(`No hay stock suficiente de ${product.name}. Stock actual: ${product.stock}`, 'warning');
      return;
    }

    if (existingCartItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.salePrice }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        salePrice: product.salePrice,
        quantity: 1,
        subtotal: product.salePrice,
        maxStock: product.stock
      }]);
    }
    setSearchTerm('');
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Modify quantity
  const updateQuantity = (productId, delta) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.maxStock) {
      showToast(`No se puede vender más del stock actual (${item.maxStock})`, 'warning');
      return;
    }

    setCart(cart.map(i =>
      i.id === productId
        ? { ...i, quantity: newQty, subtotal: newQty * i.salePrice }
        : i
    ));
  };

  // Calculate totals
  const totalSale = cart.reduce((acc, curr) => acc + curr.subtotal, 0);

  // Client checks
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const isSuspended = selectedClient?.status === 'Suspendido';
  const overCreditLimit = selectedClient
    ? (selectedClient.balance + totalSale > selectedClient.creditLimit)
    : false;

  // Decide if checkout is allowed (enforcing that shift must be open)
  const isCheckoutDisabled = cart.length === 0 || !cashSession ||
    (paymentMethod === 'Cuenta Corriente' && (!selectedClientId || isSuspended || overCreditLimit));

  // Confirm Sale
  const handleConfirmSale = async () => {
    if (isCheckoutDisabled) return;

    const newSale = {
      date: new Date().toISOString(),
      clientName: selectedClient ? selectedClient.name : 'Consumidor Final',
      clientId: selectedClientId ? parseInt(selectedClientId, 10) : null,
      paymentMethod,
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        salePrice: item.salePrice,
        subtotal: item.subtotal
      })),
      total: totalSale
    };

    const dbSale = await onAddSale(newSale);
    if (dbSale) {
      setCurrentSaleReceipt(dbSale);
      setShowReceiptModal(true);
      setCart([]);
      setSelectedClientId('');
      setPaymentMethod('Efectivo');
    }
  };

  return (
    <div>
      <h2 className="mb-4 fw-bold" style={{ color: 'var(--primary-color)' }}>
        Venta
      </h2>

      <Row>
        {/* Left Side: Product Search and Cart */}
        <Col lg={8} className="mb-4 mb-lg-0">
          <Card className="custom-card border-0 mb-4">
            <Card.Body className="p-2">
              <Form.Label className="fw-bold text-muted mb-2">BUSCAR PRODUCTOS</Form.Label>
              <InputGroup className="mb-3 shadow-sm rounded">
                <InputGroup.Text className="bg-white border-end-0">
                  <FiSearch color="var(--text-muted)" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Ingrese código o nombre del producto..."
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              {/* Search Results Dropdown List */}
              {searchResults.length > 0 && (
                <div
                  className="border rounded shadow-sm bg-white overflow-auto mb-3"
                  style={{ maxHeight: '250px', position: 'relative', zIndex: 100 }}
                >
                  {searchResults.map((product) => {
                    const isLowStock = product.stock <= product.minStock;
                    const isOutOfStock = product.stock === 0;
                    return (
                      <div
                        key={product.id}
                        onClick={() => !isOutOfStock && addToCart(product)}
                        className={`d-flex justify-content-between align-items-center p-3 border-bottom ${isOutOfStock ? 'opacity-50 bg-light cursor-not-allowed' : 'cursor-pointer hover-bg-light'
                          }`}
                        style={{ cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                      >
                        <div>
                          <strong style={{ color: 'var(--primary-color)' }}>{product.name}</strong>
                          <div className="text-muted small">
                            Cod: {product.id} | Medida: {product.measure} | Proveedor: {product.supplier}
                          </div>
                        </div>
                        <div className="text-end">
                          <strong className="d-block" style={{ color: 'var(--accent-color)' }}>
                            ${product.salePrice.toLocaleString('es-AR')}
                          </strong>
                          <span className={`badge-pill-custom badge ${isOutOfStock ? 'bg-danger' : isLowStock ? 'bg-warning text-dark' : 'bg-success'
                            }`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Cart Table Card */}
          <Card className="custom-card border-0">
            <Card.Body className="p-0">
              <div className="d-flex align-items-center mb-3 p-3 border-bottom">
                <FiShoppingCart size={20} className="me-2 text-teal" style={{ color: 'var(--accent-color)' }} />
                <h5 className="mb-0 fw-bold" style={{ color: 'var(--primary-color)' }}>Detalle de Venta</h5>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FiShoppingCart size={48} className="mb-3 opacity-25" />
                  <p className="mb-0">El carrito está vacío. Busque y agregue productos.</p>
                </div>
              ) : (
                <div className="table-responsive px-3 pb-3">
                  <Table hover className="cart-table text-nowrap">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="text-center" style={{ width: '130px' }}>Cantidad</th>
                        <th className="text-end">Precio Unit.</th>
                        <th className="text-end">Subtotal</th>
                        <th className="text-center" style={{ width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="fw-semibold text-truncate" style={{ maxWidth: '280px', color: 'var(--primary-color)' }}>
                              {item.name}
                            </div>
                            <span className="text-muted small">Cod: {item.id}</span>
                          </td>
                          <td>
                            <div className="quantity-control justify-content-center">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="p-1 rounded-circle d-flex align-items-center"
                                style={{ width: '26px', height: '26px' }}
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <FiMinus size={12} />
                              </Button>
                              <span className="fw-bold px-2">{item.quantity}</span>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="p-1 rounded-circle d-flex align-items-center"
                                style={{ width: '26px', height: '26px' }}
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <FiPlus size={12} />
                              </Button>
                            </div>
                          </td>
                          <td className="text-end font-monospace">
                            ${item.salePrice.toLocaleString('es-AR')}
                          </td>
                          <td className="text-end font-monospace fw-bold" style={{ color: 'var(--primary-color)' }}>
                            ${item.subtotal.toLocaleString('es-AR')}
                          </td>
                          <td className="text-center">
                            <Button
                              variant="link"
                              className="text-danger p-0"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <FiTrash2 size={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side: Sale Summary, Client and Payment Selector */}
        <Col lg={4}>
          <Card className="custom-card border-0 sticky-top" style={{ top: '20px' }}>
            <Card.Body className="p-3">
              <h5 className="card-title-accent">RESUMEN DE VENTA</h5>

              {/* Selector de Cliente */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-muted d-flex align-items-center gap-1">
                  <FiUser /> Cliente
                </Form.Label>
                <Form.Select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="rounded-3 shadow-xs"
                >
                  <option value="">Consumidor Final</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.balance > 0 ? `(Deuda: $${c.balance})` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Selector de Método de Pago */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-muted">Método de Pago</Form.Label>
                <Form.Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="rounded-3"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="QR">Mercado Pago / QR</option>
                  <option value="Cuenta Corriente">Cuenta Corriente (Al Fiado)</option>
                </Form.Select>
              </Form.Group>

              {/* Cash closed warning */}
              {!cashSession && (
                <div className="alert alert-danger py-2.5 px-3 text-start small mb-4 fw-bold">
                  ❌ La caja está cerrada. Para facturar, debe abrir el turno en "Control de Caja".
                </div>
              )}

              {/* Client Credit Account Alerts */}
              {paymentMethod === 'Cuenta Corriente' && selectedClient && (
                <div className="p-3 mb-4 rounded-3 border bg-light text-start" style={{ fontSize: '0.85rem' }}>
                  <div className="fw-bold mb-1" style={{ color: 'var(--primary-color)' }}>Estado de Cuenta Corriente:</div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Estado Cliente:</span>
                    <span className={`fw-bold ${isSuspended ? 'text-danger' : 'text-success'}`}>{selectedClient.status}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Límite de Crédito:</span>
                    <span className="fw-bold">${selectedClient.creditLimit.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Deuda Actual:</span>
                    <span className="fw-bold text-danger">${selectedClient.balance.toLocaleString('es-AR')}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between fw-bold mb-1">
                    <span>Proyección Deuda:</span>
                    <span style={{ color: overCreditLimit ? 'var(--danger-color)' : 'inherit' }}>
                      ${(selectedClient.balance + totalSale).toLocaleString('es-AR')}
                    </span>
                  </div>

                  {isSuspended && (
                    <div className="text-danger fw-bold mt-2 d-flex align-items-center gap-1">
                      ⚠️ El cliente está SUSPENDIDO. Venta bloqueada.
                    </div>
                  )}
                  {overCreditLimit && (
                    <div className="text-danger fw-bold mt-2 d-flex align-items-center gap-1">
                      ⚠️ Supera límite de crédito. Venta bloqueada.
                    </div>
                  )}
                </div>
              )}

              {/* Warnings for bad setup */}
              {paymentMethod === 'Cuenta Corriente' && !selectedClientId && (
                <div className="alert alert-warning py-2 px-3 text-start small mb-4">
                  ⚠️ Debe seleccionar un cliente registrado para vender por Cuenta Corriente.
                </div>
              )}

              {/* Totales */}
              <div className="bg-light p-3 rounded-3 mb-4">
                <div className="d-flex justify-content-between text-muted mb-2 fw-medium">
                  <span>Subtotal:</span>
                  <span>${totalSale.toLocaleString('es-AR')}</span>
                </div>
                <div className="d-flex justify-content-between text-muted mb-2 fw-medium">
                  <span>Descuentos / Impuestos:</span>
                  <span>$0</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold align-items-center">
                  <span className="fs-5" style={{ color: 'var(--primary-color)' }}>TOTAL:</span>
                  <span className="fs-4 text-teal" style={{ color: 'var(--accent-color)' }}>
                    ${totalSale.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Confirm Button */}
              <Button
                variant="primary"
                className="w-100 py-3 fs-5 rounded-3 d-flex align-items-center justify-content-center gap-2 border-0 shadow"
                style={{
                  backgroundColor: isCheckoutDisabled ? '#cbd5e1' : 'var(--accent-color)',
                  color: '#ffffff',
                  cursor: isCheckoutDisabled ? 'not-allowed' : 'pointer'
                }}
                disabled={isCheckoutDisabled}
                onClick={handleConfirmSale}
              >
                <FiCheckCircle size={22} /> Confirmar Venta
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Printable Digital Receipt Modal */}
      <Modal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="no-print border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>Comprobante de Venta</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <TicketLayout
            type="sale"
            data={currentSaleReceipt}
            onClose={() => setShowReceiptModal(false)}
          />
        </Modal.Body>
      </Modal>

      <style>{`
        .cursor-pointer:hover {
          background-color: var(--accent-light);
        }
        .hover-bg-light:hover {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
}

export default SalesPanel;
