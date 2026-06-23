import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format date nicely
export const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(d).split('T')[0];
  }
};

// ─── Export to Excel Helper ───
export const exportToExcel = (data, sheetName, fileName) => {
  if (!data || data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Bold header and auto-widths
  const colWidths = Object.keys(data[0] || {}).map(key => {
    let maxLen = key.length;
    data.forEach(row => {
      const val = row[key] ? String(row[key]) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ─── Export to CSV Helper ───
export const exportToCsv = (headers, rows, fileName) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const urlBlob = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', urlBlob);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ─── Export to PDF Report Helper ───
export const exportToPdfTable = ({
  title,
  subtitle = '',
  headers,
  rows,
  fileName,
  orientation = 'landscape'
}) => {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  
  // Header Levlox Branding
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Levlox Tech — CRM Database Report', 14, 18);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 25);
  
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 30);
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, subtitle ? 35 : 30);

  const startY = subtitle ? 39 : 34;

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] }, // Slate 900
    styles: { fontSize: 8.5 },
    margin: { left: 14, right: 14 }
  });

  // Add Page Numbers and Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`, 
      doc.internal.pageSize.getWidth() - 25, 
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      'Levlox Tech Systems CRM • Confidentially Generated', 
      14, 
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
};
