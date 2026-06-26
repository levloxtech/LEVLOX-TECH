import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import * as XLSX from 'xlsx';
import {
  Award, Plus, Search, Download, Eye, Ban, CheckCircle,
  AlertTriangle, XCircle, QrCode, RefreshCw, FileText,
  Shield, Clock, Calendar, User, BookOpen, X, Copy, Check,
  ExternalLink, Edit2, RotateCcw, FileSpreadsheet, Trash
} from 'lucide-react';
import ExportDropdown from './ExportDropdown';
import CRMFilterBar from './CRMFilterBar';
import { LoadingState, EmptyState, getFilterFriendlyLabel } from './CRMStateTemplates';
import { exportToExcel, exportToCsv, exportToPdfTable } from '../utils/exportHelpers';
import logo from '../assets/levlox-logo-light.png';

// ─── Env: frontend URL used inside QR codes ──────────────────────
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// ─── Build the verify URL for a certificate ID ──────────────────
const buildVerifyUrl = (certificateId) =>
  `${FRONTEND_URL}/verify/${certificateId}`;

// ─────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    VALID:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: '✓ VALID' },
    REVOKED: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500',     label: '✕ REVOKED' },
    EXPIRED: { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500',  label: '⚠ EXPIRED' },
  };
  const s = map[status] || map.VALID;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────
// Certificate card rendered off-screen for PDF capture
// Uses QRCodeCanvas so html2canvas captures it correctly
// ─────────────────────────────────────────────────────────────────
const CertificatePrintCard = React.forwardRef(({ cert }, ref) => {
  const completionDate = cert.completionDate
    ? new Date(cert.completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';
  const issuedDate = cert.issuedDate
    ? new Date(cert.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const verifyUrl = cert.verifyUrl || buildVerifyUrl(cert.certificateId);

  return (
    <div
      ref={ref}
      style={{
        width: '794px', height: '560px', position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
        fontFamily: "'Inter', sans-serif", overflow: 'hidden', borderRadius: '0px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 60px',
      }}
    >
      {/* Decorative rings */}
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' }} />
      {/* Gold accent top line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #a78bfa, transparent)' }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src={logo} 
            alt="Levlox Logo" 
            style={{ height: '32px', objectFit: 'contain' }} 
          />
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.15)', paddingLeft: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '500', letterSpacing: '2px', textTransform: 'uppercase' }}>Certificate of Completion</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Issued On</div>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>{issuedDate}</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: '40px', width: '100%', alignItems: 'center' }}>
        {/* Left: Text */}
        <div style={{ flex: 1 }}>
          <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
            This is to certify that
          </div>
          <div style={{ color: '#ffffff', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', lineHeight: '1.1', marginBottom: '16px' }}>
            {cert.studentName}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500', marginBottom: '4px' }}>
            has successfully completed the course
          </div>
          <div style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: '800', marginBottom: '24px', lineHeight: '1.3' }}>
            {cert.courseName}
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '28px' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '600' }}>Completion Date</div>
              <div style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '700', marginTop: '2px' }}>{completionDate}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '600' }}>Status</div>
              <div style={{ color: cert.certificateStatus === 'VALID' ? '#22c55e' : '#ef4444', fontSize: '12px', fontWeight: '700', marginTop: '2px' }}>{cert.certificateStatus}</div>
            </div>
          </div>

          {/* Certificate ID */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Certificate ID</div>
            <div style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '1px' }}>
              {cert.certificateId}
            </div>
          </div>
        </div>

        {/* Right: QR code — rendered as canvas by QRCodeCanvas */}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '12px', display: 'inline-block', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <QRCodeCanvas
              value={verifyUrl}
              size={130}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
              includeMargin={false}
            />
          </div>
          <div style={{ color: '#64748b', fontSize: '9px', marginTop: '8px', letterSpacing: '1px' }}>SCAN TO VERIFY</div>
        </div>
      </div>
    </div>
  );
});
CertificatePrintCard.displayName = 'CertificatePrintCard';


// ─────────────────────────────────────────────────────────────────
// Main CRM Component
// ─────────────────────────────────────────────────────────────────
const CertificateManagementView = ({ apiUrl, token, adminProfile, user }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState('list');
  const [selectedCert, setSelectedCert] = useState(null);
  
  // Modals state
  const [detailModal, setDetailModal]   = useState(false);
  const [editModal, setEditModal]       = useState(false);
  const [reissueModal, setReissueModal] = useState(false);
  const [deleteModal, setDeleteModal]   = useState(false);

  const [submitting, setSubmitting]     = useState(false);
  const [copied, setCopied]             = useState(null);
  const [pdfLoading, setPdfLoading]     = useState(false);
  
  // Quick verify
  const [verifyId, setVerifyId]         = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying]       = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [recentFilter, setRecentFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({ filter: 'today', fromUTC: '', to_date: '' });

  const [toast, setToast]               = useState(null);
  const printRef = useRef(null);

  // Check if role is Super Admin
  const isSuperAdmin = adminProfile?.role === 'Super Admin';

  const [form, setForm] = useState({
    studentName:    '',
    courseName:     '',
    issuedDate:     new Date().toISOString().split('T')[0],
    completionDate: new Date().toISOString().split('T')[0],
  });

  const [editForm, setEditForm] = useState({
    studentName:    '',
    courseName:     '',
    issuedDate:     '',
    completionDate: '',
  });

  const [reissueForm, setReissueForm] = useState({
    studentName:    '',
    courseName:     '',
    issuedDate:     '',
    completionDate: '',
  });

  const [deleteForm, setDeleteForm] = useState({
    reason: 'Cancelled by administrator.'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // ── Fetch list ───────────────────────────────────────────────
  const fetchCertificates = async (range = dateFilter) => {
    setLoading(true);
    try {
      let url = `${apiUrl}/api/certificates?limit=100`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (recentFilter) url += `&recent=true`;
      if (range.filter) {
        url += `&filter=${range.filter}&from_date=${encodeURIComponent(range.fromUTC)}&to_date=${encodeURIComponent(range.to_date)}`;
      }

      const res  = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (res.ok && data.status === 'success') setCertificates(data.certificates || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleFilterChange = (range) => {
    const newRange = { filter: range.filter, fromUTC: range.from_date, to_date: range.to_date };
    setDateFilter(newRange);
    fetchCertificates(newRange);
  };

  useEffect(() => { fetchCertificates(); }, [search, statusFilter, recentFilter]);

  // ── Create ───────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res  = await fetch(`${apiUrl}/api/certificates`, { method: 'POST', headers: authHeaders, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToast(`Certificate ${data.certificate.certificateId} created successfully!`);
        setForm({ studentName: '', courseName: '', issuedDate: new Date().toISOString().split('T')[0], completionDate: new Date().toISOString().split('T')[0] });
        setActiveTab('list');
        fetchCertificates();
        setSelectedCert(data.certificate);
        setDetailModal(true);
      } else {
        showToast(data.message || 'Failed to create certificate', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setSubmitting(false); }
  };

  // ── Open detail (fetch full record) ─────────────────────────
  const openDetail = async (cert) => {
    try {
      const res  = await fetch(`${apiUrl}/api/certificates/${cert._id}`, { headers: authHeaders });
      const data = await res.json();
      setSelectedCert(res.ok && data.status === 'success' ? data.certificate : cert);
    } catch { setSelectedCert(cert); }
    setDetailModal(true);
  };

  // ── Edit certificate ─────────────────────────────────────────
  const openEditModal = (cert) => {
    setSelectedCert(cert);
    setEditForm({
      studentName: cert.studentName || '',
      courseName: cert.courseName || '',
      issuedDate: cert.issuedDate ? cert.issuedDate.split('T')[0] : '',
      completionDate: cert.completionDate ? cert.completionDate.split('T')[0] : '',
    });
    setDetailModal(false);
    setEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/certificates/${selectedCert._id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToast('Certificate updated successfully!');
        setEditModal(false);
        fetchCertificates();
        openDetail(data.certificate);
      } else {
        showToast(data.message || 'Failed to update certificate', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reissue certificate ──────────────────────────────────────
  const openReissueModal = (cert) => {
    setSelectedCert(cert);
    setReissueForm({
      studentName: cert.studentName || '',
      courseName: cert.courseName || '',
      issuedDate: new Date().toISOString().split('T')[0],
      completionDate: new Date().toISOString().split('T')[0],
    });
    setDetailModal(false);
    setReissueModal(true);
  };

  const handleReissueSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/certificates/${selectedCert._id}/reissue`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(reissueForm)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToast('Certificate reissued successfully!');
        setReissueModal(false);
        fetchCertificates();
        openDetail(data.certificate);
      } else {
        showToast(data.message || 'Failed to reissue certificate', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete / Revoke certificate ──────────────────────────────
  const openDeleteModal = (cert) => {
    setSelectedCert(cert);
    setDeleteForm({ reason: 'Cancelled by administrator.' });
    setDetailModal(false);
    setDeleteModal(true);
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/certificates/${selectedCert._id}`, {
        method: 'DELETE',
        headers: authHeaders,
        body: JSON.stringify(deleteForm)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToast('Certificate revoked successfully!', 'warning');
        setDeleteModal(false);
        fetchCertificates();
        openDetail(data.certificate);
      } else {
        showToast(data.message || 'Failed to revoke certificate', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Quick verify ─────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyId.trim()) return;
    setVerifying(true); setVerifyResult(null);
    try {
      const res  = await fetch(`${apiUrl}/api/certificates/verify/${encodeURIComponent(verifyId.trim())}`);
      const data = await res.json();
      setVerifyResult({ ...data, httpStatus: res.status });
    } catch { setVerifyResult({ status: 'error', message: 'Network error', httpStatus: 500 }); }
    finally { setVerifying(false); }
  };

  // ── Copy ─────────────────────────────────────────────────────
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // ── Exports ──────────────────────────────────────────────────
  const handleExportExcel = async () => {
    try {
      let url = `${apiUrl}/api/certificates?limit=all`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (recentFilter) url += `&recent=true`;

      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Failed to retrieve export data');
      }
      const list = data.certificates || [];
      if (list.length === 0) {
        throw new Error('No records to export');
      }

      const exportData = list.map(c => ({
        'Certificate ID': c.certificateId,
        'Student Name': c.studentName,
        'Course Name': c.courseName,
        'Issue Date': fmt(c.issuedDate),
        'Completion Date': fmt(c.completionDate),
        'Status': c.certificateStatus,
        'Verify URL': c.verifyUrl,
        'Created By': c.createdBy || 'System',
        'Revocation Reason': c.revocationReason || 'N/A'
      }));

      exportToExcel(exportData, 'Certificates', 'Levlox_Certificates');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleExportCsv = async () => {
    try {
      let url = `${apiUrl}/api/certificates?limit=all`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (recentFilter) url += `&recent=true`;

      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Failed to retrieve data');
      }
      const list = data.certificates || [];
      if (list.length === 0) {
        throw new Error('No records to export');
      }

      const headers = ['Certificate ID', 'Student Name', 'Course Name', 'Issue Date', 'Completion Date', 'Status', 'Verify URL', 'Created By', 'Revocation Reason'];
      const rows = list.map(c => [
        c.certificateId,
        c.studentName,
        c.courseName,
        fmt(c.issuedDate),
        fmt(c.completionDate),
        c.certificateStatus,
        c.verifyUrl,
        c.createdBy || 'System',
        c.revocationReason || ''
      ]);

      exportToCsv(headers, rows, 'Levlox_Certificates');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleExportPdfTable = async () => {
    try {
      let url = `${apiUrl}/api/certificates?limit=all`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (recentFilter) url += `&recent=true`;

      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Failed to retrieve data');
      }
      const list = data.certificates || [];
      if (list.length === 0) {
        throw new Error('No records to export');
      }

      const headers = ['ID', 'Student Name', 'Course Name', 'Issue Date', 'Completion Date', 'Status'];
      const rows = list.map(c => [
        c.certificateId,
        c.studentName,
        c.courseName,
        fmt(c.issuedDate),
        fmt(c.completionDate),
        c.certificateStatus
      ]);

      exportToPdfTable({
        title: 'Issued Certificates Report',
        subtitle: `Total Issued: ${list.length}`,
        headers,
        rows,
        fileName: 'Levlox_Certificates'
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // ── PDF download single certificate ──────────────────────────
  const handleDownloadPdf = async (cert) => {
    setPdfLoading(true);
    try {
      const { default: jsPDF }       = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const { createRoot }           = await import('react-dom/client');

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;z-index:-1;';
      document.body.appendChild(container);

      const root = createRoot(container);
      await new Promise(resolve => {
        root.render(React.createElement(CertificatePrintCard, { cert }));
        setTimeout(resolve, 900);
      });

      const canvas = await html2canvas(container.firstChild, {
        scale: 2, useCORS: true, backgroundColor: null, logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [794, 560] });
      pdf.addImage(imgData, 'PNG', 0, 0, 794, 560);
      pdf.save(`${cert.certificateId}.pdf`);

      root.unmount();
      document.body.removeChild(container);
      showToast('PDF certificate downloaded!');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('PDF generation failed', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold ${
          toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'warning' ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <XCircle size={16}/> : toast.type === 'warning' ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>}
          {toast.message}
        </div>
      )}

      {/* Hidden print card for PDF (rendered off-screen) */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none', zIndex: -1 }}>
        {selectedCert && <CertificatePrintCard ref={printRef} cert={selectedCert} />}
      </div>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Award size={16} className="text-white"/>
            </div>
            <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Certificate Management</h3>
          </div>
          <p className="text-xs text-gray-500 ml-10">
            Issue, verify, and manage Levlox certificates with QR-backed authentication.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('create')}
          className="flex items-center gap-2 bg-black text-white hover:bg-zinc-800 transition-all px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-md shrink-0"
        >
          <Plus size={14}/> Issue New Certificate
        </button>
      </div>

      {/* ── Tab Bar and Exports ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
          {[
            { id: 'list',   label: 'All Certificates',  icon: FileText },
            { id: 'create', label: 'Issue Certificate',  icon: Plus },
            { id: 'verify', label: 'Quick Verify',       icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={13}/>{tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'list' && (
          <ExportDropdown
            adminProfile={adminProfile}
            user={user}
            onCsv={handleExportCsv}
            onExcel={handleExportExcel}
            onPdf={handleExportPdfTable}
            fileNamePrefix="Levlox_Certificates"
          />
        )}
      </div>

      {/* ══ TAB: LIST ══════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Reusable Date Filter Bar */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-wrap justify-between items-center gap-4 text-left">
            <CRMFilterBar onChange={handleFilterChange} />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="flex gap-3 items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by student, course, or ID…"
                  className="w-full bg-white border border-gray-200 focus:border-gray-400 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none transition-all"
                />
              </div>
              <button onClick={fetchCertificates} className="p-2.5 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 cursor-pointer shrink-0">
                <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`}/>
              </button>
              <span className="text-xs text-gray-400 font-semibold hidden md:inline">{certificates.length} records</span>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => { setStatusFilter(''); setRecentFilter(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!statusFilter && !recentFilter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                All
              </button>
              <button
                onClick={() => { setStatusFilter('VALID'); setRecentFilter(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'VALID' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Valid
              </button>
              <button
                onClick={() => { setStatusFilter('REVOKED'); setRecentFilter(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'REVOKED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Revoked
              </button>
              <button
                onClick={() => { setStatusFilter(''); setRecentFilter(true); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${recentFilter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Recent (7d)
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Issued', value: certificates.length,                                               color: 'text-gray-900',    bg: 'bg-white',       icon: Award },
              { label: 'Valid',        value: certificates.filter(c => c.certificateStatus === 'VALID').length,   color: 'text-emerald-700', bg: 'bg-emerald-50',  icon: CheckCircle },
              { label: 'Revoked',      value: certificates.filter(c => c.certificateStatus === 'REVOKED').length, color: 'text-red-700',     bg: 'bg-red-50',      icon: Ban },
              { label: 'Recent (7 Days)', value: certificates.filter(c => {
                  const certDate = new Date(c.createdAt || c.issuedDate);
                  const diffTime = Math.abs(new Date() - certDate);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 7;
                }).length, color: 'text-violet-700',  bg: 'bg-violet-50',   icon: Clock },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`${s.bg} border border-gray-100 rounded-2xl p-4 flex items-center gap-3`}>
                  <Icon size={18} className={s.color}/>
                  <div>
                    <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <LoadingState message="Loading certificates…" />
            ) : certificates.length === 0 ? (
              <div className="p-6">
                <EmptyState 
                  title="No certificates found"
                  subtitle={`No certificates found for ${getFilterFriendlyLabel(dateFilter.filter)}.`}
                  icon={Award}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      {['Certificate ID', 'Student Name', 'Course Name', 'Completion Date', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {certificates.map(cert => (
                      <tr key={cert._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-gray-800">{cert.certificateId}</span>
                            <button onClick={() => copyToClipboard(cert.certificateId, cert._id+'-id')} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100">
                              {copied === cert._id+'-id' ? <Check size={10} className="text-emerald-500"/> : <Copy size={10} className="text-gray-400"/>}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {cert.studentName?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-gray-800">{cert.studentName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4"><span className="text-xs text-gray-600">{cert.courseName}</span></td>
                        <td className="px-5 py-4"><span className="text-xs text-gray-500">{fmt(cert.completionDate)}</span></td>
                        <td className="px-5 py-4"><StatusBadge status={cert.certificateStatus}/></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openDetail(cert)} title="View Detail & Log" className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-all cursor-pointer"><Eye size={14}/></button>
                            <button onClick={() => handleDownloadPdf(cert)} disabled={pdfLoading} title="Download PDF" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all cursor-pointer disabled:opacity-40"><Download size={14}/></button>
                            {isSuperAdmin && (
                              <>
                                <button onClick={() => openEditModal(cert)} title="Edit Certificate" className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-all cursor-pointer"><Edit2 size={14}/></button>
                                <button onClick={() => openReissueModal(cert)} title="Reissue Certificate" className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all cursor-pointer"><RotateCcw size={14}/></button>
                                {cert.certificateStatus !== 'REVOKED' && (
                                  <button onClick={() => openDeleteModal(cert)} title="Revoke Certificate" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all cursor-pointer"><Ban size={14}/></button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: CREATE ════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="max-w-lg">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Award size={18} className="text-white"/>
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 text-base">Issue New Certificate</h4>
                <p className="text-xs text-gray-400">Unique ID + QR code generated automatically on submit.</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400"><User size={11}/> Student Name</label>
                <input type="text" required value={form.studentName} onChange={e => setForm({...form, studentName: e.target.value})} placeholder="e.g. Sri Aakash" className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 focus:bg-white rounded-xl px-4 py-3 text-sm outline-none transition-all"/>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400"><BookOpen size={11}/> Course Name</label>
                <input type="text" required value={form.courseName} onChange={e => setForm({...form, courseName: e.target.value})} placeholder="e.g. Full Stack Web Development" className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 focus:bg-white rounded-xl px-4 py-3 text-sm outline-none transition-all"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400"><Calendar size={11}/> Issue Date</label>
                  <input type="date" required value={form.issuedDate} onChange={e => setForm({...form, issuedDate: e.target.value})} className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-3 py-3 text-sm outline-none transition-all"/>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400"><Calendar size={11}/> Completion Date</label>
                  <input type="date" required value={form.completionDate} onChange={e => setForm({...form, completionDate: e.target.value})} className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-3 py-3 text-sm outline-none transition-all"/>
                </div>
              </div>

              {/* QR preview info */}
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode size={13} className="text-indigo-500"/>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">QR Code Details</span>
                </div>
                <div className="text-xs text-indigo-700 font-semibold">• Unique ID: <span className="font-mono">LVX-{new Date().getFullYear()}-XXXXXX</span></div>
                <div className="text-xs text-indigo-700 font-semibold">• QR URL: <span className="font-mono text-[10px]">{FRONTEND_URL}/verify/LVX-…</span></div>
                <div className="text-xs text-indigo-700 font-semibold">• Stored in MongoDB Atlas</div>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                {submitting ? <><RefreshCw size={14} className="animate-spin"/> Generating…</> : <><Award size={14}/> Issue Certificate with QR</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ TAB: VERIFY ════════════════════════════════════════════ */}
      {activeTab === 'verify' && (
        <div className="max-w-lg space-y-5">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                <Shield size={18} className="text-white"/>
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 text-base">Quick Verify</h4>
                <p className="text-xs text-gray-400">Enter a Certificate ID to check its validity in real-time.</p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Certificate ID</label>
                <input
                  value={verifyId}
                  onChange={e => setVerifyId(e.target.value.toUpperCase())}
                  placeholder="LVX-2026-000001"
                  className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 focus:bg-white rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all"
                />
              </div>
              <button type="submit" disabled={verifying || !verifyId.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {verifying ? <><RefreshCw size={14} className="animate-spin"/> Verifying…</> : <><Shield size={14}/> Verify Certificate</>}
              </button>
            </form>

            {/* Result card */}
            {verifyResult && (
              <div className={`mt-5 rounded-2xl p-5 border ${
                verifyResult.httpStatus === 200 && verifyResult.certificate?.certificateStatus === 'VALID'  ? 'bg-emerald-50 border-emerald-200' :
                verifyResult.certificate?.certificateStatus === 'REVOKED'  ? 'bg-red-50 border-red-200' :
                verifyResult.certificate?.certificateStatus === 'EXPIRED'  ? 'bg-orange-50 border-orange-200' :
                'bg-red-50 border-red-200'
              }`}>
                {verifyResult.httpStatus === 200 ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      {verifyResult.certificate?.certificateStatus === 'VALID'   ? <CheckCircle size={22} className="text-emerald-600"/> :
                       verifyResult.certificate?.certificateStatus === 'REVOKED' ? <XCircle size={22} className="text-red-600"/> :
                       <AlertTriangle size={22} className="text-orange-600"/>}
                      <div>
                        <div className={`font-black text-sm ${
                          verifyResult.certificate?.certificateStatus === 'VALID'   ? 'text-emerald-700' :
                          verifyResult.certificate?.certificateStatus === 'REVOKED' ? 'text-red-700' : 'text-orange-700'
                        }`}>
                          {verifyResult.certificate?.certificateStatus === 'VALID'   ? '✅ Certificate Verified Successfully' :
                           verifyResult.certificate?.certificateStatus === 'REVOKED' ? '🚫 Certificate Revoked' : '⏰ Certificate Expired'}
                        </div>
                        <div className="text-xs text-gray-500">Verified from Levlox CRM database</div>
                      </div>
                    </div>
                    {verifyResult.certificate && (
                      <div className="space-y-1.5">
                        {[
                          { k: 'Student Name',    v: verifyResult.certificate.studentName },
                          { k: 'Course Name',     v: verifyResult.certificate.courseName },
                          { k: 'Certificate ID',  v: verifyResult.certificate.certificateId },
                          { k: 'Issue Date',      v: verifyResult.certificate.issueDate },
                          { k: 'Completion Date', v: verifyResult.certificate.completionDate },
                          { k: 'Status',          v: verifyResult.certificate.certificateStatus },
                        ].map(row => (
                          <div key={row.k} className="flex justify-between text-xs">
                            <span className="text-gray-500 font-semibold">{row.k}</span>
                            <span className={`font-bold ${row.k === 'Status' ?
                              (row.v === 'VALID' ? 'text-emerald-700' : row.v === 'REVOKED' ? 'text-red-700' : 'text-orange-700') :
                              'text-gray-800'}`}>{row.v}</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 pt-2 flex justify-between text-xs">
                          <span className="text-gray-500 font-semibold flex items-center gap-1"><Clock size={10}/> Verified On</span>
                          <span className="font-bold text-gray-700">{new Date().toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <XCircle size={22} className="text-red-600 shrink-0"/>
                    <div>
                      <div className="font-black text-red-700 text-sm">❌ Certificate Not Found</div>
                      <div className="text-xs text-red-600 mt-0.5">This ID does not exist in the Levlox database.</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Flow explainer */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <QrCode size={15} className="text-slate-400"/>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QR Scan Flow</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              {[
                'User scans the QR code on the physical/digital certificate',
                `Browser opens ${FRONTEND_URL}/verify/LVX-…`,
                'React page calls GET /api/certificates/verify/:id',
                'Flask checks MongoDB for the certificate ID',
                'Valid → Green ✅  |  Revoked/Invalid → Red ❌',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">{i+1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ DETAIL MODAL ═══════════════════════════════════════════ */}
      {detailModal && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setDetailModal(false)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl z-10 overflow-y-auto max-h-[90vh] text-left">

            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Award size={16} className="text-white"/>
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm font-mono">{selectedCert.certificateId}</h4>
                  <StatusBadge status={selectedCert.certificateStatus}/>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(selectedCert)}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 transition-all"
                >
                  {pdfLoading ? <RefreshCw size={12} className="animate-spin"/> : <Download size={12}/>}
                  Download PDF
                </button>
                <button onClick={() => setDetailModal(false)} className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer">
                  <X size={16} className="text-gray-400"/>
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-6">
              {!isSuperAdmin && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 font-semibold flex items-center gap-2">
                  <Shield size={14} className="text-slate-500" />
                  Read-Only Mode: You must be a Super Admin to modify certificates.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Left: details */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Certificate Details</h5>

                  {[
                    { label: 'Student Name',    value: selectedCert.studentName,                 icon: User },
                    { label: 'Course Name',     value: selectedCert.courseName,                  icon: BookOpen },
                    { label: 'Issue Date',      value: fmt(selectedCert.issuedDate),              icon: Calendar },
                    { label: 'Completion Date', value: fmt(selectedCert.completionDate),          icon: Calendar },
                    { label: 'Created At',      value: fmt(selectedCert.createdAt),               icon: Clock },
                    { label: 'Created By',      value: selectedCert.createdBy || 'System / Batch Upload', icon: Shield },
                  ].map(row => {
                    const Icon = row.icon;
                    return (
                      <div key={row.label}>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Icon size={10}/> {row.label}
                        </div>
                        <div className="text-sm font-semibold text-gray-800">{row.value}</div>
                      </div>
                    );
                  })}

                  {selectedCert.certificateStatus === 'REVOKED' && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 space-y-1">
                      <div className="text-[10px] font-black text-red-600 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle size={11} /> Revocation Details
                      </div>
                      <div className="text-xs text-red-800 font-bold">Reason: {selectedCert.revocationReason || 'No reason specified.'}</div>
                      {selectedCert.revokedAt && (
                        <div className="text-[10px] text-red-600/70 font-semibold">On: {new Date(selectedCert.revokedAt).toLocaleString()}</div>
                      )}
                    </div>
                  )}

                  {/* Verify URL */}
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Verify URL</div>
                    <div className="flex items-center gap-2">
                      <a
                        href={selectedCert.verifyUrl || buildVerifyUrl(selectedCert.certificateId)}
                        target="_blank" rel="noreferrer"
                        className="text-xs font-mono text-indigo-600 hover:underline truncate flex-1"
                      >
                        {selectedCert.verifyUrl || buildVerifyUrl(selectedCert.certificateId)}
                      </a>
                      <button onClick={() => copyToClipboard(selectedCert.verifyUrl || buildVerifyUrl(selectedCert.certificateId), 'url')} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
                        {copied === 'url' ? <Check size={11} className="text-emerald-500"/> : <Copy size={11} className="text-gray-400"/>}
                      </button>
                      <a href={selectedCert.verifyUrl || buildVerifyUrl(selectedCert.certificateId)} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-gray-100">
                        <ExternalLink size={11} className="text-gray-400"/>
                      </a>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => openEditModal(selectedCert)}
                        className="flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        <Edit2 size={12}/> Edit
                      </button>
                      <button
                        onClick={() => openReissueModal(selectedCert)}
                        className="flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        <RotateCcw size={12}/> Reissue
                      </button>
                      {selectedCert.certificateStatus !== 'REVOKED' && (
                        <button
                          onClick={() => openDeleteModal(selectedCert)}
                          className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                        >
                          <Ban size={12}/> Revoke
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Live QR rendered by qrcode.react */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-center h-fit">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">QR Code</div>
                  <div className="bg-white rounded-2xl p-3 shadow-xl">
                    <QRCodeCanvas
                      value={selectedCert.verifyUrl || buildVerifyUrl(selectedCert.certificateId)}
                      size={152}
                      bgColor="#ffffff"
                      fgColor="#0f172a"
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Scan with phone camera to<br/>verify this certificate instantly
                  </p>
                  <div className="mt-3 bg-slate-700/50 rounded-xl px-3 py-1.5">
                    <span className="text-[10px] font-mono text-slate-300">{selectedCert.certificateId}</span>
                  </div>
                  <div className="mt-2 text-[9px] text-slate-500 break-all max-w-[180px] leading-tight">
                    {selectedCert.verifyUrl || buildVerifyUrl(selectedCert.certificateId)}
                  </div>
                </div>
              </div>

              {/* Audit Trail Log */}
              {selectedCert.auditLog && selectedCert.auditLog.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Audit Trail Log</h5>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden text-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-100/50 text-gray-500 font-bold">
                            <th className="px-4 py-2 text-[10px] uppercase tracking-wider">Action</th>
                            <th className="px-4 py-2 text-[10px] uppercase tracking-wider">By</th>
                            <th className="px-4 py-2 text-[10px] uppercase tracking-wider">Date & Time</th>
                            <th className="px-4 py-2 text-[10px] uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          {selectedCert.auditLog.map((log, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-2 font-semibold">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                                  log.action === 'CREATED' ? 'bg-green-100 text-green-800' :
                                  log.action === 'EDITED' ? 'bg-blue-100 text-blue-800' :
                                  log.action === 'REISSUED' ? 'bg-violet-100 text-violet-800' :
                                  'bg-red-100 text-red-800'
                                }`}>{log.action}</span>
                              </td>
                              <td className="px-4 py-2 font-medium">{log.by}</td>
                              <td className="px-4 py-2 text-gray-500">{new Date(log.date).toLocaleString()}</td>
                              <td className="px-4 py-2 text-gray-600 font-medium">{log.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT MODAL ═════════════════════════════════════════════ */}
      {editModal && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setEditModal(false)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl z-10 overflow-hidden text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit2 size={16} className="text-amber-500" />
                <h4 className="font-extrabold text-gray-900 text-sm">Edit Certificate</h4>
              </div>
              <button onClick={() => setEditModal(false)} className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer">
                <X size={16} className="text-gray-400"/>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="text-xs text-gray-400 mb-2 font-semibold">Editing certificate ID: <span className="font-mono text-gray-700 font-bold">{selectedCert.certificateId}</span></div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400"><User size={11} className="inline mr-1"/> Student Name</label>
                <input type="text" required value={editForm.studentName} onChange={e => setEditForm({...editForm, studentName: e.target.value})} className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all"/>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400"><BookOpen size={11} className="inline mr-1"/> Course Name</label>
                <input type="text" required value={editForm.courseName} onChange={e => setEditForm({...editForm, courseName: e.target.value})} className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400"><Calendar size={11} className="inline mr-1"/> Issue Date</label>
                  <input type="date" required value={editForm.issuedDate} onChange={e => setEditForm({...editForm, issuedDate: e.target.value})} className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400"><Calendar size={11} className="inline mr-1"/> Completion Date</label>
                  <input type="date" required value={editForm.completionDate} onChange={e => setEditForm({...editForm, completionDate: e.target.value})} className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"/>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-md">
                {submitting ? <RefreshCw size={12} className="animate-spin"/> : <Check size={12}/>}
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ REISSUE MODAL ══════════════════════════════════════════ */}
      {reissueModal && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setReissueModal(false)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl z-10 overflow-hidden text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <RotateCcw size={16} className="text-indigo-500" />
                <h4 className="font-extrabold text-gray-900 text-sm">Reissue Certificate</h4>
              </div>
              <button onClick={() => setReissueModal(false)} className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer">
                <X size={16} className="text-gray-400"/>
              </button>
            </div>

            <form onSubmit={handleReissueSubmit} className="p-6 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700 mb-2 font-semibold">
                This will reset the status to <span className="font-bold">VALID</span> and remove any revocation logs. The Certificate ID remains the same.
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400"><User size={11} className="inline mr-1"/> Student Name</label>
                <input type="text" required value={reissueForm.studentName} onChange={e => setReissueForm({...reissueForm, studentName: e.target.value})} className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all"/>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400"><BookOpen size={11} className="inline mr-1"/> Course Name</label>
                <input type="text" required value={reissueForm.courseName} onChange={e => setReissueForm({...reissueForm, courseName: e.target.value})} className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400"><Calendar size={11} className="inline mr-1"/> Issue Date</label>
                  <input type="date" required value={reissueForm.issuedDate} onChange={e => setReissueForm({...reissueForm, issuedDate: e.target.value})} className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400"><Calendar size={11} className="inline mr-1"/> Completion Date</label>
                  <input type="date" required value={reissueForm.completionDate} onChange={e => setReissueForm({...reissueForm, completionDate: e.target.value})} className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"/>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-md">
                {submitting ? <RefreshCw size={12} className="animate-spin"/> : <RotateCcw size={12}/>}
                Reissue Certificate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE/REVOKE MODAL ════════════════════════════════════ */}
      {deleteModal && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setDeleteModal(false)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl z-10 overflow-hidden text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Trash size={16} className="text-red-500" />
                <h4 className="font-extrabold text-gray-900 text-sm">Revoke / Soft Delete Certificate</h4>
              </div>
              <button onClick={() => setDeleteModal(false)} className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer">
                <X size={16} className="text-gray-400"/>
              </button>
            </div>

            <form onSubmit={handleDeleteSubmit} className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700 mb-2 font-semibold">
                Warning: This will set the certificate status to <span className="font-bold">REVOKED</span>. Public verify scans will show a revoked warning with the reason.
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Revocation Reason</label>
                <textarea
                  required
                  rows="3"
                  value={deleteForm.reason}
                  onChange={e => setDeleteForm({ reason: e.target.value })}
                  placeholder="e.g. Completed course was flagged for academic dishonesty, or batch error."
                  className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                />
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-md">
                {submitting ? <RefreshCw size={12} className="animate-spin"/> : <Ban size={12}/>}
                Confirm Revocation
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CertificateManagementView;
