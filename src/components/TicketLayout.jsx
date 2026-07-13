import { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useToast } from '../context/ToastContext';

function TicketLayout({ type, data, onClose }) {
  const showToast = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Safe helper to format dates nicely
  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('ticket-print-area');
    if (!element) return;

    setIsGeneratingPdf(true);

    // Render HTML to canvas with high resolution
    html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');

      // Calculate ticket dimensions for PDF in mm (assuming 80mm width standard ticket)
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight + 10]
      });

      pdf.addImage(imgData, 'PNG', 0, 5, pdfWidth, pdfHeight);

      const fileName = type === 'sale'
        ? `ticket-venta-${data.id}.pdf`
        : `recibo-pago-${data.id || 'pago'}.pdf`;

      pdf.save(fileName);
      setIsGeneratingPdf(false);
    }).catch(err => {
      console.error("Error generating PDF:", err);
      showToast("Hubo un error al generar el archivo PDF.", "error");
      setIsGeneratingPdf(false);
    });
  };

  if (!data) return null;

  return (
    <div className="d-flex flex-column align-items-center gap-3">
      {/* Printable Area */}
      <div id="ticket-print-area" className="ticket-wrapper printable-ticket">
        <div className="ticket-header">
          <div className="ticket-logo" style={{ color: 'var(--primary-color)' }}>SOLCITO BLANQUERÍA</div>
          <div>Blanco y Decoración Hogar</div>
          <div style={{ fontSize: '11px' }}>Tel: 341-1234567</div>
          <div style={{ fontSize: '11px' }}>IVA Responsable Inscripto</div>
        </div>

        <div className="ticket-divider"></div>

        {type === 'sale' ? (
          // SALE RECEIPT
          <>
            <div><strong>TICKET DE VENTA (Simulado)</strong></div>
            <div>Nro: {data.id}</div>
            <div>Fecha: {formatDate(data.date)}</div>
            <div>Cliente: {data.clientName || 'Consumidor Final'}</div>
            {data.clientId && <div>Cod. Cliente: {data.clientId}</div>}

            <div className="ticket-divider"></div>

            <table className="ticket-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Detalle</th>
                  <th className="text-right" style={{ width: '15%' }}>Cant</th>
                  <th className="text-right" style={{ width: '35%' }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div>{item.productName}</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>
                        1 x ${item.salePrice.toLocaleString('es-AR')}
                      </div>
                    </td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">${item.subtotal.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ticket-divider"></div>

            <table className="ticket-table">
              <tbody>
                <tr>
                  <td><strong>TOTAL:</strong></td>
                  <td className="text-right"><strong>${data.total.toLocaleString('es-AR')}</strong></td>
                </tr>
                <tr>
                  <td>Forma de Pago:</td>
                  <td className="text-right">{data.paymentMethod}</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          // PAYMENT RECEIPT
          <>
            <div><strong>RECIBO DE PAGO (Cta Cte)</strong></div>
            <div>Nro: {data.id || 'REC-' + Math.floor(Math.random() * 100000)}</div>
            <div>Fecha: {formatDate(data.date)}</div>
            <div>Cliente: {data.clientName}</div>
            {data.clientId && <div>Cod. Cliente: {data.clientId}</div>}

            <div className="ticket-divider"></div>

            <table className="ticket-table">
              <tbody>
                <tr>
                  <td><strong>Monto Abonado:</strong></td>
                  <td className="text-right"><strong>${data.amount.toLocaleString('es-AR')}</strong></td>
                </tr>
                <tr>
                  <td>Concepto:</td>
                  <td className="text-right">{data.description || 'Entrega a Cuenta'}</td>
                </tr>
                {data.previousBalance !== undefined && (
                  <tr>
                    <td>Saldo Anterior:</td>
                    <td className="text-right">${data.previousBalance.toLocaleString('es-AR')}</td>
                  </tr>
                )}
                {data.balanceResult !== undefined && (
                  <tr>
                    <td><strong>Saldo Pendiente:</strong></td>
                    <td className="text-right"><strong>${data.balanceResult.toLocaleString('es-AR')}</strong></td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        <div className="ticket-divider"></div>

        <div className="ticket-footer">
          <div>¡Muchas gracias por su compra!</div>
          <div>Este comprobante no es válido como factura.</div>
          <div>Desarrollado para Cubo Gestión</div>
        </div>
      </div>

      {/* Action Buttons (Not Printed) */}
      <div className="d-flex gap-2 w-100 justify-content-center mt-2 no-print flex-wrap">
        <Button
          variant="outline-primary"
          onClick={handlePrint}
          className="d-flex align-items-center gap-2"
          disabled={isGeneratingPdf}
        >
          <FiPrinter /> Imprimir
        </Button>
        <Button
          variant="outline-success"
          onClick={handleDownloadPDF}
          className="d-flex align-items-center gap-2"
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? (
            <>
              <Spinner size="sm" animation="border" /> Procesando...
            </>
          ) : (
            <>
              <FiDownload /> Descargar PDF
            </>
          )}
        </Button>
        {onClose && (
          <Button variant="secondary" onClick={onClose} disabled={isGeneratingPdf}>
            Cerrar
          </Button>
        )}
      </div>
    </div>
  );
}

export default TicketLayout;
