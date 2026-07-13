import { useState } from 'react';
import { Row, Col, Table, Button, Card, Form, Modal, InputGroup, Alert } from 'react-bootstrap';
import { FiSearch, FiUserPlus, FiDollarSign, FiClock, FiCheck, FiSlash, FiAlertCircle, FiEdit2 } from 'react-icons/fi';
import TicketLayout from './TicketLayout';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

function CurrentAccounts({ clients, onAddClient, onUpdateClient, onAddClientMovement, onChangeClientStatus, cashSession }) {
  const showToast = useToast();
  const showConfirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');

  // Modals state
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Receipt data
  const [currentReceiptData, setCurrentReceiptData] = useState(null);

  // Form Client states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientLimit, setClientLimit] = useState(30000);

  // Edit Client states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLimit, setEditLimit] = useState(30000);

  // Form Payment states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentDesc, setPaymentDesc] = useState('Entrega de dinero a cuenta');

  // Filter clients
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      showToast('Por favor ingrese el nombre del cliente', 'warning');
      return;
    }

    const newClient = {
      id: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      name: clientName,
      phone: clientPhone,
      creditLimit: parseFloat(clientLimit) || 20000,
      balance: 0,
      status: 'Activo',
      movements: []
    };

    onAddClient(newClient);
    setSelectedClientId(newClient.id);
    setShowAddClientModal(false);

    // Clear forms
    setClientName('');
    setClientPhone('');
    setClientLimit(30000);
  };

  const handleOpenEdit = () => {
    if (!selectedClient) return;
    setEditName(selectedClient.name);
    setEditPhone(selectedClient.phone === '-' ? '' : selectedClient.phone);
    setEditLimit(selectedClient.creditLimit);
    setShowEditClientModal(true);
  };

  const handleEditClient = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Por favor ingrese el nombre del cliente.', 'warning');
      return;
    }

    onUpdateClient({
      id: selectedClient.id,
      name: editName.trim(),
      phone: editPhone.trim(),
      creditLimit: parseFloat(editLimit) || 0
    });
    setShowEditClientModal(false);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Por favor ingrese un monto válido mayor a cero.', 'warning');
      return;
    }

    if (amount > selectedClient.balance) {
      const confirmed = await showConfirm(`El monto abonado ($${amount}) supera la deuda actual ($${selectedClient.balance}). ¿Desea registrar saldo a favor?`, 'Registrar Pago');
      if (!confirmed) {
        return;
      }
    }

    const movementId = `REC-${Date.now().toString().slice(-4)}`;
    const prevBalance = selectedClient.balance;
    const newBalanceResult = prevBalance - amount;

    const newMovement = {
      id: movementId,
      date: new Date().toISOString(),
      type: 'Pago/Entrega',
      amount: amount,
      balanceResult: newBalanceResult,
      description: `${paymentDesc} (${paymentMethod})`
    };

    // Callback to update parent state
    onAddClientMovement(selectedClient.id, newMovement);

    // Prepare data for printable receipt modal
    setCurrentReceiptData({
      id: movementId,
      date: newMovement.date,
      clientName: selectedClient.name,
      clientId: selectedClient.id,
      amount: amount,
      description: newMovement.description,
      previousBalance: prevBalance,
      balanceResult: newBalanceResult
    });

    // Toggle modals
    setShowPaymentModal(false);
    setShowReceiptModal(true);

    // Clear forms
    setPaymentAmount('');
    setPaymentDesc('Entrega de dinero a cuenta');
    setPaymentMethod('Efectivo');
  };

  const toggleClientStatus = (client) => {
    const newStatus = client.status === 'Activo' ? 'Suspendido' : 'Activo';
    onChangeClientStatus(client.id, newStatus);
  };

  // Helper to format movement date
  const formatMovDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0" style={{ color: 'var(--primary-color)' }}>
          Cuentas Corrientes (Clientes)
        </h2>
        <Button
          variant="primary"
          onClick={() => setShowAddClientModal(true)}
          className="d-flex align-items-center gap-2 border-0 shadow-sm"
          style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff' }}
        >
          <FiUserPlus /> Registrar Cliente
        </Button>
      </div>

      <Row>
        {/* Left Side: Client List */}
        <Col lg={5} className="mb-4 mb-lg-0">
          <Card className="custom-card border-0 mb-4">
            <Card.Body className="p-2">
              <Form.Label className="fw-semibold text-muted small mb-1">BUSCADOR DE CLIENTES</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <FiSearch color="var(--text-muted)" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por Nombre o Teléfono..."
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Card.Body>
          </Card>

          <Card className="custom-card border-0">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0" style={{ cursor: 'pointer' }}>
                  <thead className="bg-light">
                    <tr>
                      <th className="px-3 py-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Cliente</th>
                      <th className="py-3 text-end" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Deuda</th>
                      <th className="py-3 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-5 text-muted">
                          No se encontraron clientes.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const isSelected = client.id === selectedClientId;
                        return (
                          <tr
                            key={client.id}
                            onClick={() => setSelectedClientId(client.id)}
                            style={{
                              backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                              borderLeft: isSelected ? '4px solid var(--accent-color)' : '4px solid transparent'
                            }}
                          >
                            <td className="px-3 py-3">
                              <div className="fw-semibold" style={{ color: 'var(--primary-color)' }}>{client.name}</div>
                              <span className="text-muted small">Tel: {client.phone}</span>
                            </td>
                            <td className="text-end font-monospace fw-bold" style={{ color: client.balance > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                              ${client.balance.toLocaleString('es-AR')}
                            </td>
                            <td className="text-center">
                              <span className={`badge-pill-custom badge ${client.status === 'Activo' ? 'bg-success' : 'bg-danger'}`}>
                                {client.status}
                              </span>
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

        {/* Right Side: Ledger Detail & Transaction History */}
        <Col lg={7}>
          {selectedClient ? (
            <Card className="custom-card border-0">
              <Card.Body className="p-3">
                {/* Client Profile Header */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
                  <div>
                    <h4 className="fw-bold mb-1" style={{ color: 'var(--primary-color)' }}>{selectedClient.name}</h4>
                    <span className="text-muted small">ID Cliente: {selectedClient.id} | Tel: {selectedClient.phone || 'Sin teléfono'}</span>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant={selectedClient.status === 'Activo' ? 'outline-danger' : 'outline-success'}
                      size="sm"
                      onClick={() => toggleClientStatus(selectedClient)}
                      className="d-flex align-items-center gap-1"
                    >
                      {selectedClient.status === 'Activo' ? <FiSlash /> : <FiCheck />}
                      {selectedClient.status === 'Activo' ? 'Suspender' : 'Activar'}
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleOpenEdit}
                      className="d-flex align-items-center gap-1"
                    >
                      <FiEdit2 size={13} /> Editar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                      className="d-flex align-items-center gap-1 border-0 shadow-xs"
                      style={{ backgroundColor: 'var(--accent-color)' }}
                      disabled={selectedClient.status === 'Suspendido'}
                    >
                      <FiDollarSign /> Registrar Pago
                    </Button>
                  </div>
                </div>

                {/* Credit Limit and balance status */}
                <Row className="g-3 mb-4">
                  <Col sm={6}>
                    <div className="bg-light p-3 rounded-3 border">
                      <span className="text-muted d-block small mb-1">DEUDA ACTUAL</span>
                      <h4 className="fw-bold font-monospace m-0 text-danger">
                        ${selectedClient.balance.toLocaleString('es-AR')}
                      </h4>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="bg-light p-3 rounded-3 border">
                      <span className="text-muted d-block small mb-1">LÍMITE DE CRÉDITO</span>
                      <h4 className="fw-bold font-monospace m-0" style={{ color: 'var(--primary-color)' }}>
                        ${selectedClient.creditLimit.toLocaleString('es-AR')}
                      </h4>
                    </div>
                  </Col>
                </Row>

                {/* Warning if balance reaches limit */}
                {selectedClient.balance >= selectedClient.creditLimit * 0.9 && (
                  <Alert variant="warning" className="d-flex align-items-center gap-2 py-2 mb-4">
                    <FiAlertCircle size={18} className="text-warning-dark" />
                    <div>
                      <strong>Alerta de límite:</strong> El cliente ha utilizado el {((selectedClient.balance / selectedClient.creditLimit) * 100).toFixed(0)}% de su crédito disponible.
                    </div>
                  </Alert>
                )}

                {/* Ledger History List */}
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--primary-color)' }}>
                  <FiClock /> Historial de Movimientos (Ficha de Cta. Cte.)
                </h5>

                <div className="table-responsive">
                  <Table striped hover className="align-middle text-nowrap" style={{ fontSize: '0.9rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Fecha</th>
                        <th>Concepto / Detalle</th>
                        <th>Tipo</th>
                        <th className="text-end">Monto</th>
                        <th className="text-end">Saldo Resultante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClient.movements.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">
                            No hay movimientos registrados para este cliente.
                          </td>
                        </tr>
                      ) : (
                        selectedClient.movements.map((mov) => {
                          const isPayment = mov.type === 'Pago/Entrega';
                          return (
                            <tr key={mov.id}>
                              <td className="text-muted">{formatMovDate(mov.date)}</td>
                              <td>
                                <div className="fw-semibold">{mov.description}</div>
                              </td>
                              <td>
                                <span className={`badge ${isPayment ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2 py-1`}>
                                  {mov.type}
                                </span>
                              </td>
                              <td className={`text-end fw-semibold font-monospace ${isPayment ? 'text-success' : 'text-danger'}`}>
                                {isPayment ? '-' : '+'}${mov.amount.toLocaleString('es-AR')}
                              </td>
                              <td className="text-end font-monospace fw-bold" style={{ color: 'var(--primary-color)' }}>
                                ${mov.balanceResult.toLocaleString('es-AR')}
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
            <Card className="custom-card border-0 text-center py-5 text-muted">
              <Card.Body>
                Seleccione un cliente de la lista para ver su ficha y movimientos.
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Add Client Modal */}
      <Modal show={showAddClientModal} onHide={() => setShowAddClientModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>Registrar Cliente Cta Cte</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateClient}>
          <Modal.Body className="pt-2">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">NOMBRE Y APELLIDO</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">TELÉFONO</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej. 341-1567890"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">LÍMITE DE CRÉDITO AUTOMÁTICO ($)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1000"
                    step="100"
                    required
                    value={clientLimit}
                    onChange={(e) => setClientLimit(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowAddClientModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
              Registrar Cliente
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal show={showEditClientModal} onHide={() => setShowEditClientModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>Editar Datos del Cliente</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditClient}>
          <Modal.Body className="pt-2">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">NOMBRE Y APELLIDO</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">TELÉFONO</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej. 341-1567890"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">LÍMITE DE CRÉDITO ($)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowEditClientModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
              Guardar Cambios
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Record Payment/Delivery Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>Registrar Entrega de Dinero</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRecordPayment}>
          <Modal.Body className="pt-2">
            <div className="mb-3 text-start small p-3 bg-light rounded-3 border">
              <div>Cliente: <strong>{selectedClient?.name}</strong></div>
              <div>Deuda Pendiente: <strong className="text-danger">${selectedClient?.balance.toLocaleString('es-AR')}</strong></div>
            </div>

            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">MONTO ABONADO ($)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="Monto entregado por el cliente"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">MÉTODO DE PAGO</Form.Label>
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="QR">Código QR / Mercado Pago</option>
                    <option value="Tarjeta">Tarjeta de Débito / Crédito</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {paymentMethod === 'Efectivo' && !cashSession && (
                <Col md={12}>
                  <Alert variant="warning" className="py-2 px-3 small mb-0 mt-2">
                    ⚠️ La caja está cerrada. El cobro se registrará, pero no se sumará a ningún arqueo de caja activo.
                  </Alert>
                </Col>
              )}

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">CONCEPTO / DESCRIPCIÓN</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej. Entrega a cuenta en efectivo"
                    value={paymentDesc}
                    onChange={(e) => setPaymentDesc(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
              Confirmar Pago
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="no-print border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>Comprobante de Recibo de Pago</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <TicketLayout
            type="receipt"
            data={currentReceiptData}
            onClose={() => setShowReceiptModal(false)}
          />
        </Modal.Body>
      </Modal>

      <style>{`
        .bg-success-subtle {
          background-color: rgba(25, 135, 84, 0.1) !important;
        }
        .bg-danger-subtle {
          background-color: rgba(220, 53, 69, 0.1) !important;
        }
        .text-xs {
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}

export default CurrentAccounts;
