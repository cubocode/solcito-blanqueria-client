import { useState } from 'react';
import { Row, Col, Card, Button, Form, Table, Modal, InputGroup, Alert } from 'react-bootstrap';
import { FiPlay, FiStopCircle, FiDollarSign, FiPlusCircle, FiTrendingUp, FiCheckCircle, FiAlertTriangle, FiBookOpen } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';

function CashControl({ cashSession, cashHistory, onOpenCash, onAddCashMovement, onCloseCash }) {
  const showToast = useToast();
  const [currentPageHistory, setCurrentPageHistory] = useState(1);
  // Manual Inflow/Outflow Modal state
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState('Ingreso');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementConcept, setMovementConcept] = useState('');

  // Shift Opening Form state
  const [initialAmount, setInitialAmount] = useState('5000');

  // Shift Closing Form states
  const [realAmount, setRealAmount] = useState('');
  const [observations, setObservations] = useState('');

  // Handle opening
  const handleOpen = (e) => {
    e.preventDefault();
    const amount = parseFloat(initialAmount);
    if (isNaN(amount) || amount < 0) {
      showToast('Por favor ingrese un monto inicial válido.', 'warning');
      return;
    }
    onOpenCash(amount);
  };

  // Handle manual movement
  const handleSaveMovement = (e) => {
    e.preventDefault();
    const amount = parseFloat(movementAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Por favor ingrese un monto válido mayor a cero.', 'warning');
      return;
    }
    if (!movementConcept.trim()) {
      showToast('Por favor ingrese un concepto para el movimiento.', 'warning');
      return;
    }

    onAddCashMovement(movementType, amount, movementConcept);
    setShowMovementModal(false);
    setMovementAmount('');
    setMovementConcept('');
  };

  // Handle closing
  const handleClose = (e) => {
    e.preventDefault();
    const real = parseFloat(realAmount);
    if (isNaN(real) || real < 0) {
      showToast('Por favor ingrese el monto real contado en caja.', 'warning');
      return;
    }

    const theoretical = cashSession.initialAmount + cashSession.salesCash + cashSession.clientPaymentsCash + cashSession.manualInflow - cashSession.manualOutflow;
    const diff = real - theoretical;

    onCloseCash(real, diff, observations);
    setRealAmount('');
    setObservations('');
  };

  // Helpers to format date/time
  const formatDateTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  // Calculation of theoretical balance for active session
  const getTheoreticalBalance = () => {
    if (!cashSession) return 0;
    return (
      cashSession.initialAmount +
      cashSession.salesCash +
      cashSession.clientPaymentsCash +
      cashSession.manualInflow -
      cashSession.manualOutflow
    );
  };

  const theoreticalBalance = getTheoreticalBalance();
  const closingDifference = realAmount !== '' ? parseFloat(realAmount) - theoreticalBalance : 0;

  const historyPerPage = 10;
  const totalHistoryPages = Math.ceil(cashHistory.length / historyPerPage);
  const indexOfLastHistory = currentPageHistory * historyPerPage;
  const indexOfFirstHistory = indexOfLastHistory - historyPerPage;
  const sortedHistory = [...cashHistory].sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));
  const currentHistory = sortedHistory.slice(indexOfFirstHistory, indexOfLastHistory);

  return (
    <div>
      <h2 className="mb-4 fw-bold" style={{ color: 'var(--primary-color)' }}>
        Control y Arqueo de Caja
      </h2>

      {/* 1. CLOSED CASH STATE - OPENING FORM */}
      {!cashSession ? (
        <Row className="mb-4">
          <Col md={6} className="mx-auto">
            <Card className="custom-card border-0 text-center shadow-lg py-4">
              <Card.Body>
                <div
                  className="metric-icon-wrapper mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(15, 23, 42, 0.05)', color: 'var(--primary-color)', width: '64px', height: '64px', borderRadius: '50%' }}
                >
                  <FiStopCircle size={32} />
                </div>
                <h4 className="fw-bold mb-2" style={{ color: 'var(--primary-color)' }}>Caja Cerrada</h4>
                <p className="text-muted mb-4">Para comenzar a facturar ventas en efectivo y registrar movimientos, abra la caja ingresando el monto inicial disponible.</p>

                <Form onSubmit={handleOpen} className="text-start">
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-muted small">EFECTIVO INICIAL EN CAJA ($)</Form.Label>
                    <InputGroup className="shadow-sm">
                      <InputGroup.Text className="bg-white border-end-0">
                        <FiDollarSign color="var(--text-muted)" />
                      </InputGroup.Text>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className="border-start-0 ps-0 fw-bold fs-5"
                        placeholder="0.00"
                        value={initialAmount}
                        onChange={(e) => setInitialAmount(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 py-2.5 fs-6 border-0 rounded-3 shadow d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  >
                    <FiPlay /> Abrir Turno de Caja
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        // 2. OPEN CASH STATE - ACTIVE SESSION DASHBOARD
        <Row className="mb-4">
          <Col lg={8} className="mb-4 mb-lg-0">
            {/* Session status banner */}
            <Alert variant="success" className="d-flex align-items-center justify-content-between mb-4 py-3 shadow-sm border-0 rounded-3 text-success">
              <div className="d-flex align-items-center gap-2">
                <FiCheckCircle size={20} />
                <div>
                  <strong>Caja Abierta</strong> — Operador: Admin | Apertura: {formatDateTime(cashSession.openedAt)}
                </div>
              </div>
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => setShowMovementModal(true)}
                className="d-flex align-items-center gap-1 bg-white"
              >
                <FiPlusCircle /> Registrar Mov. Manual
              </Button>
            </Alert>

            {/* Realtime indicators */}
            <Row className="g-3 mb-4">
              <Col xs={6} sm={4}>
                <div className="bg-white p-3 rounded-3 border shadow-xs text-start">
                  <span className="text-muted d-block small mb-1">MONTO INICIAL</span>
                  <h5 className="fw-bold font-monospace m-0 text-dark">
                    ${cashSession.initialAmount.toLocaleString('es-AR')}
                  </h5>
                </div>
              </Col>
              <Col xs={6} sm={4}>
                <div className="bg-white p-3 rounded-3 border shadow-xs text-start">
                  <span className="text-muted d-block small mb-1">VENTAS EFECTIVO (+)</span>
                  <h5 className="fw-bold font-monospace m-0 text-success">
                    +${cashSession.salesCash.toLocaleString('es-AR')}
                  </h5>
                </div>
              </Col>
              <Col xs={6} sm={4}>
                <div className="bg-white p-3 rounded-3 border shadow-xs text-start">
                  <span className="text-muted d-block small mb-1">COBROS CTA CTE (+)</span>
                  <h5 className="fw-bold font-monospace m-0 text-success">
                    +${cashSession.clientPaymentsCash.toLocaleString('es-AR')}
                  </h5>
                </div>
              </Col>
              <Col xs={6} sm={4}>
                <div className="bg-white p-3 rounded-3 border shadow-xs text-start">
                  <span className="text-muted d-block small mb-1">INGRESOS EXTRA (+)</span>
                  <h5 className="fw-bold font-monospace m-0 text-success">
                    +${cashSession.manualInflow.toLocaleString('es-AR')}
                  </h5>
                </div>
              </Col>
              <Col xs={6} sm={4}>
                <div className="bg-white p-3 rounded-3 border shadow-xs text-start">
                  <span className="text-muted d-block small mb-1">EGRESOS/GASTOS (-)</span>
                  <h5 className="fw-bold font-monospace m-0 text-danger">
                    -${cashSession.manualOutflow.toLocaleString('es-AR')}
                  </h5>
                </div>
              </Col>
              <Col xs={6} sm={4}>
                <div className="bg-light p-3 rounded-3 border shadow-xs text-start">
                  <span className="text-muted d-block small mb-1">SALDO TEÓRICO CAJA</span>
                  <h5 className="fw-bold font-monospace m-0 text-teal" style={{ color: 'var(--accent-color)' }}>
                    ${theoreticalBalance.toLocaleString('es-AR')}
                  </h5>
                </div>
              </Col>
            </Row>

            {/* Non-cash controls */}
            <Card className="custom-card border-0 mb-4 bg-light-subtle">
              <Card.Body className="p-3">
                <h6 className="fw-bold mb-3 text-muted d-flex align-items-center gap-1">
                  <FiTrendingUp /> CONTROL GENERAL OTROS MEDIOS (TARJETA / TRANSFERENCIAS)
                </h6>
                <Row className="g-3">
                  <Col sm={4}>
                    <div className="bg-white p-2.5 rounded-2 border small">
                      <span className="text-muted d-block mb-1">Total Tarjetas:</span>
                      <strong className="text-dark font-monospace">${cashSession.otherPaymentMethods.Tarjeta.toLocaleString('es-AR')}</strong>
                    </div>
                  </Col>
                  <Col sm={4}>
                    <div className="bg-white p-2.5 rounded-2 border small">
                      <span className="text-muted d-block mb-1">Total Transferencias:</span>
                      <strong className="text-dark font-monospace">${cashSession.otherPaymentMethods.Transferencia.toLocaleString('es-AR')}</strong>
                    </div>
                  </Col>
                  <Col sm={4}>
                    <div className="bg-white p-2.5 rounded-2 border small">
                      <span className="text-muted d-block mb-1">Total QR / MP:</span>
                      <strong className="text-dark font-monospace">${cashSession.otherPaymentMethods.QR.toLocaleString('es-AR')}</strong>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* List of current shift movements */}
            <Card className="custom-card border-0">
              <Card.Body className="p-0">
                <div className="d-flex align-items-center justify-content-between mb-3 p-3 border-bottom">
                  <h5 className="mb-0 fw-bold" style={{ color: 'var(--primary-color)' }}>
                    Movimientos del Turno Activo
                  </h5>
                  <span className="badge bg-secondary">{cashSession.movements.length} transacciones</span>
                </div>

                <div className="table-responsive px-3 pb-3">
                  <Table striped hover className="align-middle text-nowrap small">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Concepto / Descripción</th>
                        <th>Tipo</th>
                        <th className="text-end">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashSession.movements.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-muted">
                            No hay movimientos registrados en este turno aún.
                          </td>
                        </tr>
                      ) : (
                        [...cashSession.movements]
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((mov, idx) => {
                            const isOutflow = mov.type === 'Egreso' || mov.type === 'Gasto';
                            //const isInflow = mov.type === 'Ingreso' || mov.type === 'Venta' || mov.type === 'Cobro';
                            return (
                              <tr key={idx}>
                                <td className="text-muted">{new Date(mov.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="fw-semibold">{mov.concept}</td>
                                <td>
                                  <span className={`badge ${isOutflow ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'
                                    }`}>
                                    {mov.type}
                                  </span>
                                </td>
                                <td className={`text-end fw-bold font-monospace ${isOutflow ? 'text-danger' : 'text-success'
                                  }`}>
                                  {isOutflow ? '-' : '+'}${mov.amount.toLocaleString('es-AR')}
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

          {/* Right Side: Cash Reconciliation and Close */}
          <Col lg={4}>
            <Card className="custom-card border-0 sticky-top" style={{ top: '20px' }}>
              <Card.Body className="p-3">
                <h5 className="card-title-accent">RECONCILIACIÓN Y ARQUEO</h5>

                <Form onSubmit={handleClose}>
                  {/* Saldo Teorico */}
                  <div className="bg-light p-3 rounded-3 mb-3 border">
                    <span className="text-muted d-block small mb-1 fw-semibold">SALDO TEÓRICO (SISTEMA)</span>
                    <h3 className="fw-bold font-monospace m-0 text-dark">
                      ${theoreticalBalance.toLocaleString('es-AR')}
                    </h3>
                  </div>

                  {/* Arqueo Real */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-muted small">EFECTIVO REAL EN CAJA ($)</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white">
                        <FiDollarSign />
                      </InputGroup.Text>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className="fw-bold text-dark font-monospace"
                        placeholder="Monto contado físico"
                        value={realAmount}
                        onChange={(e) => setRealAmount(e.target.value)}
                      />
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Ingrese el total de billetes/monedas contados físicamente.
                    </Form.Text>
                  </Form.Group>

                  {/* Difference display */}
                  {realAmount !== '' && (
                    <div className="p-3 rounded-3 mb-3 text-start border bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted">Diferencia de Arqueo:</span>
                        <strong className={`font-monospace ${closingDifference === 0
                          ? 'text-success'
                          : closingDifference > 0
                            ? 'text-primary'
                            : 'text-danger'
                          }`}>
                          {closingDifference > 0 ? '+' : ''}${closingDifference.toLocaleString('es-AR')}
                        </strong>
                      </div>

                      {closingDifference === 0 && (
                        <div className="text-success small fw-bold d-flex align-items-center gap-1">
                          <FiCheckCircle /> La caja cuadra perfectamente.
                        </div>
                      )}
                      {closingDifference > 0 && (
                        <div className="text-primary small fw-bold d-flex align-items-center gap-1">
                          <FiTrendingUp /> Sobrante registrado en caja.
                        </div>
                      )}
                      {closingDifference < 0 && (
                        <div className="text-danger small fw-bold d-flex align-items-center gap-1">
                          <FiAlertTriangle /> Faltante de dinero detectado.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Observations */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-muted small">OBSERVACIONES DE CIERRE</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Indique motivos de diferencias, retiro de efectivo u observaciones del arqueo..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                    />
                  </Form.Group>

                  {/* Submit closing */}
                  <Button
                    type="submit"
                    variant="danger"
                    className="w-100 py-2.5 fs-6 border-0 rounded-3 shadow d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: 'var(--danger-color)' }}
                  >
                    <FiStopCircle /> Confirmar Cierre de Caja
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* 3. HISTORIAL DE ARQUEOS (GLOBAL) */}
      <Card className="custom-card border-0">
        <Card.Body className="p-0">
          <div className="d-flex align-items-center mb-3 p-3 border-bottom">
            <FiBookOpen size={20} className="me-2 text-teal" style={{ color: 'var(--accent-color)' }} />
            <h5 className="mb-0 fw-bold" style={{ color: 'var(--primary-color)' }}>
              Historial de Arqueos y Cierres Anteriores
            </h5>
          </div>

          <div className="table-responsive px-3 pb-3">
            <Table hover className="align-middle text-nowrap small mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Apertura</th>
                  <th>Cierre</th>
                  <th className="text-end">Inicial</th>
                  <th className="text-end">Teórico</th>
                  <th className="text-end">Real</th>
                  <th className="text-end">Diferencia</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {cashHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No hay registros de cierres anteriores en el sistema.
                    </td>
                  </tr>
                ) : (
                  currentHistory.map((history, idx) => {
                    const isMatch = history.difference === 0;
                    const isSurplus = history.difference > 0;
                    return (
                      <tr key={idx}>
                        <td>{formatDateTime(history.openedAt)}</td>
                        <td>{formatDateTime(history.closedAt)}</td>
                        <td className="text-end font-monospace">${history.initialAmount.toLocaleString('es-AR')}</td>
                        <td className="text-end font-monospace">${history.theoreticalAmount.toLocaleString('es-AR')}</td>
                        <td className="text-end font-monospace fw-bold">${history.realAmount.toLocaleString('es-AR')}</td>
                        <td className={`text-end font-monospace fw-bold ${isMatch ? 'text-success' : isSurplus ? 'text-primary' : 'text-danger'
                          }`}>
                          {isSurplus ? '+' : ''}${history.difference.toLocaleString('es-AR')}
                        </td>
                        <td className="text-truncate text-muted" style={{ maxWidth: '200px' }} title={history.observations}>
                          {history.observations || 'Sin observaciones'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalHistoryPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 no-print px-3 pb-2">
              <span className="text-muted small">
                Mostrando {indexOfFirstHistory + 1}-{Math.min(indexOfLastHistory, cashHistory.length)} de {cashHistory.length} arqueos
              </span>
              <div className="d-flex gap-1">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={currentPageHistory === 1}
                  onClick={() => setCurrentPageHistory(prev => prev - 1)}
                  style={{ borderRadius: '6px' }}
                >
                  Anterior
                </Button>
                <span className="btn btn-sm btn-light fw-bold disabled" style={{ borderRadius: '6px' }}>
                  Pág. {currentPageHistory} de {totalHistoryPages}
                </span>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={currentPageHistory === totalHistoryPages}
                  onClick={() => setCurrentPageHistory(prev => prev + 1)}
                  style={{ borderRadius: '6px' }}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Manual Movement Modal (Ingreso / Egreso) */}
      <Modal show={showMovementModal} onHide={() => setShowMovementModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>Registrar Movimiento Manual</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveMovement}>
          <Modal.Body className="pt-2">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">TIPO DE MOVIMIENTO</Form.Label>
                  <Form.Select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                  >
                    <option value="Ingreso">Ingreso (Entrada de efectivo)</option>
                    <option value="Egreso">Egreso (Salida de efectivo / Gasto)</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">MONTO ($)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-white">
                      <FiDollarSign />
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">CONCEPTO / DESCRIPCIÓN</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Ej. Compra de insumos de librería, Pago a fletero, etc..."
                    value={movementConcept}
                    onChange={(e) => setMovementConcept(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowMovementModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
              Guardar Movimiento
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .bg-success-subtle {
          background-color: rgba(25, 135, 84, 0.1) !important;
        }
        .bg-danger-subtle {
          background-color: rgba(220, 53, 69, 0.1) !important;
        }
      `}</style>
    </div>
  );
}

export default CashControl;
