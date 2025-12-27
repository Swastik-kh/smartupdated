
import React, { useState, useMemo } from 'react';
import { 
  LogOut, Menu, Calendar, Stethoscope, Package, FileText, Settings, LayoutDashboard, 
  ChevronDown, ChevronRight, Syringe, Activity, 
  ClipboardList, FileSpreadsheet, FilePlus, ShoppingCart, FileOutput, 
  BookOpen, Book, Archive, RotateCcw, Wrench, Scroll, BarChart3,
  Sliders, Store, ShieldCheck, Users, Database, KeyRound, UserCog, Lock, Warehouse, ClipboardCheck, Bell, X, CheckCircle2, ArrowRightCircle, AlertTriangle, Pill, Scissors, Clock, Calculator, Trash2, UsersRound, TrendingUp, Info, PieChart, CalendarCheck, User, Printer, SearchX, AlertOctagon, GraduationCap, Award, Search, Eye, Award as AwardIcon, Download, TrendingDown, Clipboard, Beaker, ArrowRightLeft, Droplets, FlaskConical
} from 'lucide-react';
import { APP_NAME, ORG_NAME, FISCAL_YEARS } from '../constants';
import { DashboardProps, PurchaseOrderEntry, InventoryItem, RabiesPatient, HafaEntry } from '../types'; 
import { UserManagement } from './UserManagement';
import { ChangePassword } from './ChangePassword';
import { TBPatientRegistration } from './TBPatientRegistration';
import { RabiesRegistration } from './RabiesRegistration';
import { RabiesReport } from './RabiesReport';
import { MagFaram } from './MagFaram';
import { HafaFaram } from './HafaFaram';
import { KharidAdesh } from './KharidAdesh';
import { NikashaPratibedan } from './NikashaPratibedan';
import { FirmListing } from './FirmListing'; 
import { Quotation } from './Quotation'; 
import { JinshiMaujdat } from './JinshiMaujdat'; 
import { StoreSetup } from './StoreSetup'; 
import { InventoryMonthlyReport } from './InventoryMonthlyReport'; 
import { StockEntryApproval } from './StockEntryApproval'; 
import { DakhilaPratibedan } from './DakhilaPratibedan'; 
import { SahayakJinshiKhata } from './SahayakJinshiKhata'; 
import { JinshiFirtaFaram } from './JinshiFirtaFaram'; 
import { MarmatAdesh } from './MarmatAdesh';
import { JinshiKhata } from './JinshiKhata'; 
import { DatabaseManagement } from './DatabaseManagement';
import { DhuliyaunaFaram } from './DhuliyaunaFaram';
import { LogBook } from './LogBook';
import { GeneralSetting } from './GeneralSetting';
import { VaccineCertificate } from './VaccineCertificate';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

export const Dashboard: React.FC<DashboardProps> = ({ 
  onLogout, 
  currentUser, 
  currentFiscalYear,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onChangePassword,
  generalSettings,
  onUpdateGeneralSettings,
  magForms,
  onSaveMagForm,
  hafaEntries,
  onSaveHafaEntry,
  onDeleteHafaEntry,
  purchaseOrders,
  onUpdatePurchaseOrder,
  issueReports,
  onUpdateIssueReport, 
  rabiesPatients,
  onAddRabiesPatient,
  onUpdateRabiesPatient,
  onDeletePatient,
  tbPatients,
  onAddTBPatient,
  onUpdateTBPatient,
  onDeleteTBPatient,
  firms,
  onAddFirm,
  quotations,
  onAddQuotation,
  inventoryItems,
  onAddInventoryItem,
  onUpdateInventoryItem,
  stockEntryRequests,
  onRequestStockEntry,
  onApproveStockEntry,
  onRejectStockEntry,
  stores,
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  dakhilaReports,
  onSaveDakhilaReport,
  returnEntries,
  onSaveReturnEntry,
  marmatEntries,
  onSaveMarmatEntry,
  dhuliyaunaEntries,
  onSaveDhuliyaunaEntry,
  logBookEntries,
  onSaveLogBookEntry,
  onClearData
}) => {
  const fiscalYearLabel = FISCAL_YEARS.find(fy => fy.value === currentFiscalYear)?.label || currentFiscalYear;

  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [pendingPoDakhila, setPendingPoDakhila] = useState<PurchaseOrderEntry | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false); 
  const [completedSearchTerm, setCompletedSearchTerm] = useState('');
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiryModalTab, setExpiryModalTab] = useState<'soon' | 'expired'>('soon');
  const [lastSeenNotificationId, setLastSeenNotificationId] = useState<string | null>(null);
  
  const [selectedCertificatePatient, setSelectedCertificatePatient] = useState<RabiesPatient | null>(null);

  const latestApprovedDakhila = useMemo(() => {
      const approved = stockEntryRequests.filter(req => req.status === 'Approved');
      if (approved.length > 0) {
          return approved.sort((a, b) => parseInt(b.id) - parseInt(a.id))[0];
      }
      return null;
  }, [stockEntryRequests]);

  const handleNotificationClick = () => {
      if (latestApprovedDakhila) {
          setShowNotificationModal(true);
          setLastSeenNotificationId(latestApprovedDakhila.id);
      }
  };

  const isApprover = ['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role);
  const isStorekeeper = currentUser.role === 'STOREKEEPER';

  const pendingMagCount = useMemo(() => {
    return magForms.filter(f => {
      const isTargetedToMe = f.targetOrg === currentUser.organizationName || (!f.isInstitutional && f.sourceOrg === currentUser.organizationName);
      if (!isTargetedToMe) return false;
      if (isStorekeeper) return f.status === 'Pending';
      if (isApprover) return f.status === 'Verified';
      return false;
    }).length;
  }, [magForms, isStorekeeper, isApprover, currentUser.organizationName]);

  const pendingHafaCount = useMemo(() => {
    const myOrg = currentUser.organizationName.trim().toLowerCase();
    const outgoingPending = hafaEntries.filter(e => e.sourceOrg?.trim().toLowerCase() === myOrg && e.status === 'Pending').length;
    const incomingPending = hafaEntries.filter(e => e.recipientOrg?.trim().toLowerCase() === myOrg && e.status === 'Approved' && !e.recipientApprovedBy?.name).length;
    return outgoingPending + incomingPending;
  }, [hafaEntries, currentUser.organizationName]);

  const pendingNikashaCount = useMemo(() => {
    if (isStorekeeper) return issueReports.filter(r => r.status === 'Pending').length;
    if (isApprover) return issueReports.filter(r => r.status === 'Pending Approval').length;
    return 0;
  }, [issueReports, isStorekeeper, isApprover]);

  const pendingDakhilaCount = useMemo(() => {
    if (!isApprover) return 0;
    return stockEntryRequests.filter(r => r.status === 'Pending').length;
  }, [stockEntryRequests, isApprover]);

  const pendingReturnCount = useMemo(() => {
    if (!isApprover) return 0;
    return returnEntries.filter(e => e.status === 'Pending').length;
  }, [returnEntries, isApprover]);

  const pendingMarmatCount = useMemo(() => {
    if (!isApprover) return 0;
    return marmatEntries.filter(e => e.status === 'Pending').length;
  }, [marmatEntries, isApprover]);

  const inventoryTotalNotifications = pendingMagCount + pendingHafaCount + pendingNikashaCount + pendingDakhilaCount + pendingReturnCount + pendingMarmatCount;

  const stats = useMemo(() => {
    const today = new NepaliDate();
    const todayStr = today.format('YYYY-MM-DD'); 
    const todayAd = new Date();
    const todayAdStr = todayAd.toISOString().split('T')[0];
    const threeMonthsLaterAd = new Date();
    threeMonthsLaterAd.setMonth(todayAd.getMonth() + 3);
    
    const todayRabiesReg = rabiesPatients.filter(p => p.regDateBs === todayStr).length;
    
    let scheduledToday = 0;
    let visitedToday = 0;
    let totalOverdueCount = 0;
    let pendingRabiesDosesCount = 0;
    const patientsForToday: Array<{patient: RabiesPatient, doseDay: number, status: string, scheduledDate: string, isOverdue: boolean}> = [];
    const completedPatients: RabiesPatient[] = [];

    rabiesPatients.forEach(patient => {
        const schedule = patient.schedule || [];
        const isCompleted = schedule.length > 0 && schedule.every(dose => dose.status === 'Given');
        if (isCompleted) { completedPatients.push(patient); }

        schedule.forEach(dose => {
            if (dose.status === 'Pending') pendingRabiesDosesCount++;

            const isScheduledToday = dose.date === todayAdStr;
            const isOverdue = dose.date < todayAdStr && dose.status === 'Pending';
            const isGivenToday = dose.status === 'Given' && (dose.givenDate === todayAdStr);
            if (isScheduledToday) { scheduledToday++; }
            if (isOverdue) { totalOverdueCount++; }
            if (isScheduledToday || isGivenToday || isOverdue) {
                if (isGivenToday) { visitedToday++; }
                patientsForToday.push({ patient, doseDay: dose.day, status: dose.status, scheduledDate: dose.date, isOverdue: isOverdue });
            }
        });
    });

    patientsForToday.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.scheduledDate.localeCompare(a.scheduledDate);
    });

    const myOrgInventory = inventoryItems.filter(item => currentUser.role === 'SUPER_ADMIN' || !item.orgName || item.orgName === currentUser.organizationName);
    
    // Rabies Vaccine Specific Calculations
    const rabiesVaccineItems = myOrgInventory.filter(item => 
        item.itemName.toLowerCase().includes('rabies') || 
        item.itemName.toLowerCase().includes('arv')
    );

    const stock05ml = rabiesVaccineItems
        .filter(item => item.itemName.includes('0.5') || (item.specification && item.specification.includes('0.5')))
        .reduce((sum, item) => sum + (item.currentQuantity || 0), 0);

    const stock1ml = rabiesVaccineItems
        .filter(item => item.itemName.includes('1') && !item.itemName.includes('0.5') || (item.specification && item.specification.includes('1') && !item.specification.includes('0.5')))
        .reduce((sum, item) => sum + (item.currentQuantity || 0), 0);

    // LOGIC: 1 Dose = 0.2 ml
    const totalMlAvailable = (stock05ml * 0.5) + (stock1ml * 1.0);
    const totalMlRequired = pendingRabiesDosesCount * 0.2; 
    const totalVials = stock05ml + stock1ml;

    const expiringSoonItems = myOrgInventory.filter(item => {
        if (!item.expiryDateAd || item.currentQuantity <= 0) return false;
        const expiryDate = new Date(item.expiryDateAd);
        return expiryDate > todayAd && expiryDate <= threeMonthsLaterAd;
    });
    const alreadyExpiredItems = myOrgInventory.filter(item => {
        if (!item.expiryDateAd || item.currentQuantity <= 0) return false;
        const expiryDate = new Date(item.expiryDateAd);
        return expiryDate <= todayAd;
    });
    
    return { 
        todayRabiesReg, 
        scheduledToday, 
        visitedToday, 
        totalOverdueCount, 
        patientsForToday, 
        completedPatients, 
        expiringSoonItems, 
        alreadyExpiredItems, 
        totalInventory: myOrgInventory.length, 
        pendingMagForms: magForms.filter(f => f.status === 'Pending').length, 
        pendingStockReq: stockEntryRequests.filter(r => r.status === 'Pending').length,
        pendingRabiesDosesCount,
        stock05ml,
        stock1ml,
        totalMlAvailable,
        totalMlRequired,
        totalVials
    };
  }, [rabiesPatients, inventoryItems, magForms, stockEntryRequests, currentUser]);

  const filteredCompletedPatients = useMemo(() => {
    if (!completedSearchTerm.trim()) return stats.completedPatients;
    const term = completedSearchTerm.toLowerCase();
    return stats.completedPatients.filter(p => p.name.toLowerCase().includes(term) || p.regNo.toLowerCase().includes(term) || p.address.toLowerCase().includes(term));
  }, [stats.completedPatients, completedSearchTerm]);

  const convertAdToBs = (adDate: string) => {
      if (!adDate) return '-';
      try {
          const parts = adDate.split('-');
          const jsDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return new NepaliDate(jsDate).format('YYYY/MM/DD');
      } catch (e) { return adDate; }
  };

  const menuItems = useMemo(() => {
    const isSuperOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    const allowedMenus = currentUser.allowedMenus || [];
    const allItems = [
        { id: 'dashboard', label: 'ड्यासबोर्ड (Dashboard)', icon: <LayoutDashboard size={20} /> },
        { id: 'services', label: 'सेवा (Services)', icon: <Stethoscope size={20} />, subItems: [{ id: 'tb_leprosy', label: 'क्षयरोग (TB)', icon: <Activity size={16} /> }, { id: 'rabies', label: 'रेबिज खोप (Rabies)', icon: <Syringe size={16} /> }] },
        { id: 'inventory', label: 'जिन्सी (Inventory)', icon: <Package size={20} />, count: inventoryTotalNotifications, subItems: [ 
            { id: 'stock_entry_approval', label: 'स्टक प्रविष्टि', icon: <ClipboardCheck size={16} />, count: pendingDakhilaCount }, 
            { id: 'jinshi_maujdat', label: 'जिन्सी मौज्दात', icon: <Warehouse size={16} /> }, 
            { id: 'mag_faram', label: 'माग फारम', icon: <FilePlus size={16} />, count: pendingMagCount }, 
            { id: 'kharid_adesh', label: 'खरिद आदेश', icon: <ShoppingCart size={16} /> }, 
            { id: 'nikasha_pratibedan', label: 'निकासा प्रतिवेदन', icon: <FileOutput size={16} />, count: pendingNikashaCount },
            { id: 'hafa_faram', label: 'हा.फा. फारम', icon: <ArrowRightLeft size={16} />, count: pendingHafaCount },
            { id: 'jinshi_firta_khata', label: 'जिन्सी फिर्ता फारम', icon: <RotateCcw size={16} />, count: pendingReturnCount },
            { id: 'marmat_adesh', label: 'मर्मत आदेश', icon: <Wrench size={16} />, count: pendingMarmatCount },
            { id: 'jinshi_khata', label: 'जिन्सी खाता', icon: <Book size={16} /> },
            { id: 'dakhila_pratibedan', label: 'दाखिला प्रतिवेदन', icon: <Archive size={16} /> }
        ] },
        { id: 'settings', label: 'सेटिङ (Settings)', icon: <Settings size={20} />, subItems: [
            { id: 'general_setting', label: 'सामान्य सेटिङ', icon: <Sliders size={16} /> }, 
            { id: 'store_setup', label: 'स्टोर सेटअप', icon: <Store size={16} /> }, 
            { id: 'user_management', label: 'प्रयोगकर्ता सेटअप', icon: <Users size={16} /> }, 
            { id: 'database_management', label: 'डाटाबेस व्यवस्थापन', icon: <Database size={16} /> },
            { id: 'change_password', label: 'पासवर्ड परिवर्तन', icon: <KeyRound size={16} /> }
        ] }
    ];
    return allItems.filter(item => {
        if (item.id === 'dashboard') return true;
        if (isSuperOrAdmin) return true;
        return allowedMenus.includes(item.id) || (item.subItems && item.subItems.some(sub => allowedMenus.includes(sub.id)));
    });
  }, [currentUser, inventoryTotalNotifications, pendingDakhilaCount, pendingMagCount, pendingNikashaCount, pendingHafaCount, pendingReturnCount, pendingMarmatCount]);

  const handleMenuClick = (item: any) => {
    if (item.subItems) setExpandedMenu(expandedMenu === item.id ? null : item.id);
    else { setActiveItem(item.id); setIsSidebarOpen(false); }
  };

  const handleSubItemClick = (subItemId: string) => { setActiveItem(subItemId); setIsSidebarOpen(false); };

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard': return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 no-print">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 p-2 rounded-lg text-primary-600"><LayoutDashboard size={24} /></div>
                  <div><h2 className="text-xl font-bold text-slate-800 font-nepali">मुख्य ड्यासबोर्ड</h2><p className="text-xs text-slate-500 font-medium font-nepali">हालको अवस्था र तथ्याङ्क</p></div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 no-print">
                <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div><h3 className="text-2xl font-black text-slate-800">{stats.todayRabiesReg}</h3><p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">आजको दर्ता</p></div>
                        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Syringe size={18} /></div>
                    </div>
                </div>
                <div onClick={() => setShowAttendanceModal(true)} className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95">
                    <div className="flex justify-between items-start">
                        <div><div className="flex items-baseline gap-1"><h3 className="text-2xl font-black text-emerald-600">{stats.visitedToday}</h3><span className="text-slate-400 font-bold text-sm">/ {stats.scheduledToday}</span></div><p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">खोप हाजिरी</p></div>
                        <div className={`p-2.5 rounded-xl transition-colors ${stats.totalOverdueCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'} group-hover:bg-emerald-600 group-hover:text-white`}><CalendarCheck size={18} /></div>
                    </div>
                </div>

                <div onClick={() => setShowForecastModal(true)} className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95 ${stats.totalMlAvailable < stats.totalMlRequired ? 'border-red-200 bg-red-50/10' : 'border-blue-100'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-baseline gap-1">
                                <h3 className={`text-2xl font-black ${stats.totalMlAvailable < stats.totalMlRequired ? 'text-red-600' : 'text-primary-600'}`}>
                                    {stats.pendingRabiesDosesCount}
                                </h3>
                                <span className="text-slate-400 font-bold text-sm">बाँकी</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">खोप आवश्यकता</p>
                        </div>
                        <div className={`p-2.5 rounded-xl transition-colors ${stats.totalMlAvailable < stats.totalMlRequired ? 'bg-red-100 text-red-600' : 'bg-primary-50 text-primary-600'} group-hover:bg-primary-600 group-hover:text-white`}><TrendingDown size={18} /></div>
                    </div>
                </div>

                <div onClick={() => setShowCompletedModal(true)} className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95">
                    <div className="flex justify-between items-start">
                        <div><h3 className="text-2xl font-black text-blue-600">{stats.completedPatients.length}</h3><p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">खोप पुरा गरेका</p></div>
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><GraduationCap size={18} /></div>
                    </div>
                </div>
                <div onClick={() => { setExpiryModalTab('soon'); setShowExpiryModal(true); }} className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95">
                    <div className="flex justify-between items-start">
                        <div><h3 className="text-2xl font-black text-orange-600">{stats.expiringSoonItems.length}</h3><p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">३ महिनाभित्र सकिने</p></div>
                        <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors"><Clock size={18} /></div>
                    </div>
                </div>
                <div onClick={() => { setExpiryModalTab('expired'); setShowExpiryModal(true); }} className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95 ${stats.alreadyExpiredItems.length > 0 ? 'border-red-200 bg-red-50/10' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start">
                        <div><h3 className={`text-2xl font-black ${stats.alreadyExpiredItems.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>{stats.alreadyExpiredItems.length}</h3><p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">म्याद सकिएका</p></div>
                        <div className={`p-2.5 rounded-xl transition-colors ${stats.alreadyExpiredItems.length > 0 ? 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-600 group-hover:text-white'}`}><AlertOctagon size={18} /></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div><h3 className="text-2xl font-black text-slate-800">{stats.pendingMagForms}</h3><p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">बाँकी माग फारम</p></div>
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><FilePlus size={18} /></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div><h3 className="text-2xl font-black text-slate-800">{stats.pendingStockReq}</h3><p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">दाखिला अनुरोध</p></div>
                        <div className="bg-teal-50 p-2.5 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors"><Warehouse size={18} /></div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden no-print">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                <div className="relative z-10"><h2 className="text-2xl font-black font-nepali mb-2">नमस्ते, {currentUser.fullName}!</h2><p className="text-primary-100 font-medium opacity-90 text-sm">स्मार्ट जिन्सी व्यवस्थापन प्रणालीमा तपाईंलाई स्वागत छ।</p></div>
            </div>
        </div>
      );
      case 'general_setting': return <GeneralSetting settings={generalSettings} onUpdateSettings={onUpdateGeneralSettings} />;
      case 'user_management': return <UserManagement currentUser={currentUser} users={users} onAddUser={onAddUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />;
      case 'change_password': return <ChangePassword currentUser={currentUser} users={users} onChangePassword={onChangePassword} />;
      case 'store_setup': return <StoreSetup currentFiscalYear={currentFiscalYear} stores={stores} onAddStore={onAddStore} onUpdateStore={onUpdateStore} onDeleteStore={onDeleteStore} inventoryItems={inventoryItems} onUpdateInventoryItem={onUpdateInventoryItem} />;
      case 'tb_leprosy': return <TBPatientRegistration currentFiscalYear={currentFiscalYear} currentUser={currentUser} patients={tbPatients} onAddPatient={onAddTBPatient} onUpdatePatient={onUpdateTBPatient} onDeletePatient={onDeleteTBPatient} />;
      case 'rabies': return <RabiesRegistration currentFiscalYear={currentFiscalYear} patients={rabiesPatients} onAddPatient={onAddRabiesPatient} onUpdatePatient={onUpdateRabiesPatient} onDeletePatient={onDeletePatient} currentUser={currentUser} />;
      case 'mag_faram': return <MagFaram currentFiscalYear={currentFiscalYear} currentUser={currentUser} existingForms={magForms} onSave={onSaveMagForm} inventoryItems={inventoryItems} stores={stores} generalSettings={generalSettings} allUsers={users} issueReports={issueReports} />;
      case 'hafa_faram': return <HafaFaram currentFiscalYear={currentFiscalYear} currentUser={currentUser} existingEntries={hafaEntries} onSave={onSaveHafaEntry} onDelete={onDeleteHafaEntry} inventoryItems={inventoryItems} stores={stores} generalSettings={generalSettings} users={users} />;
      case 'kharid_adesh': return <KharidAdesh orders={purchaseOrders} currentFiscalYear={currentFiscalYear} onSave={onUpdatePurchaseOrder} currentUser={currentUser} firms={firms} quotations={quotations} onDakhilaClick={(po) => setActiveItem('jinshi_maujdat')} generalSettings={generalSettings} />;
      case 'nikasha_pratibedan': return <NikashaPratibedan reports={issueReports} onSave={onUpdateIssueReport} currentUser={currentUser} currentFiscalYear={currentFiscalYear} generalSettings={generalSettings} />;
      case 'jinshi_maujdat': return <JinshiMaujdat currentFiscalYear={currentFiscalYear} currentUser={currentUser} inventoryItems={inventoryItems} onAddInventoryItem={onAddInventoryItem} onUpdateInventoryItem={onUpdateInventoryItem} stores={stores} onRequestStockEntry={onRequestStockEntry} pendingPoDakhila={pendingPoDakhila} onClearPendingPoDakhila={() => setPendingPoDakhila(null)} />;
      case 'stock_entry_approval': return <StockEntryApproval requests={stockEntryRequests} currentUser={currentUser} onApprove={onApproveStockEntry} onReject={onRejectStockEntry} stores={stores} />;
      case 'dakhila_pratibedan': return <DakhilaPratibedan dakhilaReports={dakhilaReports} onSaveDakhilaReport={onSaveDakhilaReport} currentFiscalYear={currentFiscalYear} currentUser={currentUser} stockEntryRequests={stockEntryRequests} inventoryItems={inventoryItems} onApproveStockEntry={onApproveStockEntry} onReject={onRejectStockEntry} generalSettings={generalSettings} stores={stores} />;
      case 'jinshi_khata': return <JinshiKhata currentFiscalYear={currentFiscalYear} inventoryItems={inventoryItems} issueReports={issueReports} dakhilaReports={dakhilaReports} stockEntryRequests={stockEntryRequests} returnEntries={returnEntries} generalSettings={generalSettings} />;
      case 'database_management': return <DatabaseManagement currentUser={currentUser} users={users} inventoryItems={inventoryItems} magForms={magForms} purchaseOrders={purchaseOrders} issueReports={issueReports} rabiesPatients={rabiesPatients} firms={firms} stores={stores} onClearData={onClearData} />;
      case 'sahayak_jinshi_khata': return <SahayakJinshiKhata currentFiscalYear={currentFiscalYear} currentUser={currentUser} inventoryItems={inventoryItems} issueReports={issueReports} dakhilaReports={dakhilaReports} stockEntryRequests={stockEntryRequests} users={users} returnEntries={returnEntries} generalSettings={generalSettings} />;
      case 'jinshi_firta_khata': return <JinshiFirtaFaram currentFiscalYear={currentFiscalYear} currentUser={currentUser} inventoryItems={inventoryItems} returnEntries={returnEntries} onSaveReturnEntry={onSaveReturnEntry} issueReports={issueReports} generalSettings={generalSettings} />;
      case 'marmat_adesh': return <MarmatAdesh currentFiscalYear={currentFiscalYear} currentUser={currentUser} marmatEntries={marmatEntries} onSaveMarmatEntry={onSaveMarmatEntry} inventoryItems={inventoryItems} generalSettings={generalSettings} />;
      case 'dhuliyauna_faram': return <DhuliyaunaFaram currentFiscalYear={currentFiscalYear} currentUser={currentUser} inventoryItems={inventoryItems} dhuliyaunaEntries={dhuliyaunaEntries} onSaveDhuliyaunaEntry={onSaveDhuliyaunaEntry} stores={stores} />;
      case 'log_book': return <LogBook currentUser={currentUser} currentFiscalYear={currentFiscalYear} inventoryItems={inventoryItems} logBookEntries={logBookEntries} onAddLogEntry={onSaveLogBookEntry} />;
      default: return <div className="p-8 text-center text-slate-400 font-nepali">यो मेनु हाल विकासको क्रममा छ।</div>;
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 font-sans overflow-hidden">
      {isSidebarOpen && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] no-print" onClick={() => setIsSidebarOpen(false)} />)}
      <aside className={`fixed z-[110] h-full bg-slate-900 text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out no-print ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-[280px]`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950 shrink-0"><div className="bg-primary-600 p-2 rounded-lg"><Activity size={20} className="text-white" /></div><div className="overflow-hidden"><h2 className="font-nepali font-bold text-lg leading-tight truncate">{APP_NAME}</h2><p className="text-[10px] text-slate-400 font-nepali truncate">{currentUser.organizationName}</p></div></div>
        <nav className="flex-1 p-3 space-y-1 custom-scrollbar">
             {menuItems.map((item: any) => (
               <div key={item.id}>
                  <button onClick={() => handleMenuClick(item)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeItem === item.id || (item.subItems && item.subItems.some((s: any) => s.id === activeItem)) ? 'bg-primary-600/10 text-primary-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium font-nepali text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.count > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                          {item.count}
                        </span>
                      )}
                      {item.subItems && (expandedMenu === item.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                    </div>
                  </button>
                  {item.subItems && expandedMenu === item.id && (
                      <div className="mt-1 ml-4 pl-3 border-l border-slate-800 space-y-1">
                          {item.subItems.map((sub: any) => (
                              <button key={sub.id} onClick={() => handleSubItemClick(sub.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-nepali ${activeItem === sub.id ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}>
                                <div className="flex items-center gap-2">
                                  {sub.icon}
                                  <span>{sub.label}</span>
                                </div>
                                {sub.count > 0 && (
                                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm ring-1 ring-white/20">
                                    {sub.count}
                                  </span>
                                )}
                              </button>
                          ))}
                      </div>
                  )}
               </div>
             ))}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0"><button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 w-full rounded-xl transition-all font-bold font-nepali text-sm"><LogOut size={18} /> लगआउट</button></div>
      </aside>
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm z-50 shrink-0 no-print">
            <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Menu size={20} /></button><div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-xs font-bold uppercase tracking-wider"><Calendar size={12} /> {fiscalYearLabel}</div><h2 className="font-bold text-slate-700 font-nepali truncate max-w-[150px] sm:max-w-none">{activeItem === 'dashboard' ? 'ड्यासबोर्ड' : 'कार्य क्षेत्र'}</h2></div>
            <div className="flex items-center gap-3"><button onClick={handleNotificationClick} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 relative"><Bell size={20} />{latestApprovedDakhila && latestApprovedDakhila.id !== lastSeenNotificationId && <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>}</button><div className="flex items-center gap-2 pl-2 border-l border-slate-200"><div className="text-right hidden sm:block"><p className="text-xs font-bold text-slate-800">{currentUser.username}</p><p className="text-[10px] text-slate-500 uppercase">{currentUser.role}</p></div><div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-xs shadow-sm uppercase">{currentUser.username.charAt(0)}</div></div></div>
        </header>
        <main className="flex-1 custom-scrollbar bg-slate-50/30 p-4 md:p-6 print:p-0 print:bg-white print:overflow-visible"><div className="max-w-7xl mx-auto pb-20 print:pb-0">{renderContent()}</div></main>
      </div>

      {/* --- VACCINE FORECAST MODAL --- */}
      {showForecastModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowForecastModal(false)}></div>
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95">
                  <div className="px-8 py-6 border-b bg-indigo-600 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3">
                          <TrendingDown size={24} />
                          <h3 className="font-black font-nepali text-lg">खोप आवश्यकता विश्लेषण (ARV Forecast)</h3>
                      </div>
                      <button onClick={() => setShowForecastModal(false)} className="p-2 hover:bg-white/20 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Warehouse size={12}/> Current Inventory Status (ml)
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                                  <h4 className="text-2xl font-black text-slate-800">{stats.stock05ml}</h4>
                                  <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1">0.5 ml Vials</p>
                                  <p className="text-[9px] text-slate-400">({(stats.stock05ml * 0.5).toFixed(1)} ml)</p>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                                  <h4 className="text-2xl font-black text-slate-800">{stats.stock1ml}</h4>
                                  <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1">1 ml Vials</p>
                                  <p className="text-[9px] text-slate-400">({(stats.stock1ml * 1.0).toFixed(1)} ml)</p>
                              </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 uppercase">Total Available:</span>
                              <span className="text-xl font-black text-slate-800">{stats.totalMlAvailable.toFixed(1)} ml</span>
                          </div>
                      </div>

                      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                          <div className="flex justify-between items-center mb-4">
                             <div>
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Requirement Analysis (0.2ml/dose)</p>
                                <h4 className="text-3xl font-black text-orange-700">{stats.totalMlRequired.toFixed(1)} ml</h4>
                                <p className="text-[10px] font-bold text-orange-600">for {stats.pendingRabiesDosesCount} Pending Doses</p>
                             </div>
                             <div className="p-4 bg-orange-100 rounded-2xl text-orange-600">
                                <Droplets size={32} />
                             </div>
                          </div>
                          <div className="space-y-2 border-t border-orange-100 pt-3">
                              {stats.totalMlRequired > stats.totalMlAvailable ? (
                                <>
                                  <p className="text-[10px] text-red-700 flex justify-between"><span>अपुग भोल्युम (Deficit):</span> <span className="font-bold">{(stats.totalMlRequired - stats.totalMlAvailable).toFixed(1)} ml</span></p>
                                  <p className="text-[10px] text-indigo-800 flex justify-between"><span>नयाँ अर्डर गर्नुपर्ने १ml भायल:</span> <span className="font-bold">{Math.ceil(stats.totalMlRequired - stats.totalMlAvailable)} Vials</span></p>
                                  <p className="text-[10px] text-indigo-800 flex justify-between"><span>नयाँ अर्डर गर्नुपर्ने ०.५ml भायल:</span> <span className="font-bold">{Math.ceil((stats.totalMlRequired - stats.totalMlAvailable) / 0.5)} Vials</span></p>
                                </>
                              ) : (
                                <p className="text-xs font-bold text-emerald-600 text-center py-2">मौज्दात पर्याप्त छ। थप अर्डर आवश्यक छैन।</p>
                              )}
                          </div>
                      </div>

                      <div className={`p-6 rounded-2xl border flex items-center gap-4 ${
                          stats.totalMlAvailable >= stats.totalMlRequired 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                          <div className={`p-3 rounded-xl ${stats.totalMlAvailable >= stats.totalMlRequired ? 'bg-emerald-100' : 'bg-red-100'}`}>
                              {stats.totalMlAvailable >= stats.totalMlRequired 
                                ? <CheckCircle2 size={24} /> 
                                : <AlertTriangle size={24} />
                              }
                          </div>
                          <div>
                              <h4 className="font-black text-sm uppercase tracking-tight">Status: {stats.totalMlAvailable >= stats.totalMlRequired ? 'Safe Stock' : 'Critical Stock'}</h4>
                              <p className="text-xs font-bold font-nepali mt-1 leading-relaxed">
                                  {stats.totalMlAvailable >= stats.totalMlRequired 
                                    ? 'हालको बिरामीहरूको बाँकी डोज पुरा गर्न मौज्दात पर्याप्त छ।' 
                                    : `अपुग: ${(stats.totalMlRequired - stats.totalMlAvailable).toFixed(1)} ml औषधि तत्काल अर्डर गर्न आवश्यक छ।`
                                  }
                              </p>
                          </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl text-[10px] text-slate-500 font-medium italic leading-relaxed">
                        <Info size={12} className="inline mr-1" />
                        नियम: १ डोज = ०.२ ml। तसर्थ १ ml भायलबाट ५ डोज र ०.५ ml भायलबाट २.५ डोज खोप लगाउन सकिन्छ।
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t flex justify-end">
                      <button onClick={() => setShowForecastModal(false)} className="bg-slate-800 text-white px-8 py-3 rounded-xl text-sm font-black shadow-lg hover:bg-black transition-colors">Close</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- ATTENDANCE MODAL --- */}
      {showAttendanceModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAttendanceModal(false)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                  <div className="px-6 py-4 border-b bg-emerald-50 flex justify-between items-center text-emerald-800">
                      <div className="flex items-center gap-3">
                          <CalendarCheck size={20} />
                          <h3 className="font-bold font-nepali">आजको खोप हाजिरी (Vaccination Schedule)</h3>
                      </div>
                      <button onClick={() => setShowAttendanceModal(false)} className="p-2 hover:bg-white rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-0 overflow-y-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                  <th className="px-6 py-3">Patient Name</th>
                                  <th className="px-6 py-3">Dose</th>
                                  <th className="px-6 py-3">Scheduled Date (BS)</th>
                                  <th className="px-6 py-3">Status</th>
                                  <th className="px-6 py-3">Reg No.</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y">
                              {stats.patientsForToday.length === 0 ? (
                                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">आज कुनै तालिका छैन।</td></tr>
                              ) : (
                                  stats.patientsForToday.map((item, idx) => (
                                      <tr key={idx} className={`hover:bg-slate-50 ${item.isOverdue ? 'bg-red-50/30' : ''}`}>
                                          <td className="px-6 py-4 font-bold">{item.patient.name}</td>
                                          <td className="px-6 py-4 font-mono">Day {item.doseDay}</td>
                                          <td className="px-6 py-4 font-nepali font-bold text-slate-600">
                                              {convertAdToBs(item.scheduledDate)}
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                  item.status === 'Given' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                  item.isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                                              }`}>
                                                  {item.status === 'Given' ? 'पुरा भयो' : item.isOverdue ? 'ढिला भएको' : 'आउनु पर्ने'}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-xs font-mono">{item.patient.regNo}</td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- COMPLETED PATIENTS MODAL --- */}
      {showCompletedModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCompletedModal(false)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                  <div className="px-6 py-4 border-b bg-blue-50 flex justify-between items-center text-blue-800">
                      <div className="flex items-center gap-3">
                          <GraduationCap size={20} />
                          <h3 className="font-bold font-nepali">खोप पुरा गरेका बिरामीहरू (Completed)</h3>
                      </div>
                      <button onClick={() => setShowCompletedModal(false)} className="p-2 hover:bg-white rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-4 border-b">
                      <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                              type="text" 
                              placeholder="नाम वा दर्ता नं खोज्नुहोस्..." 
                              className="w-full pl-9 pr-4 py-2 border rounded-lg outline-none text-sm"
                              value={completedSearchTerm}
                              onChange={(e) => setCompletedSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="p-0 overflow-y-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                  <th className="px-6 py-3">Reg No.</th>
                                  <th className="px-6 py-3">Patient Name</th>
                                  <th className="px-6 py-3">Address</th>
                                  <th className="px-6 py-3 text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y">
                              {filteredCompletedPatients.length === 0 ? (
                                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">कोही फेला परेन।</td></tr>
                              ) : (
                                  filteredCompletedPatients.map((p) => (
                                      <tr key={p.id} className="hover:bg-slate-50">
                                          <td className="px-6 py-4 font-mono font-bold">{p.regNo}</td>
                                          <td className="px-6 py-4 font-bold">{p.name}</td>
                                          <td className="px-6 py-4 text-xs">{p.address}</td>
                                          <td className="px-6 py-4 text-right">
                                              <div className="flex justify-end gap-2">
                                                  <button className="text-primary-600 hover:underline font-bold text-xs" onClick={() => { setActiveItem('rabies'); setShowCompletedModal(false); }}>विवरण हेर्नुहोस्</button>
                                                  <button className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-[10px] shadow-sm hover:bg-indigo-700 flex items-center gap-1" onClick={() => setSelectedCertificatePatient(p)}>
                                                      <AwardIcon size={12} /> प्रमाणपत्र (Cert)
                                                  </button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- VACCINE CERTIFICATE MODAL --- */}
      {selectedCertificatePatient && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedCertificatePatient(null)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 no-print">
                  <div className="sticky top-0 z-10 px-6 py-4 border-b bg-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <AwardIcon className="text-indigo-600" />
                          <h3 className="font-bold text-slate-800 font-nepali">खोप प्रमाणपत्र प्रिभ्यु</h3>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2">
                              <Printer size={16} /> प्रिन्ट गर्नुहोस्
                          </button>
                          <button onClick={() => setSelectedCertificatePatient(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                      </div>
                  </div>
                  <div className="p-4 md:p-10 flex justify-center bg-slate-50">
                      <VaccineCertificate patient={selectedCertificatePatient} generalSettings={generalSettings} />
                  </div>
              </div>
              <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
                  <VaccineCertificate patient={selectedCertificatePatient} generalSettings={generalSettings} />
              </div>
          </div>
      )}

      {/* --- EXPIRY ALERT MODAL --- */}
      {showExpiryModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowExpiryModal(false)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                  <div className={`px-6 py-4 border-b flex justify-between items-center ${expiryModalTab === 'expired' ? 'bg-red-50 text-red-800' : 'bg-orange-50 text-orange-800'}`}>
                      <div className="flex items-center gap-3">
                          {expiryModalTab === 'expired' ? <AlertOctagon size={20} /> : <Clock size={20} />}
                          <h3 className="font-bold font-nepali">
                              {expiryModalTab === 'expired' ? 'म्याद समाप्त भएका सामानहरू' : '३ महिनाभित्र म्याद सकिने सामानहरू'}
                          </h3>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => window.print()} className="p-2 bg-white/50 hover:bg-white text-slate-700 rounded-lg transition-colors" title="Print List">
                              <Printer size={20} />
                          </button>
                          <button onClick={() => setShowExpiryModal(false)} className="p-2 hover:bg-white rounded-full"><X size={20}/></button>
                      </div>
                  </div>
                  <div className="flex p-2 bg-slate-100 gap-1 no-print">
                      <button 
                          onClick={() => setExpiryModalTab('soon')} 
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${expiryModalTab === 'soon' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-50'}`}
                      >
                          Expiring Soon ({stats.expiringSoonItems.length})
                      </button>
                      <button 
                          onClick={() => setExpiryModalTab('expired')} 
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${expiryModalTab === 'expired' ? 'bg-white shadow-sm text-red-600' : 'text-slate-50'}`}
                      >
                          Expired ({stats.alreadyExpiredItems.length})
                      </button>
                  </div>
                  <div className="p-0 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                  <th className="px-4 py-3">Item Name</th>
                                  <th className="px-4 py-3 text-center">Batch</th>
                                  <th className="px-4 py-3 text-center">Expiry</th>
                                  <th className="px-4 py-3 text-center">Qty</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y">
                              {(expiryModalTab === 'expired' ? stats.alreadyExpiredItems : stats.expiringSoonItems).length === 0 ? (
                                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">कुनै डाटा छैन।</td></tr>
                              ) : (
                                  (expiryModalTab === 'expired' ? stats.alreadyExpiredItems : stats.expiringSoonItems).map((item) => (
                                      <tr key={item.id} className="hover:bg-slate-50">
                                          <td className="px-4 py-3 font-bold">{item.itemName}</td>
                                          <td className="px-4 py-3 text-center font-mono">{item.batchNo}</td>
                                          <td className="px-4 py-3 text-center text-red-600 font-bold">{item.expiryDateBs}</td>
                                          <td className="px-4 py-3 text-center font-black">{item.currentQuantity}</td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>

                  <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 font-nepali">
                      <div className="text-center mb-8">
                          <h1 className="text-xl font-bold">{generalSettings.orgNameNepali}</h1>
                          <h2 className="text-lg font-bold">{generalSettings.subTitleNepali}</h2>
                          {generalSettings.subTitleNepali2 && <h3 className="text-base font-bold">{generalSettings.subTitleNepali2}</h3>}
                          {generalSettings.subTitleNepali3 && <h3 className="text-lg font-bold">{generalSettings.subTitleNepali3}</h3>}
                          <div className="text-sm mt-2">{generalSettings.address} | फोन: {generalSettings.phone}</div>
                          <div className="mt-8 border-b-2 border-slate-800 pb-2">
                              <h3 className="text-lg font-black underline underline-offset-4">
                                  {expiryModalTab === 'expired' ? 'म्याद समाप्त भएका सामानहरूको सूची' : '३ महिनाभित्र म्याद सकिने सामानहरूको सूची'}
                              </h3>
                              <p className="text-xs mt-2 font-bold text-slate-500 uppercase tracking-widest">Expiry Alert Report</p>
                          </div>
                      </div>
                      
                      <table className="w-full border-collapse border border-slate-800 text-xs text-center mt-4">
                          <thead>
                              <tr className="bg-slate-50 font-bold">
                                  <th className="border border-slate-800 p-2 w-12">क्र.सं.</th>
                                  <th className="border border-slate-800 p-2 text-left">सामानको नाम</th>
                                  <th className="border border-slate-800 p-2">ब्याच नं. (Batch)</th>
                                  <th className="border border-slate-800 p-2">म्याद सकिने मिति (BS)</th>
                                  <th className="border border-slate-800 p-2">मौज्दात</th>
                                  <th className="border border-slate-800 p-2">एकाई</th>
                                  <th className="border border-slate-800 p-2">स्टोर/गोदाम</th>
                              </tr>
                          </thead>
                          <tbody>
                              {(expiryModalTab === 'expired' ? stats.alreadyExpiredItems : stats.expiringSoonItems).map((item, idx) => (
                                  <tr key={item.id}>
                                      <td className="border border-slate-800 p-2">{idx + 1}</td>
                                      <td className="border border-slate-800 p-2 text-left font-bold">{item.itemName}</td>
                                      <td className="border border-slate-800 p-2 font-mono">{item.batchNo || '-'}</td>
                                      <td className="border border-slate-800 p-2 font-bold text-red-600">{item.expiryDateBs}</td>
                                      <td className="border border-slate-800 p-2 font-bold">{item.currentQuantity}</td>
                                      <td className="border border-slate-800 p-2">{item.unit}</td>
                                      <td className="border border-slate-800 p-2">{stores.find(s => s.id === item.storeId)?.name || '-'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>

                      <div className="grid grid-cols-2 mt-20 gap-20">
                          <div className="text-center">
                              <div className="border-t border-slate-800 pt-1 font-bold">तयार गर्ने</div>
                              <div className="text-xs mt-1">{currentUser.fullName}</div>
                          </div>
                          <div className="text-center">
                              <div className="border-t border-slate-800 pt-1 font-bold">स्वीकृत गर्ने</div>
                          </div>
                      </div>
                      <div className="mt-20 text-[8px] text-slate-400 text-center uppercase tracking-widest italic">
                          Generated on: {new NepaliDate().format('YYYY-MM-DD HH:mm')} | {APP_NAME}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- NOTIFICATION MODAL --- */}
      {showNotificationModal && latestApprovedDakhila && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowNotificationModal(false)}></div>
              <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                  <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 font-nepali mb-2">दाखिला स्वीकृत भएको जानकारी</h3>
                      <p className="text-sm text-slate-500 font-nepali leading-relaxed">
                          स्टोरबाट पठाइएको दाखिला अनुरोध स्वीकृत भएको छ। <br/>
                          सामानहरू मौज्दातमा थपिएका छन्।
                      </p>
                      <div className="mt-6 bg-slate-50 p-4 rounded-xl text-left border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Source Details</p>
                          <p className="text-sm font-bold text-slate-700">{latestApprovedDakhila.receiptSource}</p>
                          <p className="text-xs text-slate-500 mt-1">Ref No: {latestApprovedDakhila.refNo}</p>
                      </div>
                  </div>
                  <button 
                      onClick={() => setShowNotificationModal(false)}
                      className="w-full py-4 bg-slate-900 text-white font-bold hover:bg-black transition-colors"
                  >
                      धन्यवाद, हेरेँ
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};
