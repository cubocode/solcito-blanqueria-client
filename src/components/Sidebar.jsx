import { FiShoppingBag, FiLayers, FiTruck, FiUsers, FiClock, FiMenu, FiInbox, FiSettings, FiBarChart2 } from 'react-icons/fi';
import { Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import logonav from '../images/logonav.png';

function Sidebar({ isSidebarOpen, setIsSidebarOpen, currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const allMenuItems = [
    { path: '/pos', label: 'Punto de Venta', icon: <FiShoppingBag size={20} />, minLevel: 1 },
    { path: '/inventario', label: 'Inventario', icon: <FiLayers size={20} />, minLevel: 2 },
    { path: '/proveedores', label: 'Proveedores', icon: <FiTruck size={20} />, minLevel: 2 },
    { path: '/clientes', label: 'Cuentas Corrientes', icon: <FiUsers size={20} />, minLevel: 2 },
    { path: '/historial', label: 'Historial de Ventas', icon: <FiClock size={20} />, minLevel: 2 },
    { path: '/caja', label: 'Control de Caja', icon: <FiInbox size={20} />, minLevel: 1 },
    { path: '/reportes', label: 'Reportes', icon: <FiBarChart2 size={20} />, minLevel: 2 },
    { path: '/configuracion', label: 'Configuración', icon: <FiSettings size={20} />, minLevel: 2 },
  ];

  const userLevel = currentUser?.nivel || 1;
  const menuItems = allMenuItems.filter(item => userLevel >= item.minLevel);

  return (
    <div
      className="d-flex flex-column flex-shrink-0 text-white p-3"
      style={{
        width: '100%',
        backgroundColor: 'var(--primary-color)',
        height: '100%',
        minHeight: '100vh',
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
        transition: 'padding 0.3s ease'
      }}
    >
      {/* Sidebar Header with Toggle button */}
      <div className={`d-flex align-items-center mb-4 mt-2 ${isSidebarOpen ? 'justify-content-between px-2' : 'justify-content-center'}`}>
        {isSidebarOpen && (
          <div className="d-flex align-items-center gap-2">
            <img src={logonav} alt="Solcito Logo" style={{ height: '40px', objectFit: 'contain' }} />
            <div className="d-flex flex-column" style={{ lineHeight: '1.0' }}>
              <span className="sidebar-brand-text">
                Solcito
              </span>
              <span className="sidebar-subbrand-text">
                BLANQUERIA
              </span>
            </div>
          </div>
        )}
        <Button
          variant="link"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white p-0 border-0 d-flex align-items-center justify-content-center"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            transition: 'background-color 0.2s ease'
          }}
          title={isSidebarOpen ? "Contraer menú" : "Expandir menú"}
        >
          <FiMenu size={20} />
        </Button>
      </div>

      <hr className="bg-secondary" style={{ opacity: 0.2, margin: '8px 0 16px 0' }} />

      {/* Navigation Items */}
      <ul className="nav nav-pills flex-column mb-auto gap-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path} className="nav-item">
              <Button
                variant="link"
                className={`nav-link text-start w-100 d-flex align-items-center border-0 rounded-3 text-decoration-none ${isSidebarOpen ? 'gap-3 px-3 py-2' : 'justify-content-center p-2'
                  } ${isActive
                    ? 'nav-item-active text-white'
                    : 'text-light-50 text-white-50 hover-bg-dark'
                  }`}
                style={{
                  backgroundColor: isActive ? 'rgba(13, 148, 136, 0.15)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                  transition: 'all 0.2s ease',
                  borderLeft: isSidebarOpen && isActive ? '4px solid var(--accent-color)' : '4px solid transparent',
                  borderRadius: isActive ? '0 8px 8px 0' : '8px'
                }}
                onClick={() => navigate(item.path)}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <span className="d-flex align-items-center justify-content-center" style={{ minWidth: '24px' }}>
                  {item.icon}
                </span>
                {isSidebarOpen && (
                  <span style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{item.label}</span>
                )}
              </Button>
            </li>
          );
        })}
      </ul>

      <hr className="bg-secondary" style={{ opacity: 0.2 }} />

      {/* Footer Account Section */}
      <div className={`d-flex align-items-center ${isSidebarOpen ? 'px-2 py-1' : 'justify-content-center'}`}>
        <div className={`d-flex flex-column ${isSidebarOpen ? '' : 'd-none'}`}>
          <span className="fw-bold" style={{ fontSize: '0.9rem' }}>
            {currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Usuario Demo'}
          </span>
          <span className="text-white-50" style={{ fontSize: '0.75rem' }}>
            Rol: {currentUser && currentUser.nivel === 2 ? 'Administrador' : 'Usuario'}
          </span>
        </div>
        {!isSidebarOpen && (
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              fontSize: '0.8rem'
            }}
            title={currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Usuario Demo'}
          >
            {currentUser ? `${currentUser.nombre[0]}${currentUser.apellido[0]}`.toUpperCase() : 'UD'}
          </div>
        )}
      </div>

      <style>{`
        .hover-bg-dark:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

export default Sidebar;
