import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Row, Col, Modal, Card, InputGroup } from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiSearch, FiUserPlus, FiLock, FiSliders } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

function Configuration() {
  const showToast = useToast();
  const showConfirm = useConfirm();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formDni, setFormDni] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formLevel, setFormLevel] = useState(1); // Default to Usuario (Nivel 1)

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/usuarios');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        showToast('Error al cargar usuarios desde el servidor.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al cargar usuarios.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentUser(null);
    setFormName('');
    setFormLastName('');
    setFormUsername('');
    setFormDni('');
    setFormPassword('');
    setFormLevel(1);
    setShowAddEditModal(true);
  };

  const openEditModal = (user) => {
    setIsEditMode(true);
    setCurrentUser(user);
    setFormName(user.nombre);
    setFormLastName(user.apellido);
    setFormUsername(user.usuario);
    setFormDni(user.dni || '');
    setFormPassword(''); // blank password during edits
    setFormLevel(user.nivel);
    setShowAddEditModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!formName.trim() || !formLastName.trim() || !formUsername.trim() || !formDni.trim()) {
      showToast('Por favor, complete todos los campos obligatorios.', 'warning');
      return;
    }

    if (!isEditMode && !formPassword) {
      showToast('Por favor, ingrese una contraseña para el nuevo usuario.', 'warning');
      return;
    }

    const payload = {
      nombre: formName.trim(),
      apellido: formLastName.trim(),
      usuario: formUsername.trim().toLowerCase(),
      dni: formDni.trim(),
      nivel: parseInt(formLevel, 10),
      contrasenia_temporal: false
    };

    if (formPassword) {
      payload.contrasenia = formPassword;
    }

    try {
      const url = isEditMode
        ? `http://localhost:3001/api/usuarios/${currentUser.id}`
        : 'http://localhost:3001/api/usuarios';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(isEditMode ? 'Usuario actualizado con éxito.' : 'Usuario registrado con éxito.', 'success');
        setShowAddEditModal(false);
        fetchUsers();
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Error al guardar el usuario.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión con el servidor.', 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    const activeAdmin = JSON.parse(localStorage.getItem("user") || "{}");
    if (activeAdmin.id === user.id) {
      showToast('No puedes eliminar tu propio usuario activo.', 'warning');
      return;
    }

    const confirmed = await showConfirm(
      `¿Está seguro de que desea eliminar al usuario ${user.nombre} ${user.apellido}? Esta acción no se puede deshacer.`,
      'Eliminar Usuario'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3001/api/usuarios/${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('Usuario eliminado con éxito.', 'success');
        fetchUsers();
      } else {
        showToast('Error al eliminar el usuario.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al eliminar usuario.', 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.dni.includes(searchTerm)
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0" style={{ color: 'var(--primary-color)' }}>
          Configuración del Sistema
        </h2>
        <Button
          variant="primary"
          onClick={openAddModal}
          className="d-flex align-items-center gap-2 border-0 shadow-sm"
          style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff' }}
        >
          <FiUserPlus /> Registrar Usuario
        </Button>
      </div>

      <Card className="custom-card border-0 mb-4 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <FiSliders size={22} className="text-muted" />
            <h5 className="fw-bold m-0" style={{ color: 'var(--primary-color)' }}>
              Gestión de Accesos y Usuarios
            </h5>
          </div>
          <p className="text-muted small mb-4">
            Administra las cuentas de usuario del sistema, define contraseñas y asigna los niveles de acceso correspondientes.
            <br />
            <strong>Nivel 1 (Usuario):</strong> Solo tiene acceso al Punto de Venta (POS) y al Control de Caja Diaria.
            <br />
            <strong>Nivel 2 (Administrador):</strong> Acceso completo a todas las secciones (POS, Caja, Inventario, Proveedores, Clientes, Historial y Configuración).
          </p>

          <Row className="mb-3">
            <Col md={5} lg={4}>
              <InputGroup className="shadow-xs">
                <InputGroup.Text className="bg-white border-end-0">
                  <FiSearch color="var(--text-muted)" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre, usuario, DNI..."
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          <div className="table-responsive">
            <Table hover className="align-middle mb-0" style={{ fontSize: '0.9rem' }}>
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-3">Nombre y Apellido</th>
                  <th className="py-3">Usuario</th>
                  <th className="py-3">DNI</th>
                  <th className="py-3">Rol / Nivel</th>
                  <th className="py-3 text-end px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      Cargando lista de usuarios...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No se encontraron usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-3 py-3 fw-semibold" style={{ color: 'var(--primary-color)' }}>
                        {user.nombre} {user.apellido}
                      </td>
                      <td className="font-monospace text-muted">@{user.usuario}</td>
                      <td>{user.dni}</td>
                      <td>
                        <span
                          className={`badge ${user.nivel === 2 ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} px-2.5 py-1.5`}
                          style={{
                            fontSize: '0.75rem',
                            backgroundColor: user.nivel === 2 ? 'rgba(25, 135, 84, 0.12)' : 'rgba(13, 110, 253, 0.12)'
                          }}
                        >
                          {user.nivel === 2 ? 'Nivel 2: Administrador' : 'Nivel 1: Usuario'}
                        </span>
                      </td>
                      <td className="text-end px-3">
                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            className="p-1.5 d-flex align-items-center"
                            style={{ borderRadius: '6px' }}
                            title="Editar usuario"
                          >
                            <FiEdit2 size={14} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 d-flex align-items-center"
                            style={{ borderRadius: '6px' }}
                            title="Eliminar usuario"
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add / Edit User Modal */}
      <Modal show={showAddEditModal} onHide={() => setShowAddEditModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>
            {isEditMode ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveUser}>
          <Modal.Body className="pt-2">
            <Row className="g-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">NOMBRE</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Ej. Juan"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">APELLIDO</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Ej. Pérez"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">DNI</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Ingrese número de documento"
                    value={formDni}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val) && val.length <= 8) {
                        setFormDni(val);
                      }
                    }}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">NOMBRE DE USUARIO</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light text-muted">@</InputGroup.Text>
                    <Form.Control
                      type="text"
                      required
                      placeholder="usuario"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      disabled={isEditMode}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">NIVEL DE ACCESO</Form.Label>
                  <Form.Select
                    value={formLevel}
                    onChange={(e) => setFormLevel(parseInt(e.target.value, 10))}
                  >
                    <option value={1}>Nivel 1: Usuario</option>
                    <option value={2}>Nivel 2: Administrador</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">
                    CONTRASEÑA {isEditMode && <span className="text-muted fw-normal">(Dejar en blanco para no cambiar)</span>}
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light"><FiLock /></InputGroup.Text>
                    <Form.Control
                      type="password"
                      required={!isEditMode}
                      placeholder={isEditMode ? "••••••••" : "Ingrese contraseña"}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowAddEditModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
              {isEditMode ? 'Guardar Cambios' : 'Registrar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .bg-success-subtle {
          color: #198754 !important;
        }
        .bg-primary-subtle {
          color: #0d6efd !important;
        }
        .p-1.5 {
          padding: 0.375rem !important;
        }
      `}</style>
    </div>
  );
}

export default Configuration;
