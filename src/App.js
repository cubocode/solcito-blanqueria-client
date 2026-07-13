import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import SalesPanel from './components/SalesPanel';
// eslint-disable-next-line no-unused-vars
import StockManagement from './components/StockManagement';
import SuppliersManagement from './components/SuppliersManagement';
import CurrentAccounts from './components/CurrentAccounts';
import SalesHistory from './components/SalesHistory';
import CashControl from './components/CashControl';
import Configuration from './components/Configuration';
import Reports from './components/Reports';
import Login from './components/Login';
import { FiLogOut } from 'react-icons/fi';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from './context/ToastContext';
import { useConfirm } from './context/ConfirmContext';


// No initial mockup data

function App() {
  const showToast = useToast();
  const showConfirm = useConfirm();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("user"));
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Lifted POS cart states for route persistence
  const [posCart, setPosCart] = useState([]);
  const [posPaymentMethod, setPosPaymentMethod] = useState('Efectivo');
  const [posSelectedClientId, setPosSelectedClientId] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login');
    } else if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/')) {
      navigate('/pos');
    }
  }, [isAuthenticated, location.pathname, navigate]);
  const [dbProducts, setDbProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [cashSession, setCashSession] = useState(null);
  const [cashHistory, setCashHistory] = useState([]);
  const [cashMovements, setCashMovements] = useState([]);

  // Derived mapped product list for selectors, sales processing and KPI cards
  const products = dbProducts.map((prod) => ({
    id: prod.codigo, // Unique ID for POS cart (using codigo directly)
    dbProductId: prod.id,
    name: prod.nombre,
    category: prod.categoria,
    measure: prod.kit?.nombre || '-',
    stock: prod.cantidad,
    minStock: prod.umbral,
    costPrice: parseFloat(prod.precio_costo) || 0,
    salePrice: parseFloat(prod.precio_venta) || 0,
    supplier: prod.kit?.nombre || 'General',
    code: prod.codigo
  }));

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/productos');
      if (response.ok) {
        const data = await response.json();
        setDbProducts(data);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/clientes');
      if (response.ok) {
        const data = await response.json();
        const clientsWithMovements = data.map(c => ({
          id: c.id,
          name: c.nombre,
          phone: c.telefono || '-',
          creditLimit: parseFloat(c.limite_credito),
          balance: parseFloat(c.saldo),
          status: c.estado,
          movements: c.movements ? c.movements.map(m => ({
            id: `MOV-${m.id}`,
            date: m.fecha,
            type: m.tipo,
            amount: parseFloat(m.monto),
            balanceResult: parseFloat(m.saldo_resultante),
            description: m.descripcion
          })).sort((a, b) => new Date(b.date) - new Date(a.date)) : []
        }));
        setClients(clientsWithMovements);
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/ventas');
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Error al cargar ventas:', err);
    }
  };

  const fetchActiveCash = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/cajas/activa');
      if (response.ok) {
        const data = await response.json();
        setCashSession(data);
      }
    } catch (err) {
      console.error('Error al cargar caja activa:', err);
    }
  };

  const fetchCashHistory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/cajas/historial');
      if (response.ok) {
        const data = await response.json();
        setCashHistory(data);
      }
    } catch (err) {
      console.error('Error al cargar historial de caja:', err);
    }
  };

  const fetchCashMovements = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/cajas/movimientos');
      if (response.ok) {
        const data = await response.json();
        setCashMovements(data);
      }
    } catch (err) {
      console.error('Error al cargar movimientos de caja:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
      fetchActiveCash();
      fetchCashHistory();
      fetchClients();
      fetchSuppliers();
      fetchSales();
      fetchCashMovements();
    }
  }, [isAuthenticated]);

  // BUSINESS LOGIC CALLBACKS

  const handleAddSale = async (newSale) => {
    try {
      const response = await fetch('http://localhost:3001/api/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metodo_pago: newSale.paymentMethod,
          total: newSale.total,
          cliente_id: newSale.clientId,
          items: newSale.items,
          pago_efectivo: newSale.pago_efectivo,
          pago_tarjeta: newSale.pago_tarjeta,
          pago_transferencia: newSale.pago_transferencia,
          pago_qr: newSale.pago_qr,
          pago_cta_cte: newSale.pago_cta_cte
        })
      });
      if (response.ok) {
        const data = await response.json();
        showToast('Venta registrada con éxito.', 'success');
        await Promise.all([
          fetchProducts(),
          fetchActiveCash(),
          fetchClients(),
          fetchSales()
        ]);
        return data;
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Error al registrar la venta.', 'error');
        return null;
      }
    } catch (err) {
      console.error('Error al procesar venta:', err);
      showToast('Error de conexión con el servidor.', 'error');
      return null;
    }
  };

  // 2. Inventory / Products Management
  const handleAddProduct = async (newProductData) => {
    try {
      const response = await fetch('http://localhost:3001/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProductData)
      });
      if (response.ok) {
        showToast('Producto agregado con éxito.', 'success');
        fetchProducts();
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Error al agregar el producto.', 'error');
      }
    } catch (err) {
      console.error('Error al agregar producto:', err);
    }
  };

  const handleUpdateProduct = async (updatedProductData) => {
    try {
      const response = await fetch(`http://localhost:3001/api/productos/${updatedProductData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProductData)
      });
      if (response.ok) {
        showToast('Producto actualizado con éxito.', 'success');
        fetchProducts();
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Error al actualizar el producto.', 'error');
      }
    } catch (err) {
      console.error('Error al actualizar producto:', err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/productos/${productId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('Producto eliminado con éxito.', 'success');
        fetchProducts();
      } else {
        showToast('Error al eliminar el producto.', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar producto:', err);
    }
  };

  // 3. Suppliers Management
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/proveedores');
      if (response.ok) {
        const data = await response.json();
        const formatted = data.map(s => ({
          id: s.id,
          name: s.nombre,
          phone: s.telefono || '',
          email: s.email || '',
          address: s.direccion || '',
          notes: s.notas || '',
          pedidos: s.pedidos ? s.pedidos.map(p => ({
            id: p.id,
            fecha_pedido: p.fecha_pedido,
            fecha_recepcion: p.fecha_recepcion,
            monto: parseFloat(p.monto) || 0,
            estado: p.estado,
            detalle: p.detalle || ''
          })) : []
        }));
        setSuppliers(formatted);
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  };

  const handleAddSupplier = async (newSupplier) => {
    try {
      const response = await fetch('http://localhost:3001/api/proveedores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: newSupplier.name,
          telefono: newSupplier.phone,
          email: newSupplier.email,
          direccion: newSupplier.address,
          notas: newSupplier.notes
        })
      });
      if (response.ok) {
        showToast('Proveedor registrado con éxito.', 'success');
        fetchSuppliers();
      } else {
        showToast('Error al registrar el proveedor.', 'error');
      }
    } catch (err) {
      console.error('Error al agregar proveedor:', err);
    }
  };

  const handleUpdateSupplier = async (updatedSupplier) => {
    try {
      const response = await fetch(`http://localhost:3001/api/proveedores/${updatedSupplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: updatedSupplier.name,
          telefono: updatedSupplier.phone,
          email: updatedSupplier.email,
          direccion: updatedSupplier.address,
          notas: updatedSupplier.notes
        })
      });
      if (response.ok) {
        showToast('Proveedor actualizado con éxito.', 'success');
        fetchSuppliers();
      } else {
        showToast('Error al actualizar el proveedor.', 'error');
      }
    } catch (err) {
      console.error('Error al actualizar proveedor:', err);
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/proveedores/${supplierId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('Proveedor eliminado.', 'warning');
        fetchSuppliers();
      } else {
        showToast('Error al eliminar el proveedor.', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar proveedor:', err);
    }
  };

  const handleAddSupplierOrder = async (supplierId, orderData) => {
    try {
      const response = await fetch(`http://localhost:3001/api/proveedores/${supplierId}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      if (response.ok) {
        showToast('Pedido registrado con éxito.', 'success');
        fetchSuppliers();
      } else {
        showToast('Error al registrar el pedido.', 'error');
      }
    } catch (err) {
      console.error('Error al agregar pedido:', err);
    }
  };

  const handleUpdateSupplierOrder = async (supplierId, orderId, orderData) => {
    try {
      const response = await fetch(`http://localhost:3001/api/proveedores/${supplierId}/pedidos/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      if (response.ok) {
        showToast('Pedido actualizado con éxito.', 'success');
        fetchSuppliers();
      } else {
        showToast('Error al actualizar el pedido.', 'error');
      }
    } catch (err) {
      console.error('Error al actualizar pedido:', err);
    }
  };

  // 4. Client / Current Accounts Management
  const handleAddClient = async (newClient) => {
    try {
      const response = await fetch('http://localhost:3001/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: newClient.name,
          telefono: newClient.phone,
          limite_credito: newClient.creditLimit
        })
      });
      if (response.ok) {
        showToast('Cliente registrado con éxito.', 'success');
        fetchClients();
      } else {
        showToast('Error al crear el cliente.', 'error');
      }
    } catch (err) {
      console.error('Error al agregar cliente:', err);
    }
  };

  const handleAddClientMovement = async (clientId, movement) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clientes/${clientId}/movimientos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monto: movement.amount,
          concepto: movement.description
        })
      });
      if (response.ok) {
        showToast('Cobro registrado con éxito.', 'success');
        await Promise.all([
          fetchClients(),
          fetchActiveCash()
        ]);
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Error al registrar el cobro.', 'error');
      }
    } catch (err) {
      console.error('Error al registrar cobro:', err);
    }
  };

  const handleChangeClientStatus = async (clientId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clientes/${clientId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: newStatus
        })
      });
      if (response.ok) {
        showToast(`Estado de cliente cambiado a ${newStatus}.`, 'info');
        fetchClients();
      } else {
        showToast('Error al cambiar el estado del cliente.', 'error');
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  const handleUpdateClient = async (updatedClient) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clientes/${updatedClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: updatedClient.name,
          telefono: updatedClient.phone,
          limite_credito: updatedClient.creditLimit
        })
      });
      if (response.ok) {
        showToast('Cliente actualizado con éxito.', 'success');
        fetchClients();
      } else {
        showToast('Error al actualizar el cliente.', 'error');
      }
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
    }
  };

  // 5. Cash Control Management
  const handleOpenCash = async (amount) => {
    try {
      const response = await fetch('http://localhost:3001/api/cajas/abrir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monto_inicial: amount
        })
      });
      if (response.ok) {
        showToast('Turno de caja abierto con éxito.', 'success');
        fetchActiveCash();
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Error al abrir la caja.', 'error');
      }
    } catch (err) {
      console.error('Error al abrir caja:', err);
    }
  };

  const handleAddCashMovement = async (type, amount, concept) => {
    try {
      const response = await fetch('http://localhost:3001/api/cajas/movimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: type,
          monto: amount,
          concepto: concept
        })
      });
      if (response.ok) {
        showToast(`Movimiento de ${type} registrado.`, 'success');
        fetchActiveCash();
        fetchCashMovements();
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Error al registrar el movimiento.', 'error');
      }
    } catch (err) {
      console.error('Error al registrar movimiento manual:', err);
    }
  };

  const handleCloseCash = async (real, diff, obs) => {
    try {
      const response = await fetch('http://localhost:3001/api/cajas/cerrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monto_final_real: real,
          diferencia: diff,
          observaciones: obs
        })
      });
      if (response.ok) {
        showToast('Caja cerrada correctamente.', 'success');
        await Promise.all([
          fetchActiveCash(),
          fetchCashHistory(),
          fetchCashMovements()
        ]);
      } else {
        showToast('Error al cerrar la caja.', 'error');
      }
    } catch (err) {
      console.error('Error al cerrar caja:', err);
    }
  };

  // Get current date string for top bar
  const getCurrentDateStr = () => {
    return new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={
          <Login onLogin={(user) => {
            localStorage.setItem("user", JSON.stringify(user));
            setCurrentUser(user);
            setIsAuthenticated(true);
          }} />
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
      {/* Sidebar - Navigation - Hidden during physical paper print */}
      <div
        className="no-print d-flex"
        style={{
          width: isSidebarOpen ? '260px' : '70px',
          minWidth: isSidebarOpen ? '260px' : '70px',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          backgroundColor: 'var(--primary-color)'
        }}
      >
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          currentUser={currentUser}
        />
      </div>

      {/* Main workspace section */}
      <div className="main-content" style={{ transition: 'all 0.3s ease', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header Row - Hidden during physical paper print */}
        <header className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom no-print">
          <div>
            <h1 className="fw-bold h3 m-0" style={{ color: 'var(--primary-color)' }}>
              Solcito Blanquería
            </h1>
            <span className="text-muted small text-capitalize">{getCurrentDateStr()}</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="text-end no-print">
              <span className="small text-muted d-block" style={{ fontSize: '0.75rem' }}>Usuario</span>
              <strong className="text-dark small" style={{ fontSize: '0.85rem' }}>
                {currentUser ? currentUser.usuario : 'admin'}
              </strong>
            </div>

            {/* Initials Circle with Dropdown Menu */}
            <div className="position-relative">
              <button
                className="d-flex align-items-center justify-content-center border-0 text-white fw-bold shadow-sm"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-color)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {currentUser && currentUser.nombre && currentUser.apellido 
                  ? `${currentUser.nombre[0]}${currentUser.apellido[0]}`.toUpperCase() 
                  : 'AD'}
              </button>

              {showProfileMenu && (
                <>
                  <div
                    onClick={() => setShowProfileMenu(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                  />
                  <div
                    className="dropdown-menu show p-2 border-0 shadow-lg"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '46px',
                      zIndex: 999,
                      minWidth: '160px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0,0,0,0.05)'
                    }}
                  >
                    <button
                      className="dropdown-item text-danger d-flex align-items-center gap-2 py-2"
                      style={{ borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'transparent', width: '100%', textAlign: 'left' }}
                      onClick={async () => {
                        setShowProfileMenu(false);
                        const confirmed = await showConfirm('¿Está seguro de que desea cerrar la sesión?', 'Cerrar Sesión');
                        if (confirmed) {
                          handleLogout();
                        }
                      }}
                    >
                      <FiLogOut />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Metrics - KPI cards - Hidden during physical paper print */}
        {!['/configuracion', '/reportes'].includes(location.pathname) && (
          <div className="no-print">
            <KPICards sales={sales} products={products} clients={clients} />
          </div>
        )}

        {/* Active Content view layout */}
        <main className="mt-2 flex-grow-1" style={{ flex: '1 0 auto' }}>
          <Routes>
            <Route path="/pos" element={
              <SalesPanel
                products={products}
                clients={clients}
                onAddSale={handleAddSale}
                cashSession={cashSession}
                cart={posCart}
                setCart={setPosCart}
                paymentMethod={posPaymentMethod}
                setPaymentMethod={setPosPaymentMethod}
                selectedClientId={posSelectedClientId}
                setSelectedClientId={setPosSelectedClientId}
              />
            } />

            {/* Admin only routes (Nivel 2) */}
            {currentUser?.nivel === 2 && (
              <>
                <Route path="/inventario" element={
                  <StockManagement
                    dbProducts={dbProducts}
                    suppliers={suppliers}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                  />
                } />
                <Route path="/proveedores" element={
                  <SuppliersManagement
                    suppliers={suppliers}
                    onAddSupplier={handleAddSupplier}
                    onUpdateSupplier={handleUpdateSupplier}
                    onDeleteSupplier={handleDeleteSupplier}
                    onAddSupplierOrder={handleAddSupplierOrder}
                    onUpdateSupplierOrder={handleUpdateSupplierOrder}
                  />
                } />
                <Route path="/clientes" element={
                  <CurrentAccounts
                    clients={clients}
                    onAddClient={handleAddClient}
                    onUpdateClient={handleUpdateClient}
                    onAddClientMovement={handleAddClientMovement}
                    onChangeClientStatus={handleChangeClientStatus}
                    cashSession={cashSession}
                  />
                } />
                <Route path="/historial" element={
                  <SalesHistory sales={sales} />
                } />
                <Route path="/reportes" element={
                  <Reports sales={sales} products={products} cashMovements={cashMovements} />
                } />
                <Route path="/configuracion" element={
                  <Configuration />
                } />
              </>
            )}

            <Route path="/caja" element={
              <CashControl
                cashSession={cashSession}
                cashHistory={cashHistory}
                onOpenCash={handleOpenCash}
                onAddCashMovement={handleAddCashMovement}
                onCloseCash={handleCloseCash}
              />
            } />
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </main>

        {/* Footer - Hidden during print */}
        <footer className="no-print mt-auto pt-4 pb-2 border-top d-flex justify-content-between align-items-center text-muted small">
          <div>
            &copy; {new Date().getFullYear()} Solcito Blanquería. Todos los derechos reservados.
          </div>
          <div>
            Desarrollado por{' '}
            <a
              href="https://www.cubocode.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}
              className="hover-underline"
            >
              Cubo
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
