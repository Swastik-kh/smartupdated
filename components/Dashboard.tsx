
import React, { useState, useMemo } from 'react';
import { 
  LogOut, Menu, Calendar, Stethoscope, Package, FileText, Settings, LayoutDashboard, 
  ChevronDown, ChevronRight, Syringe, Activity, 
  ClipboardList, FileSpreadsheet, FilePlus, ShoppingCart, FileOutput, 
  BookOpen, Book, Archive, RotateCcw, Wrench, Scroll, BarChart3,
  Sliders, Store, ShieldCheck, Users, Database, KeyRound, UserCog, Lock, Warehouse, ClipboardCheck, Bell, X, CheckCircle2, ArrowRightCircle, AlertTriangle, Pill, Scissors, Clock, Calculator, Trash2, UsersRound, TrendingUp, Info, PieChart, CalendarCheck, User, Printer, SearchX, AlertOctagon, GraduationCap, Award, Search
} from 'lucide-react';
import { APP_NAME, ORG_NAME, FISCAL_YEARS } from '../constants';
import { DashboardProps, PurchaseOrderEntry, InventoryItem, RabiesPatient } from '../types'; 
import { UserManagement } from './UserManagement';
import { ChangePassword } from './ChangePassword';
import { TBPatientRegistration } from './TBPatientRegistration';
import { RabiesRegistration } from './RabiesRegistration';
import { RabiesReport } from './RabiesReport';
import { MagFaram } from './MagFaram';
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
  const [completedSearchTerm, setCompletedSearchTerm] = useState('');
  const [selectedReportPatient, setSelectedReportPatient] = useState<RabiesPatient | null>(null);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiryModalTab, setExpiryModalTab] = useState<'soon' | 'expired'>('soon');
  const [lastSeenNotificationId, setLastSeenNotificationId] = useState<string | null>(null);

  const latestApprovedDakhila = useMemo(() => {
      const approved = stockEntryRequests.filter(req => req.status === 'Approved');
      if (approved.length > 0) {
          return approved.sort((a, b) => parseInt(b.id) - parseInt(a.id))[0];
      }
      return null;
  }, [stockEntryRequests]);

  const handleNotificationClick = () => {
      if (latestApprovedDakhila) {
          setLastSeenNotificationId(latestApprovedDakhila.id);
          setShowNotificationModal(true);
      }
  };

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
    let totalFutureDosesNeeded = 0;
    const patientsForToday: Array<{patient: RabiesPatient, doseDay: number, status: string, scheduledDate: string, isOverdue: boolean}> = [];
    const completedPatients: RabiesPatient[] = [];

    rabiesPatients.forEach(patient => {
        const schedule = patient.schedule || [];
        
        // Check if all scheduled doses are completed (Given)
        const isCompleted = schedule.length > 0 && schedule.every(dose => dose.status === 'Given');
        if (isCompleted) {
            completedPatients.push(patient);
        }

        schedule.forEach(dose => {
            const isScheduledToday = dose.date === todayAdStr;
            const isOverdue = dose.date < todayAdStr && dose.status === 'Pending';
            const isGivenToday = dose.status === 'Given' && (dose.givenDate === todayAdStr);

            if (isScheduledToday) {
                scheduledToday++;
            }

            if (isOverdue) {
                totalOverdueCount++;
            }
            
            if (isScheduledToday || isGivenToday || isOverdue) {
                if (isGivenToday) {
                    visitedToday++;
                }
                patientsForToday.push({
                    patient,
                    doseDay: dose.day,
                    status: dose.status,
                    scheduledDate: dose.date,
                    isOverdue: isOverdue
                });
            }

            if (dose.status === 'Pending') {
                totalFutureDosesNeeded++;
            }
        });
    });

    patientsForToday.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.status === 'Pending' && b.status === 'Given') return -1;
        if (a.status === 'Given' && b.status === 'Pending') return 1;
        return a.scheduledDate.localeCompare(b.scheduledDate);
    });

    const myOrgInventory = inventoryItems.filter(item => 
        currentUser.role === 'SUPER_ADMIN' || !item.orgName || item.orgName === currentUser.organizationName
    );

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
    
    const vials1mlNeeded = Math.ceil(totalFutureDosesNeeded / 5);
    const vials05mlNeeded = Math.ceil(totalFutureDosesNeeded / 2);

    return { 
      todayRabiesReg, 
      scheduledToday,
      visitedToday,
      totalOverdueCount,
      totalFutureDosesNeeded,
      vials1mlNeeded,
      vials05mlNeeded,
      patientsForToday,
      completedPatients,
      expiringSoonItems,
      alreadyExpiredItems,
      totalInventory: myOrgInventory.length, 
      pendingMagForms: magForms.filter(f => f.status === 'Pending').length, 
      pendingStockReq: stockEntryRequests.filter(r => r.status === 'Pending').length 
    };
  }, [rabiesPatients, inventoryItems, magForms, stockEntryRequests, currentUser]);

  const filteredCompletedPatients = useMemo(() => {
    if (!completedSearchTerm.trim()) return stats.completedPatients;
    const term = completedSearchTerm.toLowerCase();
    return stats.completedPatients.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.regNo.toLowerCase().includes(term) ||
      p.address.toLowerCase().includes(term)
    );
  }, [stats.completedPatients, completedSearchTerm]);

  const pendingStockRequestsCount = stockEntryRequests.filter(r => r.status === 'Pending').length;
  
  const magFaramBadgeCount = useMemo(() => {
      if (currentUser.role === 'STOREKEEPER') return magForms.filter(f => f.status === 'Pending').length;
      if (['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role)) return magForms.filter(f => f.status === 'Verified').length;
      return 0;
  }, [magForms, currentUser.role]);

  const kharidAdeshBadgeCount = useMemo(() => {
    if (currentUser.role === 'STOREKEEPER') return purchaseOrders.filter(o => o.status === 'Pending').length;
    if (currentUser.role === 'ACCOUNT') return purchaseOrders.filter(o => o.status === 'Pending Account').length;
    if (['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role)) return purchaseOrders.filter(o => o.status === 'Account Verified').length;
    return 0;
  }, [purchaseOrders, currentUser.role]);

  const menuItems = useMemo(() => {
    const isSuperOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    const allowedMenus = currentUser.allowedMenus || [];

    const allItems = [
        { id: 'dashboard', label: 'ड्यासबोर्ड (Dashboard)', icon: <LayoutDashboard size={20} /> },
        { id: 'services', label: 'सेवा (Services)', icon: <Stethoscope size={20} />, subItems: [{ id: 'tb_leprosy', label: 'क्षयरोग (TB)', icon: <Activity size={16} /> }, { id: 'rabies', label: 'रेबिज खोप (Rabies)', icon: <Syringe size={16} /> }] },
        { id: 'inventory', label: 'जिन्सी (Inventory)', icon: <Package size={20} />, subItems: [ 
            { id: 'stock_entry_approval', label: 'स्टक प्रविष्टि', icon: <ClipboardCheck size={16} />, badgeCount: pendingStockRequestsCount }, 
            { id: 'jinshi_maujdat', label: 'जिन्सी मौज्दात', icon: <Warehouse size={16} /> }, 
            { id: 'mag_faram', label: 'माग फारम', icon: <FilePlus size={16} />, badgeCount: magFaramBadgeCount }, 
            { id: 'kharid_adesh', label: 'खरिद आदेश', icon: <ShoppingCart size={16} />, badgeCount: kharidAdeshBadgeCount }, 
            { id: 'nikasha_pratibedan', label: 'निकासा प्रतिवेदन', icon: <FileOutput size={16} /> },
            { id: 'jinshi_khata', label: 'जिन्सी खाता', icon: <Book size={16} /> },
            { id: 'dakhila_pratibedan', label: 'दाखिला प्रतिवेदन', icon: <Archive size={16} /> }
        ] },
        { id: 'settings', label: 'सेटिङ (Settings)', icon: <Settings size={20} />, subItems: [
            { id: 'general_setting', label: 'सामान्य सेटिङ', icon: <Sliders size={16} /> }, 
            { id: 'store_setup', label: 'स्टोर सेटअप', icon: <Store size={16} /> }, 
            { id: 'user_management', label: 'प्रयोगकर्ता सेटअप', icon: <Users size={16} /> }, 
            { id: 'change_password', label: 'पासवर्ड परिवर्तन', icon: <KeyRound size={16} /> }
        ] }
    ];

    return allItems.filter(item => {
        if (item.id === 'dashboard') return true;
        if (isSuperOrAdmin) return true;
        return allowedMenus.includes(item.id) || (item.subItems && item.subItems.some(sub => allowedMenus.includes(sub.id)));
    });
  }, [currentUser, pendingStockRequestsCount, magFaramBadgeCount, kharidAdeshBadgeCount]);

  const handleMenuClick = (item: any) => {
    if (item.subItems) setExpandedMenu(expandedMenu === item.id ? null : item.id);
    else { setActiveItem(item.id); setIsSidebarOpen(false); }
  };

  const handleSubItemClick = (subItemId: string) => { setActiveItem(subItemId); setIsSidebarOpen(false); };
  const handleDakhilaFromPo = (po: PurchaseOrderEntry) => { setPendingPoDakhila(po); setActiveItem('jinshi_maujdat'); };

  const convertAdToBs = (adDate: string) => {
      if (!adDate) return '-';
      try {
          const parts = adDate.split('-');
          const jsDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return new NepaliDate(jsDate).format('YYYY/MM/DD');
      } catch (e) {
          return adDate;
      }
  };

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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 no-print">
                <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">{stats.todayRabiesReg}</h3>
                            <p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">आजको दर्ता</p>
                        </div>
                        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Syringe size={18} /></div>
                    </div>
                </div>

                <div 
                  onClick={() => setShowAttendanceModal(true)}
                  className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-baseline gap-1"><h3 className="text-2xl font-black text-emerald-600">{stats.visitedToday}</h3><span className="text-slate-400 font-bold text-sm">/ {stats.scheduledToday}</span></div>
                            <p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">खोप हाजिरी</p>
                            {stats.totalOverdueCount > 0 && <span className="text-[8px] font-black text-red-500 animate-pulse block mt-1">{stats.totalOverdueCount} डोज छुटेको</span>}
                        </div>
                        <div className={`p-2.5 rounded-xl transition-colors ${stats.totalOverdueCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'} group-hover:bg-emerald-600 group-hover:text-white`}><CalendarCheck size={18} /></div>
                    </div>
                </div>

                <div 
                  onClick={() => setShowCompletedModal(true)}
                  className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black text-blue-600">{stats.completedPatients.length}</h3>
                            <p className="text-[10px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">खोप पुरा गरेका</p>
                            {stats.completedPatients.length > 0 && <span className="text-[8px] font-black text-blue-500 block mt-1">Course Completed</span>}
                        </div>
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

            {showAttendanceModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 no-print">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAttendanceModal(false)}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b bg-emerald-50 text-emerald-800 flex justify-between items-center">
                            <div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><CalendarCheck size={20} /></div><div><h3 className="font-bold font-nepali text-lg">खोप हाजिरी तथा बाँकी विवरण</h3><p className="text-xs text-emerald-600 font-medium">{new NepaliDate().format('YYYY MMMM DD')} सम्मको विवरण</p></div></div>
                            <button onClick={() => setShowAttendanceModal(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[60vh] p-6">
                            {stats.patientsForToday.length === 0 ? (<div className="flex flex-col items-center justify-center py-12 text-slate-400"><Activity size={48} className="opacity-20 mb-4" /><p className="font-nepali text-lg font-bold">आजसम्म कुनै खोप तालिका बाँकी छैन।</p></div>) : (
                                <div className="space-y-3">{stats.patientsForToday.map(({ patient, doseDay, status, scheduledDate, isOverdue }, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${status === 'Given' ? 'border-emerald-100 bg-emerald-50/20' : isOverdue ? 'border-red-100 bg-red-50/20' : 'border-orange-100 bg-orange-50/20'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${status === 'Given' ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{patient.name.charAt(0)}</div>
                                            <div><h4 className="font-bold text-slate-800">{patient.name}</h4><div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider"><span>ID: {patient.regNo}</span><span>•</span><span className={isOverdue ? 'text-red-500 font-black' : ''}>तालिका: {convertAdToBs(scheduledDate)}</span></div></div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-end"><span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-[10px] font-black text-slate-600">DAY {doseDay}</span>{isOverdue && <span className="text-[8px] font-black text-red-600 uppercase mt-1 animate-pulse">छुटेको</span>}</div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${status === 'Given' ? 'bg-emerald-500 text-white border-emerald-600' : isOverdue ? 'bg-red-600 text-white border-red-700' : 'bg-orange-500 text-white border-orange-600'}`}>{status === 'Given' ? 'सम्पन्न' : 'बाँकी'}</span>
                                        </div>
                                    </div>
                                ))}</div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3"><button onClick={() => { setShowAttendanceModal(false); setActiveItem('rabies'); }} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2"><Syringe size={16} /> क्लिनिकमा जानुहोस्</button></div>
                    </div>
                </div>
            )}

            {showCompletedModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 no-print">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => { setShowCompletedModal(false); setSelectedReportPatient(null); setCompletedSearchTerm(''); }}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b bg-blue-50 text-blue-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><GraduationCap size={20} /></div>
                                <div><h3 className="font-bold font-nepali text-lg">खोप पुरा गरेका बिरामीहरू</h3><p className="text-xs text-blue-600 font-medium">Vaccine Course Completed Patients</p></div>
                            </div>
                            <button onClick={() => { setShowCompletedModal(false); setSelectedReportPatient(null); setCompletedSearchTerm(''); }} className="p-2 hover:bg-blue-100 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto max-h-[60vh] p-6">
                            {!selectedReportPatient ? (
                                <>
                                    <div className="relative mb-6">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Search size={18} />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="नाम, दर्ता नं. वा ठेगानाबाट खोज्नुहोस्..." 
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all"
                                            value={completedSearchTerm}
                                            onChange={(e) => setCompletedSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {filteredCompletedPatients.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <SearchX size={48} className="opacity-20 mb-4" />
                                            <p className="font-nepali text-lg font-bold">खोजिएको बिरामी फेला परेन।</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredCompletedPatients.map((patient, idx) => (
                                                <div key={idx} onClick={() => setSelectedReportPatient(patient)} className="flex items-center justify-between p-4 rounded-2xl border border-blue-100 bg-blue-50/10 cursor-pointer hover:bg-blue-50 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">{patient.name.charAt(0)}</div>
                                                        <div><h4 className="font-bold text-slate-800">{patient.name}</h4><div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider"><span>ID: {patient.regNo}</span><span>•</span><span>{patient.address}</span></div></div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider bg-blue-500 text-white border-blue-600">VIEW REPORT</span>
                                                        <ChevronRight size={18} className="text-slate-400" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div id="vaccine-report-card" className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-sm font-nepali">
                                    <div className="mb-6">
                                        <div className="flex items-start justify-between">
                                            <div className="w-20 flex justify-start pt-1">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emblem_of_Nepal.svg/1200px-Emblem_of_Nepal.svg.png" alt="Nepal Emblem" className="h-16 w-16 object-contain" />
                                            </div>
                                            <div className="flex-1 text-center space-y-0.5">
                                                <h1 className="text-base font-bold text-red-600">{generalSettings.orgNameNepali}</h1>
                                                {generalSettings.subTitleNepali && <h2 className="text-sm font-bold">{generalSettings.subTitleNepali}</h2>}
                                                {generalSettings.subTitleNepali2 && <h3 className="text-xs font-bold">{generalSettings.subTitleNepali2}</h3>}
                                                {generalSettings.subTitleNepali3 && <h3 className="text-sm font-bold">{generalSettings.subTitleNepali3}</h3>}
                                                <div className="text-[9px] mt-1 space-x-1 font-medium text-slate-500">
                                                    <span>{generalSettings.address}</span>
                                                    {generalSettings.phone && <span>| फोन: {generalSettings.phone}</span>}
                                                </div>
                                            </div>
                                            <div className="w-20"></div>
                                        </div>
                                        <div className="text-center mt-4 border-b pb-2">
                                            <h2 className="text-lg font-black text-slate-800 underline underline-offset-4">रेबिज विरुद्धको खोप प्रमाणपत्र</h2>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Vaccination Completion Certificate</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">बिरामीको नाम (Name)</p>
                                            <p className="font-black text-slate-800">{selectedReportPatient.name}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">दर्ता नम्बर (Reg No)</p>
                                            <p className="font-mono font-bold text-indigo-600">{selectedReportPatient.regNo}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">उमेर / लिङ्ग (Age/Sex)</p>
                                            <p className="font-bold text-slate-800">{selectedReportPatient.age} Yr / {selectedReportPatient.sex}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">ठेगाना (Address)</p>
                                            <p className="font-bold text-slate-800 truncate">{selectedReportPatient.address}</p>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-slate-200">
                                        <table className="w-full text-xs text-center border-collapse">
                                            <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
                                                <tr><th className="p-2 border-b border-r">डोज (Dose)</th><th className="p-2 border-b border-r">निर्धारित मिति</th><th className="p-2 border-b">लगाएको मिति (Administered)</th></tr>
                                            </thead>
                                            <tbody>
                                                {selectedReportPatient.schedule?.map((dose, idx) => (
                                                    <tr key={idx} className="border-b last:border-b-0">
                                                        <td className="p-2 border-r font-black bg-slate-50/50">DAY {dose.day}</td>
                                                        <td className="p-2 border-r font-nepali">{convertAdToBs(dose.date)}</td>
                                                        <td className="p-2 font-black text-emerald-600 font-nepali bg-emerald-50/10">
                                                            {dose.givenDate ? convertAdToBs(dose.givenDate) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-10 grid grid-cols-2 gap-12 text-center">
                                        <div><div className="border-t border-slate-300 pt-1 font-bold text-xs">खोप लगाउनेको नाम / पद</div></div>
                                        <div><div className="border-t border-slate-300 pt-1 font-bold text-xs">प्रमाणित गर्ने (अस्पताल प्रमुख)</div></div>
                                    </div>
                                    <div className="mt-8 pt-4 border-t border-slate-100 text-center"><p className="text-[10px] text-slate-400 font-medium italic">यो प्रमाणपत्र प्रणालीबाट स्वतः जनरेट गरिएको हो।</p></div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                            {selectedReportPatient ? (
                                <>
                                    <button onClick={() => setSelectedReportPatient(null)} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-all">पछि जानुहोस्</button>
                                    <button onClick={() => {
                                        const printContent = document.getElementById('vaccine-report-card');
                                        if (printContent) {
                                            const printWindow = window.open('', '_blank');
                                            printWindow?.document.write(`
                                                <html>
                                                    <head>
                                                        <title>Vaccination Report Card - ${selectedReportPatient.name}</title>
                                                        <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;700&display=swap" rel="stylesheet">
                                                        <script src="https://cdn.tailwindcss.com"></script>
                                                        <style>
                                                            body { font-family: 'Mukta', sans-serif; padding: 20px; background: white; }
                                                            @media print { 
                                                                .no-print { display: none; } 
                                                                body { padding: 0; }
                                                            }
                                                            .certificate-box { border: 2px solid #e2e8f0; padding: 40px; border-radius: 24px; position: relative; margin: 0 auto; max-width: 800px; }
                                                            h1 { color: #dc2626; font-weight: 900; font-size: 1.25rem; line-height: 1.2; }
                                                            h2 { font-weight: 700; font-size: 1.1rem; }
                                                            .org-header { text-align: center; margin-bottom: 20px; }
                                                            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                                            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; }
                                                            .font-black { font-weight: 900; }
                                                            .text-red-600 { color: #dc2626; }
                                                            .text-emerald-600 { color: #059669; }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        <div class="certificate-box">
                                                            ${printContent.innerHTML}
                                                        </div>
                                                        <script>
                                                            window.onload = () => { 
                                                                setTimeout(() => {
                                                                    window.print(); 
                                                                    window.close(); 
                                                                }, 500);
                                                            }
                                                        </script>
                                                    </body>
                                                </html>
                                            `);
                                            printWindow?.document.close();
                                        }
                                    }} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2"><Printer size={16} /> रिपोर्ट प्रिन्ट</button>
                                </>
                            ) : (
                                <button onClick={() => { setShowCompletedModal(false); setCompletedSearchTerm(''); }} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-all">बन्द गर्नुहोस्</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showExpiryModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in no-print" onClick={() => setShowExpiryModal(false)}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className={`px-6 py-5 border-b flex justify-between items-center no-print ${expiryModalTab === 'expired' ? 'bg-red-50 text-red-800' : 'bg-orange-50 text-orange-800'}`}>
                            <div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${expiryModalTab === 'expired' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{expiryModalTab === 'expired' ? <AlertOctagon size={20} /> : <AlertTriangle size={20} />}</div><div><h3 className="font-bold font-nepali text-lg">म्याद विवरण (Expiry Status)</h3><div className="flex gap-2 mt-1"><button onClick={() => setExpiryModalTab('soon')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${expiryModalTab === 'soon' ? 'bg-orange-600 text-white' : 'bg-white/50 text-orange-700 hover:bg-orange-100'}`}>म्याद सकिन लागेका ({stats.expiringSoonItems.length})</button><button onClick={() => setExpiryModalTab('expired')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${expiryModalTab === 'expired' ? 'bg-red-600 text-white' : 'bg-white/50 text-red-700 hover:bg-red-100'}`}>म्याद सकिएका ({stats.alreadyExpiredItems.length})</button></div></div></div>
                            <button onClick={() => setShowExpiryModal(false)} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div id="expiry-report-area" className="flex-1 overflow-auto max-h-[70vh] p-0 print:max-h-none print:overflow-visible">
                            <div className="hidden print:block text-center mb-8 p-8"><h1 className="text-xl font-bold text-red-600 mb-1">{generalSettings.orgNameNepali}</h1><h2 className="text-lg font-bold underline underline-offset-4 font-nepali">{expiryModalTab === 'soon' ? 'म्याद सकिन लागेका सामानहरूको प्रतिवेदन' : 'म्याद सकिएका सामानहरूको प्रतिवेदन'}</h2><p className="text-sm mt-2 font-medium">मिति: {new NepaliDate().format('YYYY/MM/DD')}</p></div>
                            {((expiryModalTab === 'soon' && stats.expiringSoonItems.length === 0) || (expiryModalTab === 'expired' && stats.alreadyExpiredItems.length === 0)) ? (<div className="flex flex-col items-center justify-center py-24 text-slate-400 no-print"><div className="bg-slate-50 p-6 rounded-full mb-4 ring-8 ring-slate-50/50"><SearchX size={64} className="opacity-40 text-slate-400" /></div><p className="font-nepali text-xl font-bold text-slate-600">रेकर्ड फेला परेन (Record not found)</p><p className="text-sm mt-2 font-medium">यहाँ कुनै सामानको विवरण उपलब्ध छैन।</p></div>) : (
                                <table className="w-full text-sm text-left border-collapse print:text-[10px]">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0 print:relative"><tr><th className="px-6 py-4 border-b">सामानको नाम</th><th className="px-6 py-4 border-b">स्टोर (Store)</th><th className="px-6 py-4 border-b">ब्याच नं</th><th className="px-6 py-4 border-b">बाँकी परिमाण</th><th className="px-6 py-4 border-b">म्याद सकिने मिति (BS)</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">{(expiryModalTab === 'soon' ? stats.expiringSoonItems : stats.alreadyExpiredItems).map((item, idx) => (
                                        <tr key={idx} className={`hover:bg-slate-50 transition-colors ${expiryModalTab === 'expired' ? 'bg-red-50/10' : ''}`}><td className="px-6 py-4"><div><div className="font-bold text-slate-800">{item.itemName}</div><div className="text-[10px] text-slate-400 font-mono">{item.uniqueCode || item.sanketNo}</div></div></td><td className="px-6 py-4"><span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{stores.find(s => s.id === item.storeId)?.name || 'N/A'}</span></td><td className="px-6 py-4 font-mono text-slate-600">{item.batchNo || '-'}</td><td className="px-6 py-4"><span className="font-black text-slate-800">{item.currentQuantity}</span><span className="ml-1 text-[10px] text-slate-400 uppercase">{item.unit}</span></td><td className="px-6 py-4"><div><div className="flex items-center gap-2"><span className={`px-3 py-1 rounded-full text-xs font-black border ${expiryModalTab === 'expired' ? 'bg-red-600 text-white border-red-700' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{item.expiryDateBs || 'N/A'}</span><span className="text-[10px] text-slate-400 font-mono no-print">({item.expiryDateAd})</span></div></div></td></tr>
                                    ))}</tbody>
                                </table>
                            )}
                            <div className="hidden print:grid grid-cols-2 gap-20 mt-16 p-8 text-sm"><div className="text-center"><div className="border-t border-slate-800 pt-1">तयार गर्ने</div></div><div className="text-center"><div className="border-t border-slate-800 pt-1">स्वीकृत गर्ने</div></div></div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 no-print"><button onClick={() => setShowExpiryModal(false)} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-all">बन्द गर्नुहोस्</button><button onClick={() => window.print()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"><Printer size={16} /> विवरण प्रिन्ट गर्नुहोस्</button></div>
                    </div>
                </div>
            )}
        </div>
      );
      case 'general_setting': return <GeneralSetting settings={generalSettings} onUpdateSettings={onUpdateGeneralSettings} />;
      case 'user_management': return <UserManagement currentUser={currentUser} users={users} onAddUser={onAddUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />;
      case 'change_password': return <ChangePassword currentUser={currentUser} users={users} onChangePassword={onChangePassword} />;
      case 'store_setup': return <StoreSetup currentFiscalYear={currentFiscalYear} stores={stores} onAddStore={onAddStore} onUpdateStore={onUpdateStore} onDeleteStore={onDeleteStore} inventoryItems={inventoryItems} onUpdateInventoryItem={onUpdateInventoryItem} />;
      case 'tb_leprosy': return <TBPatientRegistration currentFiscalYear={currentFiscalYear} currentUser={currentUser} patients={tbPatients} onAddPatient={onAddTBPatient} onUpdatePatient={onUpdateTBPatient} onDeletePatient={onDeleteTBPatient} />;
      case 'rabies': return <RabiesRegistration currentFiscalYear={currentFiscalYear} patients={rabiesPatients} onAddPatient={onAddRabiesPatient} onUpdatePatient={onUpdateRabiesPatient} onDeletePatient={onDeletePatient} currentUser={currentUser} />;
      case 'mag_faram': return <MagFaram currentFiscalYear={currentFiscalYear} currentUser={currentUser} existingForms={magForms} onSave={onSaveMagForm} inventoryItems={inventoryItems} stores={stores} generalSettings={generalSettings} allUsers={users} issueReports={issueReports} />;
      case 'kharid_adesh': return <KharidAdesh orders={purchaseOrders} currentFiscalYear={currentFiscalYear} onSave={onUpdatePurchaseOrder} currentUser={currentUser} firms={firms} quotations={quotations} onDakhilaClick={handleDakhilaFromPo} generalSettings={generalSettings} />;
      case 'nikasha_pratibedan': return <NikashaPratibedan reports={issueReports} onSave={onUpdateIssueReport} currentUser={currentUser} currentFiscalYear={currentFiscalYear} generalSettings={generalSettings} />;
      case 'jinshi_maujdat': return <JinshiMaujdat currentFiscalYear={currentFiscalYear} currentUser={currentUser} inventoryItems={inventoryItems} onAddInventoryItem={onAddInventoryItem} onUpdateInventoryItem={onUpdateInventoryItem} stores={stores} onRequestStockEntry={onRequestStockEntry} pendingPoDakhila={pendingPoDakhila} onClearPendingPoDakhila={() => setPendingPoDakhila(null)} />;
      case 'stock_entry_approval': return <StockEntryApproval requests={stockEntryRequests} currentUser={currentUser} onApprove={onApproveStockEntry} onReject={onRejectStockEntry} stores={stores} />;
      case 'dakhila_pratibedan': return <DakhilaPratibedan dakhilaReports={dakhilaReports} onSaveDakhilaReport={onSaveDakhilaReport} currentFiscalYear={currentFiscalYear} currentUser={currentUser} stockEntryRequests={stockEntryRequests} inventoryItems={inventoryItems} onApproveStockEntry={onApproveStockEntry} onReject={onRejectStockEntry} generalSettings={generalSettings} stores={stores} />;
      case 'jinshi_khata': return <JinshiKhata currentFiscalYear={currentFiscalYear} inventoryItems={inventoryItems} issueReports={issueReports} dakhilaReports={dakhilaReports} stockEntryRequests={stockEntryRequests} returnEntries={returnEntries} generalSettings={generalSettings} />;
      case 'database_management': return <DatabaseManagement currentUser={currentUser} users={users} inventoryItems={inventoryItems} magForms={magForms} purchaseOrders={purchaseOrders} issueReports={issueReports} rabiesPatients={rabiesPatients} firms={firms} stores={stores} onClearData={onClearData} />;
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
                  <button onClick={() => handleMenuClick(item)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeItem === item.id ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><div className="flex items-center gap-3">{item.icon}<span className="font-medium font-nepali text-sm">{item.label}</span></div>{item.subItems && (expandedMenu === item.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}</button>
                  {item.subItems && expandedMenu === item.id && (
                      <div className="mt-1 ml-4 pl-3 border-l border-slate-800 space-y-1">
                          {item.subItems.map((sub: any) => (
                              <button key={sub.id} onClick={() => handleSubItemClick(sub.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-nepali ${activeItem === sub.id ? 'bg-slate-800 text-primary-300' : 'text-slate-500 hover:text-slate-200'}`}><div className="flex items-center gap-2">{sub.icon}<span>{sub.label}</span></div>{sub.badgeCount !== undefined && sub.badgeCount > 0 && <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">{sub.badgeCount}</span>}</button>
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
    </div>
  );
};
