import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Row, Col, Modal, Card, InputGroup } from 'react-bootstrap';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertCircle } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';

function StockManagement({ dbProducts, suppliers, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const showToast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Current editing product
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Product to delete
  const [productToDelete, setProductToDelete] = useState(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Blanquería');
  const [formDescription, setFormDescription] = useState('');
  const [formCostPrice, setFormCostPrice] = useState(0);
  const [formSalePrice, setFormSalePrice] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formMinStock, setFormMinStock] = useState(0);
  const [formKit, setFormKit] = useState('');

  // Categories list for filter dropdown
  const categories = Array.from(new Set(dbProducts.map(p => p.categoria)));

  // List of existing kit names for autocomplete datalist
  const existingKits = Array.from(new Set(dbProducts.map(p => p.kit?.nombre).filter(Boolean)));

  // Filter products
  const filteredProducts = dbProducts.filter(product => {
    const matchesSearch =
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.kit?.nombre && product.kit.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '' || product.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentProduct(null);
    setFormId('');
    setFormName('');
    setFormCategory('Blanquería');
    setFormDescription('');
    setFormCostPrice(0);
    setFormSalePrice(0);
    setFormStock(10);
    setFormMinStock(3);
    setFormKit('');
    setShowAddEditModal(true);
  };

  const openEditModal = (product) => {
    setIsEditMode(true);
    setCurrentProduct(product);
    setFormId(product.codigo);
    setFormName(product.nombre);
    setFormCategory(product.categoria);
    setFormDescription(product.descripcion || '');
    setFormCostPrice(parseFloat(product.precio_costo) || 0);
    setFormSalePrice(parseFloat(product.precio_venta) || 0);
    setFormStock(product.cantidad);
    setFormMinStock(product.umbral);
    setFormKit(product.kit?.nombre || '');
    setShowAddEditModal(true);
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Por favor ingrese el nombre del producto.', 'warning');
      return;
    }
    if (!formId.trim()) {
      showToast('Por favor ingrese el código del producto.', 'warning');
      return;
    }

    const productData = {
      id: currentProduct?.id,
      codigo: formId,
      nombre: formName,
      categoria: formCategory,
      descripcion: formDescription,
      precio_costo: parseFloat(formCostPrice) || 0,
      precio_venta: parseFloat(formSalePrice) || 0,
      cantidad: parseInt(formStock, 10) || 0,
      umbral: parseInt(formMinStock, 10) || 0,
      kit_nombre: formKit.trim() // Handled by backend findOrCreate
    };

    if (isEditMode) {
      onUpdateProduct(productData);
    } else {
      // Check if code already exists
      if (dbProducts.some(p => p.codigo === formId)) {
        showToast('Este código de producto ya existe.', 'error');
        return;
      }
      onAddProduct(productData);
    }
    setShowAddEditModal(false);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0" style={{ color: 'var(--primary-color)' }}>
          Gestión de Inventario / Stock
        </h2>
        <Button
          variant="primary"
          onClick={openAddModal}
          className="d-flex align-items-center gap-2 border-0 shadow-sm"
          style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff' }}
        >
          <FiPlus /> Agregar Producto
        </Button>
      </div>

      {/* Filters Area */}
      <Card className="custom-card border-0 mb-4">
        <Card.Body className="p-1">
          <Row className="g-3">
            <Col md={7}>
              <Form.Label className="fw-semibold text-muted small mb-1">BUSCADOR</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <FiSearch color="var(--text-muted)" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por Código, Nombre o Kit..."
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={5}>
              <Form.Label className="fw-semibold text-muted small mb-1">FILTRAR POR CATEGORÍA</Form.Label>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las Categorías</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Stock Table */}
      <Card className="custom-card border-0">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0 text-nowrap">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Código</th>
                  <th className="py-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Nombre del Producto</th>
                  <th className="py-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Kit al que Pertenece</th>
                  <th className="py-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Categoría</th>
                  <th className="py-3 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Stock</th>
                  <th className="py-3 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Mín. Stock</th>
                  <th className="py-3 text-end" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Costo</th>
                  <th className="py-3 text-end" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Venta</th>
                  <th className="py-3 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Estado</th>
                  <th className="px-4 py-3 text-center" style={{ width: '120px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5 text-muted">
                      No se encontraron productos en el inventario.
                    </td>
                  </tr>
                ) : (
                  currentProducts.map((product) => {
                    const isLowStock = product.cantidad <= product.umbral;
                    return (
                      <tr
                        key={product.id}
                        className={isLowStock ? 'table-warning-custom' : ''}
                      >
                        <td className="px-4 fw-bold">{product.codigo}</td>
                        <td className="fw-semibold" style={{ color: 'var(--primary-color)' }}>{product.nombre}</td>
                        <td className="fw-semibold text-teal">{product.kit?.nombre || '-'}</td>
                        <td>
                          <span className="badge bg-secondary opacity-75">{product.categoria}</span>
                        </td>
                        <td className="text-center fw-bold">
                          {product.cantidad}
                          {isLowStock && (
                            <span className="ms-1 text-danger" title="¡Alerta! Stock por debajo del mínimo">
                              <FiAlertCircle />
                            </span>
                          )}
                        </td>
                        <td className="text-center text-muted">{product.umbral}</td>
                        <td className="text-end font-monospace">${parseFloat(product.precio_costo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="text-end font-monospace fw-semibold" style={{ color: 'var(--accent-color)' }}>
                          ${parseFloat(product.precio_venta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-center">
                          {isLowStock ? (
                            <span className="badge bg-danger">Stock Bajo</span>
                          ) : (
                            <span className="badge bg-success">Ok</span>
                          )}
                        </td>
                        <td className="px-4 text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openEditModal(product)}
                              className="p-1 d-flex align-items-center"
                              title="Editar producto"
                            >
                              <FiEdit2 size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => openDeleteModal(product)}
                              className="p-1 d-flex align-items-center"
                              title="Eliminar producto"
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          </div>
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
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} de {filteredProducts.length} productos
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

      {/* Add / Edit Product Modal */}
      <Modal show={showAddEditModal} onHide={() => setShowAddEditModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-color)' }}>
            {isEditMode ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveProduct}>
          <Modal.Body className="pt-2">
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">CÓDIGO</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    disabled={isEditMode}
                    placeholder="Código del producto"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">NOMBRE DEL PRODUCTO</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Nombre del producto"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">PERTENECE A UN KIT (OPCIONAL)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Kit al que pertenece el producto"
                    list="kits-list"
                    value={formKit}
                    onChange={(e) => setFormKit(e.target.value)}
                  />
                  <datalist id="kits-list">
                    {existingKits.map((k, index) => (
                      <option key={index} value={k} />
                    ))}
                  </datalist>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">CATEGORÍA</Form.Label>
                  <Form.Select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Blanquería">Blanquería</option>
                    <option value="Sábanas">Sábanas</option>
                    <option value="Acolchados">Acolchados</option>
                    <option value="Mantas">Mantas</option>
                    <option value="Cortinas">Cortinas</option>
                    <option value="Otros">Otros</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">DESCRIPCIÓN</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Descripción o notas del producto"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">STOCK ACTUAL</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        setFormStock(val);
                      }
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">STOCK MÍNIMO (ALERTA)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    required
                    value={formMinStock}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        setFormMinStock(val);
                      }
                    }}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">PRECIO DE COSTO ($)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formCostPrice}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      if (/^\d*\.?\d*$/.test(val)) {
                        setFormCostPrice(val);
                      }
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">PRECIO DE VENTA ($)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formSalePrice}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      if (/^\d*\.?\d*$/.test(val)) {
                        setFormSalePrice(val);
                      }
                    }}
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
              {isEditMode ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">Eliminar Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Está seguro de que desea eliminar el producto <strong>{productToDelete?.nombre}</strong> (Cod: {productToDelete?.codigo})?
          <p className="text-muted small mt-2">Esta acción no se puede deshacer.</p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .table-warning-custom {
          background-color: #fffbeb !important;
        }
        .table-warning-custom:hover {
          background-color: #fef3c7 !important;
        }
        .text-teal {
          color: var(--accent-color) !important;
        }
      `}</style>
    </div>
  );
}

export default StockManagement;
