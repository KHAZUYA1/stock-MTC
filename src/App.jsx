import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import {
  Wrench,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  PackagePlus,
  ArrowLeftRight,
  ClipboardCheck,
  History,
  Settings,
  LogOut,
  FileSpreadsheet,
  MessageCircle,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  AlertOctagon,
  BellRing,
  Search,
  Plus,
  FileUp,
  Download,
  Upload,
  Pencil,
  Trash2,
  CheckCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  Database,
  Sun,
  Moon,
  ScanBarcode,
  Cloud,
  RefreshCw,
  Activity
} from 'lucide-react';

// ============================================================================
// KONSTANTA & DUKUNGAN MULTI-BAHASA (ID / EN / KO)
// ============================================================================
const STORAGE_KEYS = {
  SPAREPARTS: 'maintstock_react_spareparts_v3',
  TRANSACTIONS: 'maintstock_react_transactions_v3',
  CONFIG: 'maintstock_react_config_v3',
  FB_CONFIG: 'maintstock_react_fb_config_v3',
  SESSION: 'maintstock_react_session_v3'
};

const DEFAULT_ADMIN_EMAIL = 'yuda@pgcm.co.kr';
const DEFAULT_ADMIN_PASSWORD = String.fromCharCode(89, 112, 100, 102, 48, 57, 49, 48, 48, 49);

// Konfigurasi default Firebase agar otomatis online di semua perangkat tanpa copy-paste manual
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBiNs1ekLKzUv20MSZdrOsLR30BZV7FcDw',
  authDomain: 'stock-mtc-db.firebaseapp.com',
  projectId: 'stock-mtc-db',
  storageBucket: 'stock-mtc-db.firebasestorage.app',
  messagingSenderId: '126205447167',
  appId: '1:126205447167:web:361120526dc031a37cb5ca'
};

const resolveInitialFirebaseJson = () => {
  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return typeof __firebase_config === 'string'
        ? __firebase_config
        : JSON.stringify(__firebase_config, null, 2);
    }
  } catch {
    // Abaikan jika global __firebase_config tidak terdefinisi
  }

  try {
    const envCfg = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_CONFIG;
    if (envCfg) {
      return typeof envCfg === 'string' ? envCfg : JSON.stringify(envCfg, null, 2);
    }
  } catch {
    // Abaikan jika import.meta.env tidak tersedia
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FB_CONFIG);
    if (saved && saved.trim()) return saved;
  } catch {
    // Abaikan error akses localStorage
  }

  return JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2);
};

const I18N = {
  id: {
    appName: 'MaintStock Pro',
    opBadge: 'Operasional Maintenance',
    loginDesc: 'Sistem kontrol stok awal, mutasi IN/OUT harian, stok opname bulanan, dan sinkronisasi Firebase.',
    emailLabel: 'Email Administrator',
    passLabel: 'Password',
    loginBtn: 'Masuk ke Sistem',
    navDashboard: 'Dashboard IN / OUT',
    navSpareparts: 'Stok Awal & Master Part',
    navTransactions: 'Transaksi IN / OUT',
    navOpname: 'Stok Opname Bulanan',
    navHistory: 'Riwayat Mutasi',
    navSettings: 'Pengaturan, Tema & Cloud',
    kpiTotalItems: 'Total Item Sparepart',
    kpiMonthIn: 'Mutasi IN Bulan Ini',
    kpiMonthOut: 'Pemakaian OUT Rutin',
    kpiLowStock: 'Stok Kritis / ROP',
    exportExcel: 'Export Excel',
    waReport: 'WA Laporan',
    emailReport: 'Email',
    quickScanPlaceholder: 'Scan barcode / ketik Kode Part untuk mutasi cepat IN/OUT...',
    resetTx: 'Reset Semua Transaksi',
    resetAll: 'Reset Semua Data (Ke Nol)',
    cloudSyncTitle: 'Sinkronisasi Database Firebase',
    cloudSyncDesc: 'Hubungkan ke Firestore agar data tersinkronisasi realtime antar perangkat & tim maintenance.'
  },
  en: {
    appName: 'MaintStock Pro',
    opBadge: 'Maintenance Operations',
    loginDesc: 'Initial stock control, daily IN/OUT mutations, monthly stock opname, and Firebase sync.',
    emailLabel: 'Administrator Email',
    passLabel: 'Password',
    loginBtn: 'Sign In to System',
    navDashboard: 'IN / OUT Dashboard',
    navSpareparts: 'Initial Stock & Master',
    navTransactions: 'IN / OUT Transactions',
    navOpname: 'Monthly Stock Opname',
    navHistory: 'Mutation History',
    navSettings: 'Settings, Theme & Cloud',
    kpiTotalItems: 'Total Sparepart SKUs',
    kpiMonthIn: 'Monthly IN Movement',
    kpiMonthOut: 'Routine OUT Usage',
    kpiLowStock: 'Critical / ROP Stock',
    exportExcel: 'Export Excel',
    waReport: 'WA Report',
    emailReport: 'Email',
    quickScanPlaceholder: 'Scan barcode / type Part Code for quick IN/OUT mutation...',
    resetTx: 'Reset All Transactions',
    resetAll: 'Reset All Data (To Zero)',
    cloudSyncTitle: 'Firebase Database Sync',
    cloudSyncDesc: 'Connect to Firestore so inventory & mutations sync in realtime across devices.'
  },
  ko: {
    appName: 'MaintStock Pro',
    opBadge: '설비 보전 운영 시스템',
    loginDesc: '초기 재고 관리, 일일 입출고(IN/OUT), 월간 실사 및 Firebase 실시간 동기화.',
    emailLabel: '관리자 이메일',
    passLabel: '비밀번호',
    loginBtn: '시스템 로그인',
    navDashboard: '입출고 대시보드',
    navSpareparts: '초기재고 및 부품마스터',
    navTransactions: '입출고 거래 (IN/OUT)',
    navOpname: '월간 재고실사',
    navHistory: '수불 이력 조회',
    navSettings: '설정, 테마 및 클라우드',
    kpiTotalItems: '전체 예비품 품목',
    kpiMonthIn: '당월 입고 (IN)',
    kpiMonthOut: '당월 출고 (OUT)',
    kpiLowStock: '안전재고(ROP) 미달',
    exportExcel: '엑셀 내보내기',
    waReport: 'WA 보고',
    emailReport: '이메일',
    quickScanPlaceholder: '바코드 스캔 또는 부품코드 입력으로 빠른 입출고 처리...',
    resetTx: '모든 거래 초기화',
    resetAll: '전체 데이터 초기화 (0)',
    cloudSyncTitle: 'Firebase 데이터베이스 동기화',
    cloudSyncDesc: 'Firestore를 연결하여 여러 기기에서 재고 및 수불 내역을 실시간 동기화합니다.'
  }
};

const CATEGORIES = [
  'Mechanical & Bearing',
  'Electrical & Sensor',
  'Pneumatic & Hydraulic',
  'Lubricant & Consumable',
  'General Maintenance'
];

const MAINTENANCE_TYPES = [
  'Preventive Maintenance (PM)',
  'Corrective / Breakdown',
  'Supplier Delivery / PO',
  'Return / Penyesuaian'
];

const getCurrentMonthStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getTodayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const createInitialConfig = () => ({
  adminEmail: DEFAULT_ADMIN_EMAIL,
  adminPassword: DEFAULT_ADMIN_PASSWORD,
  companyName: 'PGCM Maintenance',
  subtitle: 'Sparepart Inventory Control',
  accentColor: 'blue',
  sidebarStyle: 'dark',
  darkMode: false,
  language: 'id',
  whatsapp: '082270189045',
  email: 'yuda@pgcm.co.kr',
  firebaseProjectId: ''
});

const createEmptySpareparts = () => [];
const createEmptyTransactions = () => [];

// ============================================================================
// FUNGSI UTILITAS FORMAT, PARSING & DOWNLOAD EXCEL (.XLSX)
// ============================================================================
const formatRp = (num) => 'Rp ' + (Number(num) || 0).toLocaleString('id-ID');

const safeReadStorage = (key, fallbackFn) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallbackFn();
    const parsed = JSON.parse(raw);
    return parsed ?? fallbackFn();
  } catch {
    return fallbackFn();
  }
};

const safeWriteStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage write warning:', err);
  }
};

const sanitizeDocId = (rawId, prefix = 'doc') => {
  const clean = String(rawId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return clean || `${prefix}_${Date.now()}`;
};

const parseExcelNumber = (val, fallback = 0) => {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const cleaned = String(val || '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const pickRowValue = (row, keys) => {
  const record = row || {};
  const map = {};
  Object.keys(record).forEach((k) => {
    const norm = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
    map[norm] = record[k];
  });
  for (const key of keys) {
    const norm = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (Object.prototype.hasOwnProperty.call(map, norm)) {
      const val = map[norm];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
  }
  return '';
};

const parseSimpleCsv = (csvText) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? '';
    });
    return obj;
  });
};

const escapeXml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const downloadRowsAsExcel = (rows, sheetName, fileName) => {
  if (!Array.isArray(rows) || rows.length === 0) return;

  if (typeof window.XLSX !== 'undefined') {
    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length + 4, 16)
    }));
    window.XLSX.utils.book_append_sheet(wb, ws, sheetName);
    window.XLSX.writeFile(wb, fileName);
    return;
  }

  const headers = Object.keys(rows[0]);
  const headerCells = headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('');

  const bodyRows = rows
    .map((row) => {
      const cells = headers
        .map((h) => {
          const val = row[h] ?? '';
          const isNumeric = typeof val === 'number' && !Number.isNaN(val);
          const cellType = isNumeric ? 'Number' : 'String';
          return `<Cell><Data ss:Type="${cellType}">${escapeXml(val)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table>
   <Row>${headerCells}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const safeXlsName = fileName.toLowerCase().endsWith('.xlsx')
    ? fileName.slice(0, -5) + '.xls'
    : fileName;
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeXlsName;
  a.click();
  URL.revokeObjectURL(url);
};

// ============================================================================
// KOMPONEN GRAFIK INTERAKTIF (DARK / LIGHT AWARE)
// ============================================================================
function InOutTrendChart({ transactions, isDark }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const series = useMemo(() => {
    const base = new Date();
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mTx = transactions.filter((t) => (t.date || '').startsWith(ym));
      const inQty = mTx.filter((t) => t.type === 'IN').reduce((s, x) => s + (Number(x.qty) || 0), 0);
      const outQty = mTx.filter((t) => t.type === 'OUT').reduce((s, x) => s + (Number(x.qty) || 0), 0);
      arr.push({ label: ym, inQty, outQty });
    }
    return arr;
  }, [transactions]);

  const maxVal = useMemo(() => {
    const peak = Math.max(10, ...series.map((s) => Math.max(s.inQty, s.outQty)));
    return Math.ceil(peak * 1.2);
  }, [series]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className={`inline-flex items-center gap-1.5 font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
            IN
          </span>
          <span className={`inline-flex items-center gap-1.5 font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
            <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"></span>
            OUT
          </span>
        </div>
        {hoveredIdx !== null && series[hoveredIdx] && (
          <div className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-mono font-medium">
            {series[hoveredIdx].label}: IN {series[hoveredIdx].inQty} • OUT {series[hoveredIdx].outQty}
          </div>
        )}
      </div>

      <div
        className={`h-56 w-full rounded-2xl border p-4 flex flex-col justify-between ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/80 border-slate-100'
        }`}
      >
        <div
          className={`flex-1 grid grid-cols-6 gap-2 sm:gap-4 items-end pt-4 border-b pb-2 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          {series.map((item, idx) => {
            const inPct = Math.min(100, Math.round((item.inQty / maxVal) * 100));
            const outPct = Math.min(100, Math.round((item.outQty / maxVal) * 100));
            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="h-full flex flex-col justify-end items-center group cursor-pointer"
              >
                <div className="w-full max-w-[54px] h-full flex items-end justify-center gap-1">
                  <div
                    style={{ height: `${Math.max(inPct, item.inQty > 0 ? 8 : 2)}%` }}
                    className="w-1/2 bg-emerald-500 group-hover:bg-emerald-400 rounded-t-md transition-all duration-300 relative"
                  >
                    {item.inQty > 0 && (
                      <span
                        className={`hidden sm:block text-[10px] font-bold text-center -top-4 relative ${
                          isDark ? 'text-emerald-300' : 'text-emerald-700'
                        }`}
                      >
                        {item.inQty}
                      </span>
                    )}
                  </div>
                  <div
                    style={{ height: `${Math.max(outPct, item.outQty > 0 ? 8 : 2)}%` }}
                    className="w-1/2 bg-amber-500 group-hover:bg-amber-400 rounded-t-md transition-all duration-300 relative"
                  >
                    {item.outQty > 0 && (
                      <span
                        className={`hidden sm:block text-[10px] font-bold text-center -top-4 relative ${
                          isDark ? 'text-amber-300' : 'text-amber-700'
                        }`}
                      >
                        {item.outQty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-4 pt-2 text-center">
          {series.map((item) => (
            <span
              key={item.label}
              className={`text-[11px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpenseCategoryChart({ monthOutTx, spareparts, isDark }) {
  const breakdown = useMemo(() => {
    const totals = {};
    monthOutTx.forEach((tx) => {
      const sp = spareparts.find((s) => s.id === tx.sparepartId);
      const cat = sp?.category || tx.category || 'General Maintenance';
      const prevTotal = Number(totals[cat] || 0);
      totals[cat] = prevTotal + (Number(tx.totalValue) || 0);
    });
    const entries = Object.entries(totals).sort((a, b) => Number(b[1]) - Number(a[1]));
    const grandTotal = entries.reduce((acc, [, v]) => acc + Number(v || 0), 0);
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444'];
    return {
      grandTotal,
      items: entries.map(([label, value], i) => {
        const numVal = Number(value) || 0;
        return {
          label,
          value: numVal,
          pct: grandTotal > 0 ? Math.round((numVal / grandTotal) * 100) : 0,
          color: palette[i % palette.length]
        };
      })
    };
  }, [monthOutTx, spareparts]);

  if (breakdown.items.length === 0) {
    return (
      <div
        className={`h-56 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed p-4 ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50/80 border-slate-200 text-slate-500'
        }`}
      >
        <p className="text-xs font-semibold">OUT = 0</p>
        <p className="text-[11px] opacity-75 mt-1">Catat transaksi OUT atau import batch Excel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl p-3.5 border flex items-center justify-between ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}
      >
        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total OUT</span>
        <span className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {formatRp(breakdown.grandTotal)}
        </span>
      </div>

      <div className="space-y-3">
        {breakdown.items.map((row) => (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold truncate pr-2 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }}></span>
                <span className="truncate">{row.label}</span>
              </span>
              <span className={`font-bold shrink-0 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                {formatRp(row.value)} ({row.pct}%)
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(row.pct, 4)}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN UTAMA APLIKASI (APP)
// ============================================================================
export default function App() {
  const defaultMonth = useMemo(() => getCurrentMonthStr(), []);
  const defaultToday = useMemo(() => getTodayStr(), []);

  // State Autentikasi & Sesi
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.SESSION) === 'true';
    } catch {
      return false;
    }
  });
  const [loginEmail, setLoginEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // State Konfigurasi & Data Utama
  const [config, setConfig] = useState(() => safeReadStorage(STORAGE_KEYS.CONFIG, createInitialConfig));
  const [spareparts, setSpareparts] = useState(() => safeReadStorage(STORAGE_KEYS.SPAREPARTS, createEmptySpareparts));
  const [transactions, setTransactions] = useState(() => safeReadStorage(STORAGE_KEYS.TRANSACTIONS, createEmptyTransactions));

  // State Koneksi Firebase Realtime
  const [fbJsonText, setFbJsonText] = useState(() => resolveInitialFirebaseJson());
  const [cloudStatus, setCloudStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'error'
  const [cloudUserUid, setCloudUserUid] = useState('');
  const cloudDbRef = useRef(null);
  const cloudAppIdRef = useRef('maintstock-pgcm-cloud');
  const permissionErrorNotifiedRef = useRef(false);

  const lang = config.language || 'id';
  const t = I18N[lang] || I18N.id;
  const isDark = Boolean(config.darkMode);

  // Navigasi & Filter Global
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  // Futuristic Quick Scanner / Command Bar (IN / OUT cepat via Kode Part)
  const [quickCode, setQuickCode] = useState('');
  const [quickQty, setQuickQty] = useState(1);
  const [quickMode, setQuickMode] = useState('OUT');

  // Toast & Confirm Dialog State
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolverRef = useRef(null);

  // Filter Master Sparepart & Modal Input/Edit
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [spModalOpen, setSpModalOpen] = useState(false);
  const [editingSpId, setEditingSpId] = useState(null);
  const [spForm, setSpForm] = useState({
    code: '',
    name: '',
    category: 'Mechanical & Bearing',
    machine: '',
    unit: 'pcs',
    initialStock: 0,
    currentStock: 0,
    minStock: 5,
    unitPrice: 0,
    location: ''
  });

  // Form Transaksi IN / OUT
  const [txType, setTxType] = useState('IN');
  const [txSparepartId, setTxSparepartId] = useState('');
  const [txQty, setTxQty] = useState('');
  const [txDate, setTxDate] = useState(defaultToday);
  const [txMaintType, setTxMaintType] = useState(MAINTENANCE_TYPES[0]);
  const [txWoRef, setTxWoRef] = useState('');
  const [txNotes, setTxNotes] = useState('');

  // Stok Opname Bulanan State
  const [opnameInputs, setOpnameInputs] = useState({});

  // Riwayat Mutasi Filter
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');

  // Form Pengaturan & Password
  const [settingsForm, setSettingsForm] = useState(() => ({
    companyName: config.companyName,
    subtitle: config.subtitle,
    accentColor: config.accentColor,
    sidebarStyle: config.sidebarStyle,
    darkMode: Boolean(config.darkMode),
    language: config.language || 'id',
    whatsapp: config.whatsapp,
    email: config.email
  }));
  const [oldPassInput, setOldPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showPassFields, setShowPassFields] = useState({ old: false, new: false, confirm: false });

  // Helper Toast
  const pushToast = (message, type = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  };

  // Helper Konfirmasi Modal
  const requestConfirm = (title, message) => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState({ title, message });
    });
  };

  const resolveConfirm = (choice) => {
    setConfirmState(null);
    if (confirmResolverRef.current) {
      confirmResolverRef.current(choice);
      confirmResolverRef.current = null;
    }
  };

  // Sinkronisasi ke localStorage
  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.CONFIG, config);
  }, [config]);

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.SPAREPARTS, spareparts);
    if (!txSparepartId && spareparts.length > 0) {
      setTxSparepartId(spareparts[0].id);
    }
    setOpnameInputs((prev) => {
      const next = { ...prev };
      spareparts.forEach((sp) => {
        if (!next[sp.id]) {
          next[sp.id] = { physical: Number(sp.currentStock) || 0, note: '' };
        }
      });
      return next;
    });
  }, [spareparts, txSparepartId]);

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    setSettingsForm({
      companyName: config.companyName || 'PGCM Maintenance',
      subtitle: config.subtitle || 'Sparepart Inventory Control',
      accentColor: config.accentColor || 'blue',
      sidebarStyle: config.sidebarStyle || 'dark',
      darkMode: Boolean(config.darkMode),
      language: config.language || 'id',
      whatsapp: config.whatsapp || '082270189045',
      email: config.email || DEFAULT_ADMIN_EMAIL
    });
  }, [config]);

  // ==========================================================================
  // INTEGRASI FIREBASE FIRESTORE REALTIME SYNC
  // ==========================================================================
  const handleFirestorePermissionError = (err) => {
    if (err && err.code === 'permission-denied') {
      cloudDbRef.current = null;
      setCloudStatus('error');
      if (!permissionErrorNotifiedRef.current) {
        permissionErrorNotifiedRef.current = true;
        pushToast(
          'Akses Firestore ditolak (permission-denied). Aktifkan Anonymous Auth & Firestore Rules di Firebase Console. Mode Lokal tetap aktif.',
          'warning'
        );
      }
      return true;
    }
    return false;
  };

  const upsertSparepartCloud = async (spItem) => {
    if (cloudStatus !== 'connected' || !cloudDbRef.current || !spItem) return;
    const cleanId = sanitizeDocId(spItem.id, 'sp');
    try {
      await setDoc(
        doc(cloudDbRef.current, 'artifacts', cloudAppIdRef.current, 'public', 'data', 'spareparts', cleanId),
        {
          code: spItem.code || '',
          name: spItem.name || '',
          category: spItem.category || 'General Maintenance',
          machine: spItem.machine || '',
          unit: spItem.unit || 'pcs',
          initialStock: Number(spItem.initialStock) || 0,
          currentStock: Number(spItem.currentStock) || 0,
          minStock: Number(spItem.minStock) || 0,
          unitPrice: Number(spItem.unitPrice) || 0,
          location: spItem.location || '',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (err) {
      if (!handleFirestorePermissionError(err)) {
        console.warn('Upsert sparepart cloud warning:', err);
      }
    }
  };

  const deleteSparepartCloud = async (spId) => {
    if (cloudStatus !== 'connected' || !cloudDbRef.current || !spId) return;
    const cleanId = sanitizeDocId(spId, 'sp');
    try {
      await deleteDoc(
        doc(cloudDbRef.current, 'artifacts', cloudAppIdRef.current, 'public', 'data', 'spareparts', cleanId)
      );
    } catch (err) {
      if (!handleFirestorePermissionError(err)) {
        console.warn('Delete sparepart cloud warning:', err);
      }
    }
  };

  const upsertTransactionCloud = async (txItem) => {
    if (cloudStatus !== 'connected' || !cloudDbRef.current || !txItem) return;
    const cleanTxId = sanitizeDocId(txItem.id, 'tx');
    try {
      await setDoc(
        doc(cloudDbRef.current, 'artifacts', cloudAppIdRef.current, 'public', 'data', 'transactions', cleanTxId),
        {
          sparepartId: txItem.sparepartId || '',
          code: txItem.code || '',
          sparepartName: txItem.sparepartName || '',
          category: txItem.category || 'General Maintenance',
          unit: txItem.unit || 'pcs',
          type: txItem.type || 'IN',
          qty: Number(txItem.qty) || 0,
          diff: Number(txItem.diff) || 0,
          systemStock: Number(txItem.systemStock) || 0,
          physicalStock: Number(txItem.physicalStock) || 0,
          unitPrice: Number(txItem.unitPrice) || 0,
          totalValue: Number(txItem.totalValue) || 0,
          date: txItem.date || defaultToday,
          maintenanceType: txItem.maintenanceType || '',
          woRef: txItem.woRef || '',
          notes: txItem.notes || '',
          recordedBy: txItem.recordedBy || config.email || DEFAULT_ADMIN_EMAIL,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (err) {
      if (!handleFirestorePermissionError(err)) {
        console.warn('Upsert transaction cloud warning:', err);
      }
    }
  };

  const upsertConfigCloud = async (cfgObj) => {
    if (cloudStatus !== 'connected' || !cloudDbRef.current || !cfgObj) return;
    try {
      const cfgRef = doc(cloudDbRef.current, 'artifacts', cloudAppIdRef.current, 'public', 'data', 'system_config', 'main');
      await setDoc(
        cfgRef,
        {
          companyName: cfgObj.companyName || 'PGCM Maintenance',
          subtitle: cfgObj.subtitle || 'Sparepart Inventory Control',
          accentColor: cfgObj.accentColor || 'blue',
          sidebarStyle: cfgObj.sidebarStyle || 'dark',
          whatsapp: cfgObj.whatsapp || '082270189045',
          email: cfgObj.email || DEFAULT_ADMIN_EMAIL,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (err) {
      if (!handleFirestorePermissionError(err)) {
        console.warn('Upsert config cloud warning:', err);
      }
    }
  };

  const clearCloudCollection = async (colName, items) => {
    if (cloudStatus !== 'connected' || !cloudDbRef.current || !Array.isArray(items)) return;
    for (const item of items) {
      if (!item || !item.id) continue;
      try {
        await deleteDoc(
          doc(cloudDbRef.current, 'artifacts', cloudAppIdRef.current, 'public', 'data', colName, sanitizeDocId(item.id, colName))
        );
      } catch (err) {
        if (!handleFirestorePermissionError(err)) {
          console.warn(`Clear ${colName} item warning:`, err);
        }
      }
    }
  };

  const connectFirebaseFromJson = async (rawJson, silent = false) => {
    const trimmed = (rawJson || '').trim();
    if (!trimmed) {
      cloudDbRef.current = null;
      setCloudStatus('disconnected');
      setCloudUserUid('');
      return;
    }

    let parsedCfg = null;
    try {
      parsedCfg = JSON.parse(trimmed);
    } catch {
      if (!silent) pushToast('Format JSON Firebase tidak valid.', 'error');
      setCloudStatus('error');
      return;
    }

    if (!parsedCfg || !parsedCfg.apiKey || !parsedCfg.projectId) {
      if (!silent) pushToast('JSON Firebase wajib memiliki apiKey dan projectId.', 'error');
      setCloudStatus('error');
      return;
    }

    try {
      setCloudStatus('connecting');
      const fbApp = initializeApp(parsedCfg, `maintstock_${parsedCfg.projectId}`);
      const fbAuth = getAuth(fbApp);
      const fbDb = getFirestore(fbApp);

      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(fbAuth, __initial_auth_token);
      } else {
        await signInAnonymously(fbAuth);
      }

      onAuthStateChanged(fbAuth, (user) => {
        if (user) {
          cloudDbRef.current = fbDb;
          cloudAppIdRef.current = parsedCfg.appId || parsedCfg.projectId;
          permissionErrorNotifiedRef.current = false;
          setCloudUserUid(user.uid);
          setCloudStatus('connected');
          if (!silent) pushToast(`Terhubung ke Firebase (${parsedCfg.projectId}).`, 'success');
        }
      });
    } catch (err) {
      console.error('Firebase connection error:', err);
      setCloudStatus('error');
      if (!silent) pushToast('Gagal menghubungkan ke Firebase. Periksa konfigurasi & rules.', 'error');
    }
  };

  // Coba sambungkan otomatis jika konfigurasi tersimpan atau tersedia di environment
  useEffect(() => {
    const initialJson = resolveInitialFirebaseJson();
    setFbJsonText(initialJson);
    if (initialJson.trim()) {
      void connectFirebaseFromJson(initialJson, true);
    }
  }, []);

  // Listener snapshot Firestore saat terhubung (prioritaskan data cloud antar perangkat)
  useEffect(() => {
    if (cloudStatus !== 'connected' || !cloudDbRef.current) return;
    const dbInstance = cloudDbRef.current;
    const currentAppId = cloudAppIdRef.current;

    const spCol = collection(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'spareparts');
    const txCol = collection(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'transactions');
    const cfgDoc = doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'system_config', 'main');

    const unsubSp = onSnapshot(
      spCol,
      (snap) => {
        const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (remoteList.length > 0) {
          setSpareparts(remoteList);
          safeWriteStorage(STORAGE_KEYS.SPAREPARTS, remoteList);
        } else {
          const cachedSp = safeReadStorage(STORAGE_KEYS.SPAREPARTS, createEmptySpareparts);
          if (cachedSp.length > 0) {
            setSpareparts(cachedSp);
            cachedSp.forEach((sp) => {
              void upsertSparepartCloud(sp);
            });
          } else {
            setSpareparts([]);
            safeWriteStorage(STORAGE_KEYS.SPAREPARTS, []);
          }
        }
      },
      (err) => {
        if (!handleFirestorePermissionError(err)) {
          console.error('Spareparts snapshot error:', err);
        }
      }
    );

    const unsubTx = onSnapshot(
      txCol,
      (snap) => {
        const remoteTx = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        if (remoteTx.length > 0) {
          setTransactions(remoteTx);
          safeWriteStorage(STORAGE_KEYS.TRANSACTIONS, remoteTx);
        } else {
          const cachedTx = safeReadStorage(STORAGE_KEYS.TRANSACTIONS, createEmptyTransactions);
          if (cachedTx.length > 0) {
            setTransactions(cachedTx);
            cachedTx.slice(0, 100).forEach((tx) => {
              void upsertTransactionCloud(tx);
            });
          } else {
            setTransactions([]);
            safeWriteStorage(STORAGE_KEYS.TRANSACTIONS, []);
          }
        }
      },
      (err) => {
        if (!handleFirestorePermissionError(err)) {
          console.error('Transactions snapshot error:', err);
        }
      }
    );

    const unsubCfg = onSnapshot(
      cfgDoc,
      (snap) => {
        if (snap.exists()) {
          const remoteCfg = snap.data();
          setConfig((prev) => {
            const merged = {
              ...prev,
              companyName: remoteCfg.companyName ?? prev.companyName,
              subtitle: remoteCfg.subtitle ?? prev.subtitle,
              accentColor: remoteCfg.accentColor ?? prev.accentColor,
              sidebarStyle: remoteCfg.sidebarStyle ?? prev.sidebarStyle,
              whatsapp: remoteCfg.whatsapp ?? prev.whatsapp,
              email: remoteCfg.email ?? prev.email
            };
            safeWriteStorage(STORAGE_KEYS.CONFIG, merged);
            return merged;
          });
        } else {
          const cachedCfg = safeReadStorage(STORAGE_KEYS.CONFIG, createInitialConfig);
          void upsertConfigCloud(cachedCfg);
        }
      },
      (err) => {
        if (!handleFirestorePermissionError(err)) {
          console.error('Config snapshot error:', err);
        }
      }
    );

    return () => {
      try { unsubSp(); } catch {}
      try { unsubTx(); } catch {}
      try { unsubCfg(); } catch {}
    };
  }, [cloudStatus]);

  // Push perubahan lokal ke Firestore ketika berstatus connected
  const syncSnapshotToCloud = async () => {
    if (cloudStatus !== 'connected' || !cloudDbRef.current) {
      pushToast('Firebase belum terhubung. Buka tab Pengaturan untuk menghubungkan.', 'warning');
      return;
    }

    try {
      await upsertConfigCloud(config);

      for (const sp of spareparts) {
        await upsertSparepartCloud(sp);
      }

      for (const tx of transactions.slice(0, 100)) {
        await upsertTransactionCloud(tx);
      }

      pushToast('Sinkronisasi penuh ke Firebase Firestore berhasil.', 'success');
    } catch (err) {
      if (!handleFirestorePermissionError(err)) {
        console.error('Sync push error:', err);
        pushToast('Gagal push data ke Firestore. Periksa Firestore Security Rules.', 'error');
      }
    }
  };

  // Helper sinkronisasi satu item sparepart & transaksi ke Firestore jika terhubung
  const persistMutationToCloud = async (spId, nextStock, txRecord) => {
    if (cloudStatus !== 'connected' || !cloudDbRef.current) return false;
    try {
      const dbInstance = cloudDbRef.current;
      const currentAppId = cloudAppIdRef.current;
      const cleanSpId = sanitizeDocId(spId, 'sp');
      const cleanTxId = sanitizeDocId(txRecord.id, 'tx');
      const spRef = doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'spareparts', cleanSpId);
      const txRef = doc(dbInstance, 'artifacts', currentAppId, 'public', 'data', 'transactions', cleanTxId);

      await runTransaction(dbInstance, async (transaction) => {
        const snap = await transaction.get(spRef);
        const liveStock = snap.exists() ? Number(snap.data().currentStock) || 0 : nextStock;
        const computedNext =
          txRecord.type === 'IN'
            ? liveStock + (Number(txRecord.qty) || 0)
            : liveStock - (Number(txRecord.qty) || 0);
        if (computedNext < 0) {
          throw new Error('Stok cloud tidak mencukupi.');
        }
        transaction.set(
          spRef,
          { currentStock: computedNext, updatedAt: serverTimestamp() },
          { merge: true }
        );
        transaction.set(txRef, { ...txRecord, id: cleanTxId, createdAt: serverTimestamp() });
      });
      return true;
    } catch (err) {
      if (!handleFirestorePermissionError(err)) {
        console.warn('Cloud mutation sync warning:', err);
      }
      return false;
    }
  };

  // ==========================================================================
  // LOGIN & LOGOUT
  // ==========================================================================
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const expectedEmail = (config.adminEmail || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
    const expectedPass = config.adminPassword || DEFAULT_ADMIN_PASSWORD;

    if (loginEmail.trim().toLowerCase() === expectedEmail && loginPassword === expectedPass) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(STORAGE_KEYS.SESSION, 'true');
      } catch {}
      setLoginPassword('');
      pushToast('Login berhasil.', 'success');
    } else {
      pushToast('Email atau password tidak sesuai.', 'error');
    }
  };

  const handleLogout = async () => {
    const ok = await requestConfirm('Logout', 'Keluar dari sesi operasional?');
    if (!ok) return;
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {}
    setMobileMenuOpen(false);
  };

  // ==========================================================================
  // STATISTIK & INSIGHT PREDIKSI STOK
  // ==========================================================================
  const dashboardStats = useMemo(() => {
    const totalItems = spareparts.length;
    const totalQty = spareparts.reduce((acc, s) => acc + (Number(s.currentStock) || 0), 0);
    const totalAssetValue = spareparts.reduce(
      (acc, s) => acc + (Number(s.currentStock) || 0) * (Number(s.unitPrice) || 0),
      0
    );
    // Alert muncul hanya jika stok saat ini <= ROP; otomatis hilang jika stok > ROP
    const lowStockItems = spareparts.filter((s) => {
      const cur = Number(s.currentStock) || 0;
      const rop = Number(s.minStock) || 0;
      return cur <= rop;
    });

    const monthTx = transactions.filter((t) => (t.date || '').startsWith(selectedMonth));
    const monthInTx = monthTx.filter((t) => t.type === 'IN');
    const monthOutTx = monthTx.filter((t) => t.type === 'OUT');

    const monthInQty = monthInTx.reduce((acc, t) => acc + (Number(t.qty) || 0), 0);
    const monthInValue = monthInTx.reduce((acc, t) => acc + (Number(t.totalValue) || 0), 0);
    const monthOutQty = monthOutTx.reduce((acc, t) => acc + (Number(t.qty) || 0), 0);
    const monthOutValue = monthOutTx.reduce((acc, t) => acc + (Number(t.totalValue) || 0), 0);

    return {
      totalItems,
      totalQty,
      totalAssetValue,
      lowStockItems,
      monthTx,
      monthInQty,
      monthInValue,
      monthOutQty,
      monthOutValue,
      monthOutTx
    };
  }, [spareparts, transactions, selectedMonth]);

  // ==========================================================================
  // FUTURISTIC QUICK SCANNER / COMMAND BAR (IN / OUT INSTAN VIA KODE PART)
  // ==========================================================================
  const handleQuickScanSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const codeTrim = String(quickCode || '').trim();
    const qtyNum = Math.max(1, Math.floor(Number(quickQty) || 1));

    if (!codeTrim) {
      pushToast('Masukkan atau scan Kode Part terlebih dahulu.', 'warning');
      return;
    }

    if (!Array.isArray(spareparts) || spareparts.length === 0) {
      pushToast('Master sparepart masih kosong. Tambah part atau import stok awal dulu.', 'warning');
      return;
    }

    const sp = spareparts.find(
      (item) => String(item.code || '').trim().toLowerCase() === codeTrim.toLowerCase()
    );
    if (!sp) {
      pushToast(`Kode Part "${codeTrim}" belum terdaftar di Master Sparepart.`, 'error');
      return;
    }

    const cur = Number(sp.currentStock) || 0;
    const next = quickMode === 'IN' ? cur + qtyNum : cur - qtyNum;
    if (next < 0) {
      pushToast(`Stok OUT melebihi saldo (${cur} ${sp.unit || 'pcs'}).`, 'error');
      return;
    }

    const price = Number(sp.unitPrice) || 0;
    const newTx = {
      id: `tx_scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sparepartId: sp.id,
      code: sp.code,
      sparepartName: sp.name,
      category: sp.category || 'General Maintenance',
      unit: sp.unit || 'pcs',
      type: quickMode,
      qty: qtyNum,
      unitPrice: price,
      totalValue: qtyNum * price,
      date: defaultToday,
      maintenanceType: quickMode === 'IN' ? 'Supplier Delivery / PO' : 'Preventive Maintenance (PM)',
      woRef: 'QUICK-SCAN',
      notes: `Quick ${quickMode} via Scanner/Command`,
      recordedBy: config.email || DEFAULT_ADMIN_EMAIL
    };

    const updatedSpareparts = spareparts.map((item) =>
      item.id === sp.id ? { ...item, currentStock: next } : item
    );
    const updatedTransactions = [newTx, ...transactions];

    setSpareparts(updatedSpareparts);
    setTransactions(updatedTransactions);
    safeWriteStorage(STORAGE_KEYS.SPAREPARTS, updatedSpareparts);
    safeWriteStorage(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);

    await persistMutationToCloud(sp.id, next, newTx);

    setQuickCode('');
    setQuickQty(1);
    pushToast(
      `Quick ${quickMode}: ${sp.code} (${quickMode === 'IN' ? '+' : '-'}${qtyNum} ${sp.unit || 'pcs'}) -> Sisa ${next}`,
      'success'
    );
  };

  // ==========================================================================
  // MASTER SPAREPART & STOK AWAL CRUD
  // ==========================================================================
  const filteredSpareparts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return spareparts
      .filter((item) => {
        const matchText =
          !q ||
          (item.code || '').toLowerCase().includes(q) ||
          (item.name || '').toLowerCase().includes(q) ||
          (item.machine || '').toLowerCase().includes(q) ||
          (item.location || '').toLowerCase().includes(q);

        const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
        const isLow = (Number(item.currentStock) || 0) <= (Number(item.minStock) || 0);
        const matchStatus =
          stockStatusFilter === 'ALL' ||
          (stockStatusFilter === 'LOW' && isLow) ||
          (stockStatusFilter === 'NORMAL' && !isLow);

        return matchText && matchCat && matchStatus;
      })
      .sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, [spareparts, searchQuery, categoryFilter, stockStatusFilter]);

  const openAddSparepartModal = () => {
    setEditingSpId(null);
    setSpForm({
      code: '',
      name: '',
      category: 'Mechanical & Bearing',
      machine: '',
      unit: 'pcs',
      initialStock: 0,
      currentStock: 0,
      minStock: 5,
      unitPrice: 0,
      location: ''
    });
    setSpModalOpen(true);
  };

  const openEditSparepartModal = (item) => {
    setEditingSpId(item.id);
    setSpForm({
      code: item.code || '',
      name: item.name || '',
      category: item.category || 'General Maintenance',
      machine: item.machine || '',
      unit: item.unit || 'pcs',
      initialStock: Number(item.initialStock) || 0,
      currentStock: Number(item.currentStock) || 0,
      minStock: Number(item.minStock) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      location: item.location || ''
    });
    setSpModalOpen(true);
  };

  const handleSaveSparepart = async (e) => {
    e.preventDefault();
    const cleanCode = spForm.code.trim();
    const cleanName = spForm.name.trim();
    if (!cleanCode || !cleanName) {
      pushToast('Kode Part & Nama Sparepart wajib diisi.', 'warning');
      return;
    }

    const payload = {
      code: cleanCode,
      name: cleanName,
      category: spForm.category,
      machine: spForm.machine.trim(),
      unit: spForm.unit.trim() || 'pcs',
      initialStock: Math.max(0, Number(spForm.initialStock) || 0),
      currentStock: Math.max(0, Number(spForm.currentStock) || 0),
      minStock: Math.max(0, Number(spForm.minStock) || 0),
      unitPrice: Math.max(0, Number(spForm.unitPrice) || 0),
      location: spForm.location.trim()
    };

    try {
      if (editingSpId) {
        const updatedRecord = { id: editingSpId, ...payload };
        const nextList = spareparts.map((s) => (s.id === editingSpId ? { ...s, ...payload } : s));
        setSpareparts(nextList);
        safeWriteStorage(STORAGE_KEYS.SPAREPARTS, nextList);
        await upsertSparepartCloud(updatedRecord);
        pushToast('Sparepart diperbarui.', 'success');
      } else {
        const newId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const newRecord = { id: newId, ...payload };
        const nextList = [...spareparts, newRecord];
        setSpareparts(nextList);
        safeWriteStorage(STORAGE_KEYS.SPAREPARTS, nextList);
        if (!txSparepartId) setTxSparepartId(newId);
        await upsertSparepartCloud(newRecord);
        pushToast('Barang & stok awal tersimpan.', 'success');
      }
      setSpModalOpen(false);
    } catch (err) {
      console.error('Save sparepart error:', err);
      pushToast('Gagal menyimpan sparepart.', 'error');
    }
  };

  const handleDeleteSparepart = async (item) => {
    const ok = await requestConfirm('Hapus Sparepart', `Hapus "${item.code} - ${item.name}"?`);
    if (!ok) return;
    const nextList = spareparts.filter((s) => s.id !== item.id);
    setSpareparts(nextList);
    safeWriteStorage(STORAGE_KEYS.SPAREPARTS, nextList);
    if (txSparepartId === item.id) setTxSparepartId('');
    await deleteSparepartCloud(item.id);
    pushToast('Sparepart dihapus.', 'success');
  };

  // ==========================================================================
  // IMPORT & EXPORT EXCEL / CSV
  // ==========================================================================
  const downloadImportTemplate = () => {
    const sampleRows = [
      {
        'Kode Part': '',
        'Nama Sparepart': '',
        Kategori: 'Mechanical & Bearing',
        Mesin: '',
        'Lokasi Rak': '',
        Satuan: 'pcs',
        'Stok Awal': 0,
        'Stok Saat Ini': 0,
        'Min Stok (ROP)': 5,
        'Harga Satuan': 0
      },
      {
        'Kode Part': '',
        'Nama Sparepart': '',
        Kategori: 'Electrical & Sensor',
        Mesin: '',
        'Lokasi Rak': '',
        Satuan: 'pcs',
        'Stok Awal': 0,
        'Stok Saat Ini': 0,
        'Min Stok (ROP)': 5,
        'Harga Satuan': 0
      }
    ];

    downloadRowsAsExcel(sampleRows, 'Template_Sparepart', 'Template_Import_Sparepart_Maintenance.xlsx');
    pushToast('Template Excel siap input data diunduh.', 'success');
  };

  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      let rawRows = [];
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.csv')) {
        const text = await file.text();
        rawRows = parseSimpleCsv(text);
      } else if (typeof window.XLSX !== 'undefined') {
        const buffer = await file.arrayBuffer();
        const wb = window.XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rawRows = window.XLSX.utils.sheet_to_json(ws, { defval: '' });
      } else {
        const text = await file.text();
        if (text.trim().startsWith('<')) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, 'text/xml');
          const rows = Array.from(xmlDoc.getElementsByTagName('Row'));
          if (rows.length > 1) {
            const headers = Array.from(rows[0].getElementsByTagName('Data')).map((d) => d.textContent || '');
            rawRows = rows.slice(1).map((r) => {
              const vals = Array.from(r.getElementsByTagName('Data')).map((d) => d.textContent || '');
              const obj = {};
              headers.forEach((h, idx) => {
                obj[h] = vals[idx] ?? '';
              });
              return obj;
            });
          }
        } else {
          rawRows = parseSimpleCsv(text);
        }
      }

      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        pushToast('File kosong.', 'warning');
        return;
      }

      const parsedItems = rawRows
        .map((row) => {
          const code = String(pickRowValue(row, ['Kode Part', 'Kode', 'Part Code', 'SKU', 'Code'])).trim();
          const name = String(pickRowValue(row, ['Nama Sparepart', 'Nama Part', 'Nama Barang', 'Part Name', 'Name'])).trim();
          const rawCat = String(pickRowValue(row, ['Kategori', 'Category'])).trim();
          const category = CATEGORIES.includes(rawCat) ? rawCat : 'General Maintenance';
          const machine = String(pickRowValue(row, ['Mesin', 'Line', 'Machine'])).trim();
          const location = String(pickRowValue(row, ['Lokasi Rak', 'Lokasi', 'Rak', 'Location'])).trim();
          const unit = String(pickRowValue(row, ['Satuan', 'Unit', 'UOM'])).trim() || 'pcs';
          const initialStock = Math.max(0, Math.round(parseExcelNumber(pickRowValue(row, ['Stok Awal', 'Initial Stock', 'Awal']), 0)));
          const rawCur = pickRowValue(row, ['Stok Saat Ini', 'Stok Fisik', 'Current Stock', 'Stok', 'Qty']);
          const currentStock =
            rawCur === '' ? initialStock : Math.max(0, Math.round(parseExcelNumber(rawCur, initialStock)));
          const minStock = Math.max(0, Math.round(parseExcelNumber(pickRowValue(row, ['Min Stok (ROP)', 'Min Stok', 'ROP']), 5)));
          const unitPrice = Math.max(0, Math.round(parseExcelNumber(pickRowValue(row, ['Harga Satuan', 'Harga', 'Unit Price']), 0)));

          return { code, name, category, machine, location, unit, initialStock, currentStock, minStock, unitPrice };
        })
        .filter((item) => item.code && item.name);

      if (parsedItems.length === 0) {
        pushToast('Tidak ada baris valid (pastikan Kode Part & Nama Sparepart terisi).', 'warning');
        return;
      }

      const ok = await requestConfirm('Konfirmasi Import', `Import ${parsedItems.length} baris dari "${file.name}"?`);
      if (!ok) return;

      let added = 0;
      let updated = 0;
      const next = [...spareparts];
      const touchedCloudItems = [];

      parsedItems.forEach((item) => {
        const idx = next.findIndex((s) => String(s.code || '').trim().toLowerCase() === item.code.toLowerCase());
        if (idx !== -1) {
          const mergedItem = { ...next[idx], ...item };
          next[idx] = mergedItem;
          touchedCloudItems.push(mergedItem);
          updated += 1;
        } else {
          const createdItem = { id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ...item };
          next.push(createdItem);
          touchedCloudItems.push(createdItem);
          added += 1;
        }
      });

      setSpareparts(next);
      safeWriteStorage(STORAGE_KEYS.SPAREPARTS, next);

      for (const spItem of touchedCloudItems) {
        await upsertSparepartCloud(spItem);
      }

      pushToast(`Import selesai: +${added} baru, ${updated} diperbarui.`, 'success');
    } catch (err) {
      console.error('Import error:', err);
      pushToast('Gagal membaca file import.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleExportMonthly = () => {
    const masterRows = spareparts.map((s) => ({
      'Kode Part': s.code || '',
      'Nama Sparepart': s.name || '',
      Kategori: s.category || '',
      Mesin: s.machine || '',
      Rak: s.location || '',
      Satuan: s.unit || 'pcs',
      'Stok Awal': Number(s.initialStock) || 0,
      'Stok Saat Ini': Number(s.currentStock) || 0,
      'Min Stok (ROP)': Number(s.minStock) || 0,
      'Harga Satuan': Number(s.unitPrice) || 0,
      'Nilai Aset': (Number(s.currentStock) || 0) * (Number(s.unitPrice) || 0)
    }));

    const monthTx = transactions.filter((t) => (t.date || '').startsWith(selectedMonth));
    const txRows = monthTx.map((t) => ({
      Tanggal: t.date || '',
      Jenis: t.type || '',
      'Kode Part': t.code || '',
      'Nama Sparepart': t.sparepartName || '',
      'Tipe Maintenance': t.maintenanceType || '',
      'No WO / Ref': t.woRef || '',
      Qty: Number(t.qty) || 0,
      Satuan: t.unit || 'pcs',
      'Nilai (Rp)': Number(t.totalValue) || 0,
      Keterangan: t.notes || '',
      Petugas: t.recordedBy || ''
    }));

    const opnameRows = monthTx
      .filter((t) => t.type === 'OPNAME')
      .map((t) => ({
        Tanggal: t.date || '',
        'Kode Part': t.code || '',
        'Nama Sparepart': t.sparepartName || '',
        'Stok Sistem': Number(t.systemStock) || 0,
        'Stok Fisik': Number(t.physicalStock) || 0,
        Selisih: Number(t.diff) || 0,
        Catatan: t.notes || ''
      }));

    if (typeof window.XLSX !== 'undefined') {
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(masterRows), 'Master_Stok');
      window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(txRows), `Mutasi_${selectedMonth}`);
      window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(opnameRows), `Opname_${selectedMonth}`);
      window.XLSX.writeFile(wb, `Laporan_Inventory_Maintenance_${selectedMonth}.xlsx`);
      pushToast(`Excel ${selectedMonth} diunduh.`, 'success');
    } else {
      downloadRowsAsExcel(
        masterRows.length > 0 ? masterRows : [{ 'Kode Part': '', 'Nama Sparepart': '' }],
        `Master_${selectedMonth}`,
        `Laporan_Inventory_Maintenance_${selectedMonth}.xls`
      );
      pushToast(`Laporan ${selectedMonth} diunduh.`, 'success');
    }
  };

  // ==========================================================================
  // TRANSAKSI IN / OUT & BATCH IMPORT
  // ==========================================================================
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    const targetId = txSparepartId || (spareparts[0] && spareparts[0].id);
    const qtyNum = Number(txQty) || 0;

    if (!targetId || qtyNum <= 0) {
      pushToast('Pilih sparepart & qty >= 1.', 'warning');
      return;
    }

    const sp = spareparts.find((s) => s.id === targetId);
    if (!sp) {
      pushToast('Sparepart tidak ditemukan.', 'error');
      return;
    }

    const currentStock = Number(sp.currentStock) || 0;
    const unitPrice = Number(sp.unitPrice) || 0;
    const nextStock = txType === 'IN' ? currentStock + qtyNum : currentStock - qtyNum;

    if (nextStock < 0) {
      pushToast(`Stok tidak cukup (tersedia: ${currentStock} ${sp.unit || 'pcs'}).`, 'error');
      return;
    }

    const newTxId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newTx = {
      id: newTxId,
      sparepartId: sp.id,
      code: sp.code || '',
      sparepartName: sp.name || '',
      category: sp.category || 'General Maintenance',
      unit: sp.unit || 'pcs',
      type: txType,
      qty: qtyNum,
      unitPrice,
      totalValue: qtyNum * unitPrice,
      date: txDate || defaultToday,
      maintenanceType: txMaintType,
      woRef: txWoRef.trim(),
      notes: txNotes.trim(),
      recordedBy: config.email || DEFAULT_ADMIN_EMAIL
    };

    try {
      const updatedSpareparts = spareparts.map((item) =>
        item.id === sp.id ? { ...item, currentStock: nextStock } : item
      );
      const updatedTransactions = [newTx, ...transactions];

      setSpareparts(updatedSpareparts);
      setTransactions(updatedTransactions);
      safeWriteStorage(STORAGE_KEYS.SPAREPARTS, updatedSpareparts);
      safeWriteStorage(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);

      if (cloudStatus === 'connected' && cloudDbRef.current) {
        const spRef = doc(cloudDbRef.current, 'artifacts', cloudAppIdRef.current, 'public', 'data', 'spareparts', sanitizeDocId(sp.id, 'sp'));
        const txRef = doc(cloudDbRef.current, 'artifacts', cloudAppIdRef.current, 'public', 'data', 'transactions', sanitizeDocId(newTxId, 'tx'));
        await runTransaction(cloudDbRef.current, async (transaction) => {
          const snap = await transaction.get(spRef);
          const liveStock = snap.exists() ? Number(snap.data().currentStock) || 0 : currentStock;
          const computedNext = txType === 'IN' ? liveStock + qtyNum : liveStock - qtyNum;
          if (computedNext < 0) throw new Error('Stok cloud tidak mencukupi.');
          transaction.set(
            spRef,
            { currentStock: computedNext, updatedAt: serverTimestamp() },
            { merge: true }
          );
          transaction.set(txRef, { ...newTx, id: sanitizeDocId(newTxId, 'tx'), createdAt: serverTimestamp() });
        });
      }

      setTxQty('');
      setTxWoRef('');
      setTxNotes('');
      pushToast(`Transaksi ${txType} (${qtyNum} ${sp.unit}) tercatat.`, 'success');
    } catch (err) {
      pushToast(err.message || 'Gagal mencatat transaksi.', 'error');
    }
  };

  const downloadBatchMutationTemplate = () => {
    const sampleMutations = [
      {
        Tanggal: defaultToday,
        Jenis: 'IN',
        'Kode Part': '',
        Qty: 0,
        'Jenis Maintenance': 'Supplier Delivery / PO',
        'No WO / PO': '',
        Keterangan: ''
      },
      {
        Tanggal: defaultToday,
        Jenis: 'OUT',
        'Kode Part': '',
        Qty: 0,
        'Jenis Maintenance': 'Preventive Maintenance (PM)',
        'No WO / PO': '',
        Keterangan: ''
      }
    ];

    downloadRowsAsExcel(sampleMutations, 'Template_Mutasi_IN_OUT', 'Template_Batch_Mutasi_IN_OUT.xlsx');
    pushToast('Template Excel Batch IN/OUT siap input diunduh.', 'success');
  };

  const handleImportBatchMutations = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      let rawRows = [];
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.csv')) {
        const text = await file.text();
        rawRows = parseSimpleCsv(text);
      } else if (typeof window.XLSX !== 'undefined') {
        const buffer = await file.arrayBuffer();
        const wb = window.XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rawRows = window.XLSX.utils.sheet_to_json(ws, { defval: '' });
      } else {
        const text = await file.text();
        if (text.trim().startsWith('<')) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, 'text/xml');
          const rows = Array.from(xmlDoc.getElementsByTagName('Row'));
          if (rows.length > 1) {
            const headers = Array.from(rows[0].getElementsByTagName('Data')).map((d) => d.textContent || '');
            rawRows = rows.slice(1).map((r) => {
              const vals = Array.from(r.getElementsByTagName('Data')).map((d) => d.textContent || '');
              const obj = {};
              headers.forEach((h, idx) => {
                obj[h] = vals[idx] ?? '';
              });
              return obj;
            });
          }
        } else {
          rawRows = parseSimpleCsv(text);
        }
      }

      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        pushToast('File mutasi kosong.', 'warning');
        return;
      }

      const candidateRows = rawRows
        .map((row) => {
          const rawType = String(pickRowValue(row, ['Jenis', 'Type', 'Mutasi', 'IN/OUT', 'In Out']))
            .trim()
            .toUpperCase();
          const type = rawType === 'IN' || rawType === 'MASUK' ? 'IN' : rawType === 'OUT' || rawType === 'KELUAR' ? 'OUT' : '';
          const code = String(pickRowValue(row, ['Kode Part', 'Kode', 'Part Code', 'SKU', 'Code'])).trim();
          const qty = Math.round(parseExcelNumber(pickRowValue(row, ['Qty', 'Jumlah', 'Quantity']), 0));
          const rawDate = String(pickRowValue(row, ['Tanggal', 'Date', 'Tgl'])).trim();
          const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : defaultToday;
          const rawMaint = String(pickRowValue(row, ['Jenis Maintenance', 'Maintenance', 'Tipe Maintenance', 'Sumber'])).trim();
          const maintenanceType = MAINTENANCE_TYPES.includes(rawMaint)
            ? rawMaint
            : rawMaint || (type === 'IN' ? 'Supplier Delivery / PO' : 'Preventive Maintenance (PM)');
          const woRef = String(pickRowValue(row, ['No WO / PO', 'No WO', 'WO', 'PO', 'Referensi', 'Ref'])).trim();
          const notes = String(pickRowValue(row, ['Keterangan', 'Catatan', 'Notes', 'Mesin'])).trim();

          return { type, code, qty, date, maintenanceType, woRef, notes };
        })
        .filter((r) => (r.type === 'IN' || r.type === 'OUT') && r.code && r.qty > 0);

      if (candidateRows.length === 0) {
        pushToast('Tidak ada baris mutasi valid.', 'warning');
        return;
      }

      const ok = await requestConfirm('Konfirmasi Batch IN/OUT', `Proses ${candidateRows.length} baris mutasi dari "${file.name}"?`);
      if (!ok) return;

      const workingStockById = {};
      spareparts.forEach((s) => {
        workingStockById[s.id] = Number(s.currentStock) || 0;
      });

      const appliedTransactions = [];
      let skipped = 0;

      candidateRows.forEach((row, idx) => {
        const sp = spareparts.find((s) => String(s.code || '').trim().toLowerCase() === row.code.toLowerCase());
        if (!sp) {
          skipped += 1;
          return;
        }
        const prevStock = workingStockById[sp.id] ?? (Number(sp.currentStock) || 0);
        const nextStock = row.type === 'IN' ? prevStock + row.qty : prevStock - row.qty;
        if (nextStock < 0) {
          skipped += 1;
          return;
        }

        workingStockById[sp.id] = nextStock;
        const unitPrice = Number(sp.unitPrice) || 0;
        appliedTransactions.push({
          id: `tx_batch_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          sparepartId: sp.id,
          code: sp.code || '',
          sparepartName: sp.name || '',
          category: sp.category || 'General Maintenance',
          unit: sp.unit || 'pcs',
          type: row.type,
          qty: row.qty,
          unitPrice,
          totalValue: row.qty * unitPrice,
          date: row.date,
          maintenanceType: row.maintenanceType,
          woRef: row.woRef,
          notes: row.notes || 'Import Batch Excel',
          recordedBy: config.email || DEFAULT_ADMIN_EMAIL
        });
      });

      if (appliedTransactions.length === 0) {
        pushToast('Tidak ada baris yang dapat diproses (cek Kode Part atau stok OUT).', 'error');
        return;
      }

      const updatedSpareparts = spareparts.map((s) =>
        s.id in workingStockById ? { ...s, currentStock: workingStockById[s.id] } : s
      );
      const reversedBatch = [...appliedTransactions].reverse();
      const updatedTransactions = [...reversedBatch, ...transactions];

      setSpareparts(updatedSpareparts);
      setTransactions(updatedTransactions);
      safeWriteStorage(STORAGE_KEYS.SPAREPARTS, updatedSpareparts);
      safeWriteStorage(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);

      for (const spId of Object.keys(workingStockById)) {
        const matchedSp = updatedSpareparts.find((s) => s.id === spId);
        if (matchedSp) {
          await upsertSparepartCloud(matchedSp);
        }
      }
      for (const txItem of reversedBatch) {
        await upsertTransactionCloud(txItem);
      }

      pushToast(
        skipped > 0
          ? `${appliedTransactions.length} mutasi diproses, ${skipped} baris dilewati.`
          : `${appliedTransactions.length} mutasi IN/OUT berhasil diproses.`,
        skipped > 0 ? 'warning' : 'success'
      );
    } catch (err) {
      console.error('Batch mutation import error:', err);
      pushToast('Gagal memproses file batch mutasi.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleResetTransactionsOnly = async () => {
    const ok = await requestConfirm(t.resetTx, 'Hapus seluruh riwayat transaksi IN, OUT, dan Opname?');
    if (!ok) return;
    const prevTx = [...transactions];
    setTransactions([]);
    safeWriteStorage(STORAGE_KEYS.TRANSACTIONS, []);
    await clearCloudCollection('transactions', prevTx);
    pushToast('Semua riwayat transaksi direset.', 'success');
  };

  const handleResetAllFromZero = async () => {
    const ok = await requestConfirm(
      t.resetAll,
      'Hapus semua master sparepart, stok awal, dan transaksi untuk memulai dari nol?'
    );
    if (!ok) return;
    const prevSp = [...spareparts];
    const prevTx = [...transactions];
    setSpareparts([]);
    setTransactions([]);
    setOpnameInputs({});
    setTxSparepartId('');
    safeWriteStorage(STORAGE_KEYS.SPAREPARTS, []);
    safeWriteStorage(STORAGE_KEYS.TRANSACTIONS, []);
    await clearCloudCollection('spareparts', prevSp);
    await clearCloudCollection('transactions', prevTx);
    pushToast('Semua data direset ke nol.', 'success');
  };

  // ==========================================================================
  // STOK OPNAME BULANAN
  // ==========================================================================
  const handleOpnameChange = (id, field, value) => {
    setOpnameInputs((prev) => ({
      ...prev,
      [id]: {
        physical: field === 'physical' ? Math.max(0, Number(value) || 0) : (prev[id]?.physical ?? 0),
        note: field === 'note' ? value : (prev[id]?.note ?? '')
      }
    }));
  };

  const handleSaveOpname = async () => {
    const adjustments = [];
    for (const item of spareparts) {
      const sysVal = Number(item.currentStock) || 0;
      const entry = opnameInputs[item.id] || { physical: sysVal, note: '' };
      const physVal = Number(entry.physical);
      if (Number.isNaN(physVal) || physVal < 0) {
        pushToast('Stok fisik tidak boleh negatif.', 'warning');
        return;
      }
      const diff = physVal - sysVal;
      if (diff !== 0) {
        adjustments.push({ item, sysVal, physVal, diff, note: (entry.note || '').trim() });
      }
    }

    if (adjustments.length === 0) {
      pushToast('Tidak ada selisih fisik.', 'info');
      return;
    }

    const ok = await requestConfirm(
      'Konfirmasi Stok Opname',
      `Periode ${selectedMonth}: ${adjustments.length} item berselisih. Lanjutkan?`
    );
    if (!ok) return;

    const opnameLogs = [];
    const updatedMap = {};

    adjustments.forEach(({ item, sysVal, physVal, diff, note }) => {
      updatedMap[item.id] = physVal;
      const price = Number(item.unitPrice) || 0;
      opnameLogs.push({
        id: `opn_${Date.now()}_${item.id}`,
        sparepartId: item.id,
        code: item.code || '',
        sparepartName: item.name || '',
        category: item.category || 'General Maintenance',
        unit: item.unit || 'pcs',
        type: 'OPNAME',
        qty: Math.abs(diff),
        diff,
        systemStock: sysVal,
        physicalStock: physVal,
        unitPrice: price,
        totalValue: Math.abs(diff) * price,
        date: `${selectedMonth}-28`,
        maintenanceType: `Stok Opname (${selectedMonth})`,
        woRef: `OPN-${selectedMonth}`,
        notes: note || `Selisih fisik ${diff > 0 ? '+' + diff : diff}`,
        recordedBy: config.email || DEFAULT_ADMIN_EMAIL
      });
    });

    const updatedSpareparts = spareparts.map((s) =>
      s.id in updatedMap ? { ...s, currentStock: updatedMap[s.id] } : s
    );
    const updatedTransactions = [...opnameLogs, ...transactions];

    setSpareparts(updatedSpareparts);
    setTransactions(updatedTransactions);
    safeWriteStorage(STORAGE_KEYS.SPAREPARTS, updatedSpareparts);
    safeWriteStorage(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);

    for (const spId of Object.keys(updatedMap)) {
      const matchedSp = updatedSpareparts.find((s) => s.id === spId);
      if (matchedSp) {
        await upsertSparepartCloud(matchedSp);
      }
    }
    for (const logItem of opnameLogs) {
      await upsertTransactionCloud(logItem);
    }

    pushToast(`Opname ${selectedMonth} tersimpan (${adjustments.length} item).`, 'success');
  };

  // ==========================================================================
  // PENGATURAN, TEMA, BAHASA & PASSWORD
  // ==========================================================================
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const nextCfg = {
      ...config,
      companyName: settingsForm.companyName.trim() || 'PGCM Maintenance',
      subtitle: settingsForm.subtitle.trim() || 'Sparepart Inventory Control',
      accentColor: settingsForm.accentColor,
      sidebarStyle: settingsForm.sidebarStyle,
      darkMode: Boolean(settingsForm.darkMode),
      language: settingsForm.language || 'id',
      whatsapp: settingsForm.whatsapp.trim() || '082270189045',
      email: settingsForm.email.trim() || DEFAULT_ADMIN_EMAIL,
      adminEmail: settingsForm.email.trim() || DEFAULT_ADMIN_EMAIL
    };
    setConfig(nextCfg);
    safeWriteStorage(STORAGE_KEYS.CONFIG, nextCfg);
    await upsertConfigCloud(nextCfg);
    pushToast('Pengaturan sistem & tema disimpan.', 'success');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const currentValid = config.adminPassword || DEFAULT_ADMIN_PASSWORD;
    if (oldPassInput !== currentValid) {
      pushToast('Password saat ini tidak sesuai.', 'error');
      return;
    }
    if (newPassInput.length < 6) {
      pushToast('Password baru minimal 6 karakter.', 'warning');
      return;
    }
    if (newPassInput !== confirmPassInput) {
      pushToast('Konfirmasi password baru tidak cocok.', 'error');
      return;
    }

    const nextCfg = { ...config, adminPassword: newPassInput };
    setConfig(nextCfg);
    safeWriteStorage(STORAGE_KEYS.CONFIG, nextCfg);
    setOldPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    pushToast('Password diperbarui.', 'success');
  };

  const handleSaveFirebaseConfig = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEYS.FB_CONFIG, fbJsonText.trim());
    } catch {}
    connectFirebaseFromJson(fbJsonText, false);
  };

  // ==========================================================================
  // LAPORAN WHATSAPP & EMAIL
  // ==========================================================================
  const handleSendWhatsApp = () => {
    const rawPhone = (config.whatsapp || '082270189045').replace(/\D/g, '');
    const intlPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
    const lowList = dashboardStats.lowStockItems;

    const text = [
      `*LAPORAN INVENTORY MAINTENANCE (${selectedMonth})*`,
      `Perusahaan: ${config.companyName}`,
      `Total Item: ${dashboardStats.totalItems} part`,
      `Mutasi IN: ${dashboardStats.monthInQty} unit`,
      `Pemakaian OUT: ${dashboardStats.monthOutQty} unit (${formatRp(dashboardStats.monthOutValue)})`,
      `Stok Kritis/ROP: ${lowList.length} item` +
        (lowList.length ? `\n- ${lowList.map((x) => `${x.code} (${x.currentStock})`).join(', ')}` : '')
    ].join('\n');

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSendEmail = () => {
    const targetEmail = config.email || DEFAULT_ADMIN_EMAIL;
    const subject = `Laporan Inventory Sparepart Maintenance - ${selectedMonth}`;
    const body = [
      `Rekapitulasi Inventory Maintenance Periode: ${selectedMonth}`,
      `Perusahaan: ${config.companyName}`,
      `Total Item Master: ${dashboardStats.totalItems}`,
      `Mutasi IN: ${dashboardStats.monthInQty} unit`,
      `Pemakaian OUT: ${dashboardStats.monthOutQty} unit`,
      `Total Pengeluaran OUT: ${formatRp(dashboardStats.monthOutValue)}`
    ].join('\n');

    window.location.href = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // ==========================================================================
  // DESIGN TOKENS (DARK / LIGHT & ACCENT)
  // ==========================================================================
  const accentClasses = useMemo(() => {
    const map = {
      blue: {
        activeNav: 'bg-blue-600 text-white shadow-sm',
        primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
        badge: 'bg-blue-600 text-white',
        ring: 'focus:ring-blue-500'
      },
      emerald: {
        activeNav: 'bg-emerald-600 text-white shadow-sm',
        primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        badge: 'bg-emerald-600 text-white',
        ring: 'focus:ring-emerald-500'
      },
      indigo: {
        activeNav: 'bg-indigo-600 text-white shadow-sm',
        primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        badge: 'bg-indigo-600 text-white',
        ring: 'focus:ring-indigo-500'
      },
      amber: {
        activeNav: 'bg-amber-600 text-white shadow-sm',
        primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
        badge: 'bg-amber-600 text-white',
        ring: 'focus:ring-amber-500'
      }
    };
    return map[config.accentColor] || map.blue;
  }, [config.accentColor]);

  const surfaceCard = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/80 text-slate-800';

  const inputSurface = isDark
    ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500'
    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400';

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'spareparts', label: t.navSpareparts, icon: PackagePlus },
    { id: 'transactions', label: t.navTransactions, icon: ArrowLeftRight },
    { id: 'opname', label: t.navOpname, icon: ClipboardCheck },
    { id: 'history', label: t.navHistory, icon: History },
    { id: 'settings', label: t.navSettings, icon: Settings }
  ];

  const pageMetaMap = {
    dashboard: {
      title: t.navDashboard,
      subtitle: 'Realtime stock telemetry, IN/OUT flow & ROP monitoring'
    },
    spareparts: {
      title: t.navSpareparts,
      subtitle: 'Initial stock, master parts, ROP & Excel batch import'
    },
    transactions: {
      title: t.navTransactions,
      subtitle: 'Daily IN/OUT stock mutations & Excel batch upload'
    },
    opname: {
      title: t.navOpname,
      subtitle: 'Monthly physical stock audit & variance adjustment'
    },
    history: {
      title: t.navHistory,
      subtitle: 'Complete mutation audit trail'
    },
    settings: {
      title: t.navSettings,
      subtitle: 'Language, dark/light theme, password, reset & Firebase sync'
    }
  };
  const pageMeta = pageMetaMap[activeTab] || pageMetaMap.dashboard;

  // ==========================================================================
  // RENDER TOAST & CONFIRM MODAL
  // ==========================================================================
  const renderOverlays = () => (
    <>
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-3 sm:px-0">
        {toasts.map((item) => {
          const styleMap = {
            success: 'bg-emerald-600 text-white',
            error: 'bg-red-600 text-white',
            warning: 'bg-amber-500 text-white',
            info: 'bg-slate-800 text-white'
          };
          const IconComp =
            item.type === 'success'
              ? CheckCircle
              : item.type === 'error'
              ? XCircle
              : item.type === 'warning'
              ? AlertTriangle
              : Info;
          return (
            <div
              key={item.id}
              className={`${styleMap[item.type] || styleMap.info} px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium pointer-events-auto`}
            >
              <IconComp className="w-5 h-5 shrink-0" />
              <span>{item.message}</span>
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-[95] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl border max-w-md w-full p-6 ${surfaceCard}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold">{confirmState.title}</h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{confirmState.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => resolveConfirm(false)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                  isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => resolveConfirm(true)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition ${accentClasses.primaryBtn}`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ==========================================================================
  // HALAMAN LOGIN
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4">
        {renderOverlays()}
        <div className="w-full max-w-md bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
          <div className="bg-slate-950/80 px-7 py-6 border-b border-slate-800 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-cyan-500/15 blur-xl"></div>
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">{t.opBadge}</span>
                  <h1 className="text-xl font-extrabold tracking-tight">{t.appName}</h1>
                </div>
              </div>

              <select
                value={lang}
                onChange={(e) => setConfig((p) => ({ ...p, language: e.target.value }))}
                aria-label="Language"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none"
              >
                <option value="id">ID</option>
                <option value="en">EN</option>
                <option value="ko">KO</option>
              </select>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed relative z-10">{t.loginDesc}</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-7 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.emailLabel}
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="yuda@pgcm.co.kr"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.passLabel}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="••••••••••"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowLoginPass((v) => !v)}
                  className="text-slate-400 hover:text-white absolute right-3 top-2.5 p-0.5 rounded-lg transition"
                >
                  {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">WA:</span>
                <span className="font-mono text-emerald-400">{config.whatsapp || '082270189045'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="font-mono text-slate-300">{config.email || DEFAULT_ADMIN_EMAIL}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition"
            >
              <span>{t.loginBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // WORKSPACE UTAMA
  // ==========================================================================
  const sidebarBgClass = config.sidebarStyle === 'navy' ? 'bg-blue-950' : 'bg-slate-950';

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {renderOverlays()}

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 ${sidebarBgClass} text-slate-200 border-r border-slate-800/90 flex flex-col justify-between transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 shrink-0`}
      >
        <div>
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl ${accentClasses.badge} flex items-center justify-center shrink-0 shadow-md`}
              >
                <Wrench className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-white truncate">{config.companyName}</h2>
                <p className="text-[11px] text-slate-400 truncate">{config.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-left ${
                    isSelected
                      ? accentClasses.activeNav
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar: Cloud & Theme Quick Controls */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div
            className={`flex items-center justify-between gap-2 text-[11px] px-3 py-2 rounded-xl border ${
              cloudStatus === 'connected'
                ? 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60'
                : 'text-cyan-300 bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {cloudStatus === 'connected' ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              )}
              <span className="truncate">
                {cloudStatus === 'connected' ? 'Firebase Realtime ON' : 'Local + Cloud Ready'}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setConfig((p) => ({
                  ...p,
                  language: p.language === 'id' ? 'en' : p.language === 'en' ? 'ko' : 'id'
                }))
              }
              className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono uppercase text-slate-200 hover:bg-slate-700 shrink-0"
              title="Switch Language (ID/EN/KO)"
            >
              {lang}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{config.email || DEFAULT_ADMIN_EMAIL}</p>
              <p className="text-[10px] text-slate-400 truncate">WA: {config.whatsapp || '082270189045'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, darkMode: !p.darkMode }))}
                title={isDark ? 'Light Mode' : 'Dark Mode'}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header
          className={`border-b px-4 sm:px-6 py-2.5 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2.5 ${
            isDark ? 'bg-slate-900/95 border-slate-800 backdrop-blur-md' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden p-1.5 rounded-lg border ${
                isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-[15px] font-bold tracking-tight">{pageMeta.title}</h1>
              </div>
              <p className={`text-[11px] hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {pageMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || defaultMonth)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] sm:text-xs font-medium focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
            />

            <button
              type="button"
              onClick={handleExportMonthly}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t.exportExcel}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.waReport}</span>
            </button>

            <button
              type="button"
              onClick={handleSendEmail}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.emailReport}</span>
            </button>
          </div>
        </header>

        {/* Futuristic Quick Scan / Command Strip */}
        <div className="px-4 sm:px-6 pt-3 max-w-[1600px] w-full mx-auto">
          <form
            onSubmit={handleQuickScanSubmit}
            className={`rounded-xl border px-3 py-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${surfaceCard}`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-500 px-1 shrink-0">
              <ScanBarcode className="w-3.5 h-3.5" />
              <span className="font-mono uppercase">Quick Scan</span>
            </div>

            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              placeholder={t.quickScanPlaceholder}
              className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
            />

            <div className="flex items-center gap-1.5">
              <select
                value={quickMode}
                onChange={(e) => setQuickMode(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold focus:outline-none ${inputSurface}`}
              >
                <option value="OUT">OUT (-)</option>
                <option value="IN">IN (+)</option>
              </select>

              <input
                type="number"
                min="1"
                step="1"
                value={quickQty}
                onChange={(e) => setQuickQty(e.target.value)}
                className={`w-16 px-2 py-1.5 rounded-lg border text-xs font-bold text-center tabular-nums focus:outline-none ${inputSurface}`}
              />

              <button
                type="submit"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition shrink-0 ${accentClasses.primaryBtn}`}
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:px-6 sm:py-4 space-y-4 max-w-[1600px] w-full mx-auto">
          {/* ================================================================ */}
          {/* TAB 1: DASHBOARD                                                 */}
          {/* ================================================================ */}
          {activeTab === 'dashboard' && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className={`rounded-2xl p-5 border shadow-xs ${surfaceCard}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t.kpiTotalItems}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                      <Boxes className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold mt-3">
                    {dashboardStats.totalItems.toLocaleString('id-ID')}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Qty: {dashboardStats.totalQty.toLocaleString('id-ID')} • {formatRp(dashboardStats.totalAssetValue)}
                  </p>
                </div>

                <div className={`rounded-2xl p-5 border shadow-xs ${surfaceCard}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t.kpiMonthIn}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-500 mt-3">
                    {dashboardStats.monthInQty.toLocaleString('id-ID')}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatRp(dashboardStats.monthInValue)}
                  </p>
                </div>

                <div className={`rounded-2xl p-5 border shadow-xs ${surfaceCard}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t.kpiMonthOut}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-amber-500 mt-3">
                    {dashboardStats.monthOutQty.toLocaleString('id-ID')}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatRp(dashboardStats.monthOutValue)}
                  </p>
                </div>

                <div className={`rounded-2xl p-5 border shadow-xs ${surfaceCard}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t.kpiLowStock}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-red-500 mt-3">
                    {dashboardStats.lowStockItems.length.toLocaleString('id-ID')}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ROP Alert</p>
                </div>
              </div>

              {dashboardStats.lowStockItems.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <BellRing className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-red-500">{t.kpiLowStock}</h3>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-red-200' : 'text-red-700'}`}>
                        {dashboardStats.lowStockItems
                          .map((i) => `${i.code} - ${i.name} (${i.currentStock}/${i.minStock} ${i.unit})`)
                          .join(' | ')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shrink-0 transition"
                  >
                    {t.waReport}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className={`xl:col-span-2 rounded-2xl p-5 border shadow-xs ${surfaceCard}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold">{t.navDashboard}</h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>6M Trend</p>
                    </div>
                    <Activity className="w-4 h-4 text-cyan-500" />
                  </div>
                  <InOutTrendChart transactions={transactions} isDark={isDark} />
                </div>

                <div className={`rounded-2xl p-5 border shadow-xs ${surfaceCard}`}>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold">{t.kpiMonthOut}</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedMonth}</p>
                  </div>
                  <ExpenseCategoryChart
                    monthOutTx={dashboardStats.monthOutTx}
                    spareparts={spareparts}
                    isDark={isDark}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* TAB 2: STOK AWAL & MASTER PART                                  */}
          {/* ================================================================ */}
          {activeTab === 'spareparts' && (
            <section className="space-y-3">
              <div className={`rounded-xl p-3.5 border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${surfaceCard}`}>
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Kode / Nama / Mesin / Rak..."
                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                  >
                    <option value="ALL">ALL</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={stockStatusFilter}
                    onChange={(e) => setStockStatusFilter(e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                  >
                    <option value="ALL">ALL</option>
                    <option value="LOW">LOW / ROP</option>
                    <option value="NORMAL">OK</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={openAddSparepartModal}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition ${accentClasses.primaryBtn}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Part</span>
                </button>
              </div>

              {/* Import Massal Master / Stok Awal */}
              <div
                className={`rounded-xl px-4 py-2.5 border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                  isDark ? 'bg-blue-950/30 border-blue-800/50' : 'bg-blue-50/70 border-blue-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <FileUp className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-xs font-bold">Excel / CSV Master &amp; Stok Awal</h3>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      .xlsx / .xls / .csv • Auto-update by Kode Part
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={downloadImportTemplate}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition ${inputSurface}`}
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" />
                    <span>Template</span>
                  </button>

                  <label className="cursor-pointer px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-xs transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Tabel Master Sparepart & Batch IN/OUT (Gaya Grid ERP ECOUNT) */}
              <div className={`rounded-xl p-4 border shadow-xs space-y-3 ${surfaceCard}`}>
                <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div>
                    <h3 className="text-sm font-bold">{t.navSpareparts}</h3>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Batch IN/OUT Excel &amp; Master Table • {filteredSpareparts.length} item
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadBatchMutationTemplate}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition ${inputSurface}`}
                    >
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      <span>Template IN/OUT</span>
                    </button>

                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import Batch IN/OUT</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportBatchMutations}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`border-y text-[10px] font-bold uppercase tracking-wider ${
                          isDark
                            ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                            : 'bg-slate-100/90 border-slate-200 text-slate-600'
                        }`}
                      >
                        <th className="py-2 px-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Kode Part</th>
                        <th className="py-2 px-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Nama Sparepart</th>
                        <th className="py-2 px-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Category</th>
                        <th className="py-2 px-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Machine</th>
                        <th className="py-2 px-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Rack</th>
                        <th className="py-2 px-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Init</th>
                        <th className="py-2 px-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Stock</th>
                        <th className="py-2 px-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">ROP</th>
                        <th className="py-2 px-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Price</th>
                        <th className="py-2 px-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Value</th>
                        <th className="py-2 px-2 text-center">Act</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-[11px] tabular-nums ${isDark ? 'divide-slate-800/80' : 'divide-slate-200/70'}`}>
                      {filteredSpareparts.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-6 px-4 text-center text-slate-400 text-xs">
                            0 items
                          </td>
                        </tr>
                      ) : (
                        filteredSpareparts.map((item) => {
                          const cur = Number(item.currentStock) || 0;
                          const min = Number(item.minStock) || 0;
                          const price = Number(item.unitPrice) || 0;
                          const isCritical = cur <= min;
                          return (
                            <tr
                              key={item.id}
                              className={`leading-tight ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-blue-50/40'}`}
                            >
                              <td className="py-1.5 px-2.5 font-semibold font-mono text-[11px] border-r border-slate-200/50 dark:border-slate-800/60 whitespace-nowrap">
                                {item.code}
                              </td>
                              <td className="py-1.5 px-2.5 text-[11px] font-medium border-r border-slate-200/50 dark:border-slate-800/60">
                                {item.name}
                              </td>
                              <td className="py-1.5 px-2.5 text-[11px] border-r border-slate-200/50 dark:border-slate-800/60 whitespace-nowrap">
                                {item.category}
                              </td>
                              <td className="py-1.5 px-2.5 text-[11px] text-slate-400 border-r border-slate-200/50 dark:border-slate-800/60 whitespace-nowrap">
                                {item.machine || '-'}
                              </td>
                              <td className="py-1.5 px-2.5 text-[11px] font-mono text-slate-400 border-r border-slate-200/50 dark:border-slate-800/60 whitespace-nowrap">
                                {item.location || '-'}
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-[11px] text-slate-400 border-r border-slate-200/50 dark:border-slate-800/60 whitespace-nowrap">
                                {(Number(item.initialStock) || 0).toLocaleString('id-ID')} {item.unit || 'pcs'}
                              </td>
                              <td className="py-1.5 px-2.5 text-right border-r border-slate-200/50 dark:border-slate-800/60 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                    isCritical ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                                  }`}
                                >
                                  {cur.toLocaleString('id-ID')} {item.unit || 'pcs'}
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-[11px] text-slate-400 border-r border-slate-200/50 dark:border-slate-800/60 whitespace-nowrap">
                                {min.toLocaleString('id-ID')}
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-[11px] border-r border-slate-200/50 dark:border-slate-800/60 whitespace-nowrap">
                                {formatRp(price)}
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-[11px] font-semibold border-r border-slate-200/50 dark:border-slate-800/60 whitespace-nowrap">
                                {formatRp(cur * price)}
                              </td>
                              <td className="py-1.5 px-2 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditSparepartModal(item)}
                                    className="p-1 rounded text-blue-500 hover:bg-blue-500/10 transition"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSparepart(item)}
                                    className="p-1 rounded text-red-500 hover:bg-red-500/10 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* TAB 3: TRANSAKSI IN / OUT                                        */}
          {/* ================================================================ */}
          {activeTab === 'transactions' && (
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <form onSubmit={handleTransactionSubmit} className={`rounded-2xl p-6 border shadow-xs space-y-4 h-fit ${surfaceCard}`}>
                <div>
                  <h3 className="text-base font-bold">{t.navTransactions}</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>IN / OUT</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxType('IN')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                        txType === 'IN'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                          : `${inputSurface} opacity-75`
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>IN (+)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('OUT')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                        txType === 'OUT'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                          : `${inputSurface} opacity-75`
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>OUT (-)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="tx-sparepart" className="block text-xs font-semibold mb-1">
                    Part
                  </label>
                  <select
                    id="tx-sparepart"
                    required
                    value={txSparepartId}
                    onChange={(e) => setTxSparepartId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                  >
                    {spareparts.length === 0 ? (
                      <option value="">-- 0 --</option>
                    ) : (
                      spareparts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.name} ({s.currentStock} {s.unit})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="tx-qty" className="block text-xs font-semibold mb-1">
                      Qty
                    </label>
                    <input
                      id="tx-qty"
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={txQty}
                      onChange={(e) => setTxQty(e.target.value)}
                      placeholder="0"
                      className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="tx-date" className="block text-xs font-semibold mb-1">
                      Date
                    </label>
                    <input
                      id="tx-date"
                      type="date"
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="tx-maint" className="block text-xs font-semibold mb-1">
                      Category / Source
                    </label>
                    <select
                      id="tx-maint"
                      value={txMaintType}
                      onChange={(e) => setTxMaintType(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                    >
                      {MAINTENANCE_TYPES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tx-wo" className="block text-xs font-semibold mb-1">
                      WO / PO
                    </label>
                    <input
                      id="tx-wo"
                      type="text"
                      value={txWoRef}
                      onChange={(e) => setTxWoRef(e.target.value)}
                      placeholder="WO-2026-001"
                      className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tx-notes" className="block text-xs font-semibold mb-1">
                    Notes
                  </label>
                  <input
                    id="tx-notes"
                    type="text"
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    placeholder="Machine / Detail..."
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm transition ${accentClasses.primaryBtn}`}
                >
                  Save
                </button>
              </form>

              <div className={`xl:col-span-2 rounded-2xl p-5 border shadow-xs space-y-3 ${surfaceCard}`}>
                <div>
                  <h3 className="text-base font-bold">{selectedMonth}</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Latest 20</p>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Part</th>
                        <th className="py-3 px-3 text-right">Qty</th>
                        <th className="py-3 px-3 text-right">Value</th>
                        <th className="py-3 px-3">Ref / Notes</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-sm ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {dashboardStats.monthTx.slice(0, 20).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            0
                          </td>
                        </tr>
                      ) : (
                        dashboardStats.monthTx.slice(0, 20).map((item) => {
                          const isIn = item.type === 'IN';
                          return (
                            <tr key={item.id}>
                              <td className="py-2.5 px-3 font-mono text-xs text-slate-400">{item.date}</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                    isIn ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                                  }`}
                                >
                                  {item.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-medium">
                                {item.code} - {item.sparepartName}
                              </td>
                              <td
                                className={`py-2.5 px-3 text-right font-bold ${
                                  isIn ? 'text-emerald-400' : 'text-amber-400'
                                }`}
                              >
                                {isIn ? '+' : '-'}
                                {(Number(item.qty) || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-2.5 px-3 text-right text-xs">{formatRp(item.totalValue)}</td>
                              <td className="py-2.5 px-3 text-xs text-slate-400">
                                {[item.woRef, item.notes].filter(Boolean).join(' • ') || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* TAB 4: STOK OPNAME BULANAN                                       */}
          {/* ================================================================ */}
          {activeTab === 'opname' && (
            <section className="space-y-4">
              <div className={`rounded-2xl p-5 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${surfaceCard}`}>
                <div>
                  <h3 className="text-base font-bold">
                    {t.navOpname} ({selectedMonth})
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Physical vs System</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveOpname}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shrink-0 shadow-sm transition"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Save Opname</span>
                </button>
              </div>

              <div className={`rounded-2xl border shadow-xs overflow-hidden ${surfaceCard}`}>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <th className="py-3.5 px-4">Code</th>
                        <th className="py-3.5 px-4">Part</th>
                        <th className="py-3.5 px-4">Rack</th>
                        <th className="py-3.5 px-4 text-right">System</th>
                        <th className="py-3.5 px-4 text-center">Physical</th>
                        <th className="py-3.5 px-4 text-right">Diff</th>
                        <th className="py-3.5 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-sm ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {spareparts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            0
                          </td>
                        </tr>
                      ) : (
                        spareparts.map((item) => {
                          const sysVal = Number(item.currentStock) || 0;
                          const entry = opnameInputs[item.id] ?? { physical: sysVal, note: '' };
                          const physVal = Number(entry.physical) || 0;
                          const diff = physVal - sysVal;
                          return (
                            <tr key={item.id}>
                              <td className="py-3 px-4 font-mono text-xs font-bold">{item.code}</td>
                              <td className="py-3 px-4 text-sm font-medium">{item.name}</td>
                              <td className="py-3 px-4 text-xs text-slate-400">{item.location || '-'}</td>
                              <td className="py-3 px-4 text-right font-semibold">{sysVal}</td>
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={entry.physical}
                                  onChange={(e) => handleOpnameChange(item.id, 'physical', e.target.value)}
                                  className={`w-24 px-2.5 py-1.5 rounded-xl border text-center text-sm font-bold focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                                />
                              </td>
                              <td
                                className={`py-3 px-4 text-right font-bold ${
                                  diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {diff > 0 ? `+${diff}` : diff}
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={entry.note}
                                  onChange={(e) => handleOpnameChange(item.id, 'note', e.target.value)}
                                  placeholder="..."
                                  className={`w-full px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* TAB 5: RIWAYAT MUTASI                                            */}
          {/* ================================================================ */}
          {activeTab === 'history' && (
            <section className="space-y-4">
              <div className={`rounded-2xl p-5 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${surfaceCard}`}>
                <div>
                  <h3 className="text-base font-bold">
                    {t.navHistory} ({selectedMonth})
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>IN / OUT / OPNAME</p>
                </div>
                <select
                  value={historyTypeFilter}
                  onChange={(e) => setHistoryTypeFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                >
                  <option value="ALL">ALL</option>
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                  <option value="OPNAME">OPNAME</option>
                </select>
              </div>

              <div className={`rounded-2xl border shadow-xs overflow-hidden ${surfaceCard}`}>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Part</th>
                        <th className="py-3.5 px-4">Source / Ref</th>
                        <th className="py-3.5 px-4 text-right">Qty</th>
                        <th className="py-3.5 px-4 text-right">Value</th>
                        <th className="py-3.5 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-sm ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {dashboardStats.monthTx.filter((item) => historyTypeFilter === 'ALL' || item.type === historyTypeFilter)
                        .length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            0
                          </td>
                        </tr>
                      ) : (
                        dashboardStats.monthTx
                          .filter((item) => historyTypeFilter === 'ALL' || item.type === historyTypeFilter)
                          .map((item) => {
                            const badgeClass =
                              item.type === 'IN'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : item.type === 'OUT'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-blue-500/15 text-blue-400';

                            const qtyLabel =
                              item.type === 'IN'
                                ? `+${Number(item.qty) || 0}`
                                : item.type === 'OUT'
                                ? `-${Number(item.qty) || 0}`
                                : `${Number(item.diff) >= 0 ? '+' : ''}${Number(item.diff) || 0}`;

                            return (
                              <tr key={item.id}>
                                <td className="py-3 px-4 font-mono text-xs text-slate-400">{item.date}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${badgeClass}`}>
                                    {item.type}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-medium">
                                  {item.code} - {item.sparepartName}
                                </td>
                                <td className="py-3 px-4 text-xs text-slate-400">
                                  {item.maintenanceType || '-'} {item.woRef ? `(${item.woRef})` : ''}
                                </td>
                                <td className="py-3 px-4 text-right font-bold">
                                  {qtyLabel} {item.unit || 'pcs'}
                                </td>
                                <td className="py-3 px-4 text-right text-xs">{formatRp(item.totalValue)}</td>
                                <td className="py-3 px-4 text-xs text-slate-400">
                                  {item.notes || '-'} ({item.recordedBy || DEFAULT_ADMIN_EMAIL})
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* TAB 6: PENGATURAN, TEMA, MULTI-BAHASA & FIREBASE CLOUD           */}
          {/* ================================================================ */}
          {activeTab === 'settings' && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Identitas, Tema Gelap/Terang & Multi-Bahasa */}
              <form onSubmit={handleSaveSettings} className={`rounded-2xl p-6 border shadow-xs space-y-4 ${surfaceCard}`}>
                <div>
                  <h3 className="text-base font-bold">{t.navSettings}</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Theme, Language (ID/EN/KO) &amp; Contacts
                  </p>
                </div>

                <div>
                  <label htmlFor="cfg-company" className="block text-xs font-semibold mb-1.5">
                    Company / Dept
                  </label>
                  <input
                    id="cfg-company"
                    type="text"
                    required
                    value={settingsForm.companyName}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, companyName: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                  />
                </div>

                <div>
                  <label htmlFor="cfg-sub" className="block text-xs font-semibold mb-1.5">
                    Subtitle
                  </label>
                  <input
                    id="cfg-sub"
                    type="text"
                    required
                    value={settingsForm.subtitle}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, subtitle: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="cfg-lang" className="block text-xs font-semibold mb-1.5">
                      Language
                    </label>
                    <select
                      id="cfg-lang"
                      value={settingsForm.language}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, language: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                    >
                      <option value="id">Indonesia (ID)</option>
                      <option value="en">English (EN)</option>
                      <option value="ko">한국어 (KO)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="cfg-mode" className="block text-xs font-semibold mb-1.5">
                      Appearance
                    </label>
                    <select
                      id="cfg-mode"
                      value={settingsForm.darkMode ? 'dark' : 'light'}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, darkMode: e.target.value === 'dark' }))}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="cfg-accent" className="block text-xs font-semibold mb-1.5">
                      Accent
                    </label>
                    <select
                      id="cfg-accent"
                      value={settingsForm.accentColor}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, accentColor: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                    >
                      <option value="blue">Blue</option>
                      <option value="emerald">Emerald</option>
                      <option value="indigo">Indigo</option>
                      <option value="amber">Amber</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cfg-wa" className="block text-xs font-semibold mb-1.5">
                      WhatsApp
                    </label>
                    <input
                      id="cfg-wa"
                      type="text"
                      required
                      value={settingsForm.whatsapp}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, whatsapp: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none ${inputSurface}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="cfg-email" className="block text-xs font-semibold mb-1.5">
                      Email
                    </label>
                    <input
                      id="cfg-email"
                      type="email"
                      required
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, email: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none ${inputSurface}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition ${accentClasses.primaryBtn}`}
                >
                  Save Settings
                </button>
              </form>

              {/* Firebase Cloud Sync & Password */}
              <div className="space-y-6">
                <form onSubmit={handleSaveFirebaseConfig} className={`rounded-2xl p-6 border shadow-xs space-y-3.5 ${surfaceCard}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold">{t.cloudSyncTitle}</h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.cloudSyncDesc}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
                        cloudStatus === 'connected'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : cloudStatus === 'error'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}
                    >
                      {cloudStatus}
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={fbJsonText}
                    onChange={(e) => setFbJsonText(e.target.value)}
                    placeholder='{"apiKey":"...","authDomain":"...","projectId":"..."}'
                    className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 ${accentClasses.ring} ${inputSurface}`}
                  />

                  {cloudUserUid && (
                    <p className="text-[11px] font-mono text-emerald-400 truncate">UID: {cloudUserUid}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${accentClasses.primaryBtn}`}
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Connect Firestore</span>
                    </button>
                    <button
                      type="button"
                      onClick={syncSnapshotToCloud}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Push Sync Now</span>
                    </button>
                  </div>
                </form>

                <form onSubmit={handleChangePassword} className={`rounded-2xl p-6 border shadow-xs space-y-4 ${surfaceCard}`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-500" />
                    <h3 className="text-base font-bold">{t.passLabel}</h3>
                  </div>

                  <div>
                    <label htmlFor="old-pass" className="block text-xs font-semibold mb-1.5">
                      Current
                    </label>
                    <div className="relative">
                      <input
                        id="old-pass"
                        type={showPassFields.old ? 'text' : 'password'}
                        required
                        value={oldPassInput}
                        onChange={(e) => setOldPassInput(e.target.value)}
                        className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassFields((p) => ({ ...p, old: !p.old }))}
                        className="text-slate-400 hover:text-slate-200 absolute right-3 top-2.5"
                      >
                        {showPassFields.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="new-pass" className="block text-xs font-semibold mb-1.5">
                        New (min 6)
                      </label>
                      <input
                        id="new-pass"
                        type={showPassFields.new ? 'text' : 'password'}
                        minLength={6}
                        required
                        value={newPassInput}
                        onChange={(e) => setNewPassInput(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm-pass" className="block text-xs font-semibold mb-1.5">
                        Confirm
                      </label>
                      <input
                        id="confirm-pass"
                        type={showPassFields.confirm ? 'text' : 'password'}
                        minLength={6}
                        required
                        value={confirmPassInput}
                        onChange={(e) => setConfirmPassInput(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold shadow-sm transition"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              {/* Reset Data */}
              <div className="lg:col-span-2 bg-red-500/10 rounded-2xl p-6 border border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-red-500">Reset</h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-red-700'}`}>
                    {t.resetTx} / {t.resetAll}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetTransactionsOnly}
                    className={`px-4 py-2.5 rounded-xl border border-red-500/50 text-red-500 text-xs sm:text-sm font-semibold transition ${
                      isDark ? 'bg-slate-900 hover:bg-red-950/50' : 'bg-white hover:bg-red-50'
                    }`}
                  >
                    {t.resetTx}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAllFromZero}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
                  >
                    {t.resetAll}
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODAL INPUT / EDIT SPAREPART                                         */}
      {/* ==================================================================== */}
      {spModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className={`rounded-2xl shadow-2xl border max-w-lg w-full p-6 my-8 ${surfaceCard}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className="text-base font-bold">{editingSpId ? 'Edit' : '+ Part'}</h3>
              <button
                type="button"
                onClick={() => setSpModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSparepart} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sp-code" className="block text-xs font-semibold mb-1">
                    Code
                  </label>
                  <input
                    id="sp-code"
                    type="text"
                    required
                    value={spForm.code}
                    onChange={(e) => setSpForm((p) => ({ ...p, code: e.target.value }))}
                    placeholder="BRG-6205-2RS"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono focus:outline-none ${inputSurface}`}
                  />
                </div>
                <div>
                  <label htmlFor="sp-unit" className="block text-xs font-semibold mb-1">
                    Unit
                  </label>
                  <input
                    id="sp-unit"
                    type="text"
                    required
                    value={spForm.unit}
                    onChange={(e) => setSpForm((p) => ({ ...p, unit: e.target.value }))}
                    placeholder="pcs"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sp-name" className="block text-xs font-semibold mb-1">
                  Name
                </label>
                <input
                  id="sp-name"
                  type="text"
                  required
                  value={spForm.name}
                  onChange={(e) => setSpForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ball Bearing 6205 2RS"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sp-cat" className="block text-xs font-semibold mb-1">
                    Category
                  </label>
                  <select
                    id="sp-cat"
                    value={spForm.category}
                    onChange={(e) => setSpForm((p) => ({ ...p, category: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sp-machine" className="block text-xs font-semibold mb-1">
                    Machine
                  </label>
                  <input
                    id="sp-machine"
                    type="text"
                    value={spForm.machine}
                    onChange={(e) => setSpForm((p) => ({ ...p, machine: e.target.value }))}
                    placeholder="Line 1"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="sp-init" className="block text-xs font-semibold mb-1">
                    Init Stock
                  </label>
                  <input
                    id="sp-init"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={spForm.initialStock}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setSpForm((p) => ({
                        ...p,
                        initialStock: val,
                        currentStock: editingSpId ? p.currentStock : val
                      }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                  />
                </div>
                <div>
                  <label htmlFor="sp-cur" className="block text-xs font-semibold mb-1">
                    Current Stock
                  </label>
                  <input
                    id="sp-cur"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={spForm.currentStock}
                    onChange={(e) =>
                      setSpForm((p) => ({ ...p, currentStock: Math.max(0, Number(e.target.value) || 0) }))
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                  />
                </div>
                <div>
                  <label htmlFor="sp-min" className="block text-xs font-semibold mb-1">
                    ROP
                  </label>
                  <input
                    id="sp-min"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={spForm.minStock}
                    onChange={(e) =>
                      setSpForm((p) => ({ ...p, minStock: Math.max(0, Number(e.target.value) || 0) }))
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sp-price" className="block text-xs font-semibold mb-1">
                    Unit Price (Rp)
                  </label>
                  <input
                    id="sp-price"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={spForm.unitPrice}
                    onChange={(e) =>
                      setSpForm((p) => ({ ...p, unitPrice: Math.max(0, Number(e.target.value) || 0) }))
                    }
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                  />
                </div>
                <div>
                  <label htmlFor="sp-loc" className="block text-xs font-semibold mb-1">
                    Rack
                  </label>
                  <input
                    id="sp-loc"
                    type="text"
                    value={spForm.location}
                    onChange={(e) => setSpForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="A-01"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${inputSurface}`}
                  />
                </div>
              </div>

              <div className={`flex items-center justify-end gap-2 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setSpModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${inputSurface}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition ${accentClasses.primaryBtn}`}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
