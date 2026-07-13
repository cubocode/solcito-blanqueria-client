import React, { useState } from 'react';
import { Table, Button, Form, Row, Col, Modal, Card, InputGroup, Badge, Alert } from 'react-bootstrap';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiMail, FiPhone, FiMapPin, FiFileText, FiCalendar, FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

function SuppliersManagement({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier, onAddSupplierOrder, onUpdateSupplierOrder }) {
  const showToast = useToast();
  const showConfirm = useConfirm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Active supplier for edit/delete
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // Form Supplier states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Form Order states
  const [orderAmount, setOrderAmount] = useState('');
  const [orderDetail, setOrderDetail] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [orderStatus, setOrderStatus] = useState('Pendiente');
  const [orderReceivedDate, setOrderReceivedDate] = useState(new Date().toISOString().slice(0, 10));

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm)
  );

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

  const openAddModal = () => {
    setIsEditMode(false);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormNotes('');
    setShowAddEditModal(true);
  };

  const openEditModal = (supplier) => {
    setIsEditMode(true);
    setCurrentSupplier(supplier);
    setFormName(supplier.name);
    setFormPhone(supplier.phone);
    setFormEmail(supplier.email);
    setFormAddress(supplier.address);
    setFormNotes(supplier.notes);
    setShowAddEditModal(true);
  };

  const openDeleteModal = async (supplier) => {
    const confirmed = await showConfirm(
      `¿Está seguro de que desea eliminar al proveedor ${supplier.name}? Esta acción eliminará también todos sus pedidos.`,
      'Eliminar Proveedor'
    );
    if (confirmed) {
      onDeleteSupplier(supplier.id);
    }
  };

  const handleSaveSupplier = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('El nombre del proveedor es requerido.', 'warning');
      return;
    }

    const supplierData = {
      id: isEditMode ? currentSupplier.id : undefined,
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      address: formAddress.trim(),
      notes: formNotes.trim()
    };

    if (isEditMode) {
      onUpdateSupplier(supplierData);
    } else {
      onAddSupplier(supplierData);
    }
    setShowAddEditModal(false);
  };

  const handleSaveOrder = (e) => {
    e.preventDefault();
    const amount = parseFloat(orderAmount);
    if (isNaN(amount) || amount < 0) {
      showToast('Por favor ingrese un monto de pedido válido.', 'warning');
      return;
    }

    const orderData = {
      monto: amount,
      detalle: orderDetail.trim(),
      fecha_pedido: orderDate ? new Date(orderDate) : new Date(),
      estado: orderStatus,
      fecha_recepcion: orderStatus === 'Recibido' ? (orderReceivedDate ? new Date(orderReceivedDate) : new Date()) : null
    };

    onAddSupplierOrder(selectedSupplier.id, orderData);
    setShowOrderModal(false);

    // reset forms
    setOrderAmount('');
    setOrderDetail('');
    setOrderStatus('Pendiente');
    setOrderDate(new Date().toISOString().slice(0, 10));
    setOrderReceivedDate(new Date().toISOString().slice(0, 10));
  };

  const handleMarkAsReceived = async (order) => {
    const confirmed = await showConfirm(
      '¿Desea marcar este pedido como RECIBIDO?',
      'Confirmar Recepción'
    );
    if (confirmed) {
      onUpdateSupplierOrder(selectedSupplier.id, order.id, {
        estado: 'Recibido',
        fecha_recepcion: new Date()
      });
    }
  };

  const formatOrderDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0" style={{ color: 'var(--primary-color)' }}>
          Gestión de Proveedores
        </h2>
        <Button
          variant="primary"
          onClick={openAddModal}
          className="d-flex align-items-center gap-2 border-0 shadow-sm"
          style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff' }}
        >
          <FiPlus /> Registrar Proveedor
        </Button>
      </div>

      <Row>
        {/* Left Side: Suppliers List */}
        <Col lg={5} className="mb-4 mb-lg-0">
          <Card className="custom-card border-0 mb-4 shadow-sm">
            <Card.Body className="p-2">
              <Form.Label className="fw-semibold text-muted small mb-1">BUSCADOR DE PROVEEDORES</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <FiSearch color="var(--text-muted)" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por Nombre, Email..."
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Card.Body>
          </Card>

          <Card className="custom-card border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0" style={{ cursor: 'pointer' }}>
                  <thead className="bg-light">
                    <tr>
                      <th className="px-3 py-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Proveedor</th>
                      <th className="py-3 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Pedidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center py-5 text-muted">
                          No se encontraron proveedores.
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((supplier) => {
                        const isSelected = selectedSupplier && supplier.id === selectedSupplier.id;
                        const pendingOrders = supplier.pedidos ? supplier.pedidos.filter(p => p.estado === 'Pendiente').length : 0;
                        return (
                          <tr
                            key={supplier.id}
                            onClick={() => setSelectedSupplierId(supplier.id)}
                            style={{
                              backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                              borderLeft: isSelected ? '4px solid var(--accent-color)' : '4px solid transparent'
                            }}
                          >
                            <td className="px-3 py-3">
                              <div className="fw-semibold" style={{ color: 'var(--primary-color)' }}>{supplier.name}</div>
                              <span className="text-muted small">{supplier.phone || 'Sin teléfono'}</span>
                            </td>
                            <td className="text-center">
                              {pendingOrders > 0 ? (
                                <Badge bg="warning" className="text-dark">
                                  {pendingOrders} pend.
                                </Badge>
                              ) : (
                                <span className="text-muted small">Al día</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side: Supplier File & Order Management */}
        <Col lg={7}>
          {selectedSupplier ? (
            <Card className="custom-card border-0 shadow-sm">
              <Card.Body className="p-4">
                {/* Header Info */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4 flex-wrap gap-2">
                  <div>
                    <h4 className="fw-bold mb-1" style={{ color: 'var(--primary-color)' }}>{selectedSupplier.name}</h4>
                    <span className="text-muted small">Código: SUP-{selectedSupplier.id}</span>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => openDeleteModal(selectedSupplier)}
                    >
                      <FiTrash2 /> Eliminar
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => openEditModal(selectedSupplier)}
                    >
                      <FiEdit2 /> Editar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowOrderModal(true)}
                      style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                    >
                      <FiPlus /> Registrar Pedido
                    </Button>
                  </div>
                </div>

                {/* Contact grid */}
                <Row className="g-3 mb-4">
                  <Col sm={6}>
                    <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                      <FiPhone size={14} className="text-teal" /> 
                      <strong>Teléfono:</strong> {selectedSupplier.phone || 'No registrado'}
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <FiMail size={14} className="text-teal" /> 
                      <strong>Email:</strong> {selectedSupplier.email || 'No registrado'}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="d-flex align-items-start gap-2 text-muted small">
                      <FiMapPin size={14} className="mt-1" />
                      <div>
                        <strong>Dirección:</strong><br />
                        {selectedSupplier.address || 'No registrada'}
                      </div>
                    </div>
                  </Col>
                  {selectedSupplier.notes && (
                    <Col md={12}>
                      <div className="bg-light p-2.5 rounded-3 border small text-muted">
                        <FiFileText className="me-1" /> <strong>Notas comerciales:</strong><br />
                        {selectedSupplier.notes}
                      </div>
                    </Col>
                  )}
                </Row>

                {/* Orders History List */}
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 border-top pt-4" style={{ color: 'var(--primary-color)' }}>
                  <FiClock /> Historial de Pedidos y Recepción
                </h5>

                <div className="table-responsive">
                  <Table striped hover className="align-middle text-nowrap" style={{ fontSize: '0.85rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Pedido</th>
                        <th>Detalle / Concepto</th>
                        <th className="text-end">Monto</th>
                        <th className="text-center">Estado</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedSupplier.pedidos || selectedSupplier.pedidos.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">
                            No hay pedidos registrados para este proveedor.
                          </td>
                        </tr>
                      ) : (
                        selectedSupplier.pedidos.map((order) => {
                          const isReceived = order.estado === 'Recibido';
                          return (
                            <tr key={order.id}>
                              <td>
                                <div className="fw-semibold">Pedido #{order.id}</div>
                                <span className="text-muted text-xs">F. Pedido: {formatOrderDate(order.fecha_pedido)}</span>
                              </td>
                              <td className="text-wrap" style={{ maxWidth: '200px' }}>
                                <div>{order.detalle || 'Sin detalle'}</div>
                                {isReceived && (
                                  <span className="text-success text-xs d-block">
                                    Recibido el: {formatOrderDate(order.fecha_recepcion)}
                                  </span>
                                )}
                              </td>
                              <td className="text-end font-monospace fw-bold" style={{ color: 'var(--primary-color)' }}>
                                ${order.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-center">
                                <span 
                                  className={`badge ${isReceived ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} px-2 py-1.5`}
                                  style={{
                                    backgroundColor: isReceived ? 'rgba(25, 135, 84, 0.12)' : 'rgba(255, 193, 7, 0.12)'
                                  }}
                                >
                                  {order.estado}
                                </span>
                              </td>
                              <td className="text-end">
                                {!isReceived && (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleMarkAsReceived(order)}
                                    className="py-1 px-2 d-flex align-items-center gap-1 mx-auto"
                                    title="Marcar como recibido"
                                  >
                                    <FiCheckCircle size={13} /> Recibido
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card className="custom-card border-0 text-center py-5 text-muted shadow-sm">
              <Card.Body>
                Seleccione un proveedor de la lista para ver su historial de pedidos.
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Registrar Pedido Modal */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>
            Registrar Pedido a Proveedor
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveOrder}>
          <Modal.Body className="pt-2">
            <Row className="g-3">
              <Col md={12}>
                <div className="small p-2.5 bg-light rounded-3 border mb-2">
                  Proveedor: <strong>{selectedSupplier?.name}</strong>
                </div>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">DETALLE DEL PEDIDO</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    required
                    placeholder="Ej. 30 juegos sábanas Danubio 1 plaza y media, 10 acolchados..."
                    value={orderDetail}
                    onChange={(e) => setOrderDetail(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">FECHA DEL PEDIDO</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">MONTO ESTIMADO ($)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light"><FiDollarSign /></InputGroup.Text>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">ESTADO INICIAL</Form.Label>
                  <Form.Select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Recibido">Recibido</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {orderStatus === 'Recibido' && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-muted small">FECHA DE RECEPCIÓN</Form.Label>
                    <Form.Control
                      type="date"
                      required
                      value={orderReceivedDate}
                      onChange={(e) => setOrderReceivedDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
              Registrar Pedido
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Registrar / Editar Proveedor Modal */}
      <Modal show={showAddEditModal} onHide={() => setShowAddEditModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>
            {isEditMode ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveSupplier}>
          <Modal.Body className="pt-2">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">NOMBRE DEL PROVEEDOR / RAZÓN SOCIAL</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Ej. Danubio Textil S.A."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">TELÉFONO DE CONTACTO</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej. 11-4567-8901"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">CORREO ELECTRÓNICO</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Ej. ventas@proveedor.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">DIRECCIÓN COMERCIAL</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej. Av. Corrientes 2345, CABA"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">NOTAS / CONDICIONES DE COMPRA</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Escriba aquí plazos de entrega, descuentos especiales, días de visita del vendedor, etc..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowAddEditModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
            >
              {isEditMode ? 'Guardar Cambios' : 'Registrar Proveedor'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default SuppliersManagement;
