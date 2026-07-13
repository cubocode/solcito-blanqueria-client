import { Row, Col } from 'react-bootstrap';
import { FiDollarSign, FiAlertTriangle, FiUsers, FiTrendingUp } from 'react-icons/fi';

function KPICards({ sales, products, clients }) {
  // 1. Sales of today
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => {
    const sDate = s.date || s.fecha;
    return sDate && sDate.startsWith(todayStr);
  });
  const totalSalesToday = todaySales.reduce((acc, curr) => acc + curr.total, 0);

  // 2. Low stock count
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // 3. Total Accounts Receivable (deuda de clientes)
  const totalReceivable = clients.reduce((acc, curr) => acc + curr.balance, 0);

  // 4. Active customers count
  const activeClientsCount = clients.filter(c => c.status === 'Activo').length;

  const kpiData = [
    {
      title: 'Ventas de Hoy',
      value: `$${totalSalesToday.toLocaleString('es-AR')}`,
      icon: <FiDollarSign size={24} />,
      color: '#10b981', // green
      bg: 'rgba(16, 185, 129, 0.1)',
      desc: `${todaySales.length} transacciones hoy`
    },
    {
      title: 'Alertas de Stock',
      value: lowStockCount,
      icon: <FiAlertTriangle size={24} />,
      color: '#ef4444', // red
      bg: 'rgba(239, 68, 68, 0.1)',
      desc: `${lowStockCount} productos bajo el mínimo`,
      alert: lowStockCount > 0
    },
    {
      title: 'Saldo en Cta Cte',
      value: `$${totalReceivable.toLocaleString('es-AR')}`,
      icon: <FiTrendingUp size={24} />,
      color: '#0d9488', // teal
      bg: 'rgba(13, 148, 136, 0.1)',
      desc: 'Crédito otorgado a cobrar'
    },
    {
      title: 'Clientes Activos',
      value: activeClientsCount,
      icon: <FiUsers size={24} />,
      color: '#3b82f6', // blue
      bg: 'rgba(59, 130, 246, 0.1)',
      desc: `De un total de ${clients.length} registrados`
    }
  ];

  return (
    <Row className="mb-4">
      {kpiData.map((kpi, idx) => (
        <Col key={idx} xs={12} sm={6} lg={3} className="mb-3 mb-lg-0">
          <div
            className="metric-card"
            style={{
              borderColor: kpi.alert ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)',
              transition: 'all 0.3s ease'
            }}
          >
            <div
              className="metric-icon-wrapper"
              style={{ backgroundColor: kpi.bg, color: kpi.color }}
            >
              {kpi.icon}
            </div>
            <div>
              <span className="text-muted d-block mb-1" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {kpi.title}
              </span>
              <h4 className="fw-bold mb-1" style={{ fontSize: '1.4rem', color: 'var(--primary-color)' }}>
                {kpi.value}
              </h4>
              <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                {kpi.desc}
              </span>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
}

export default KPICards;
