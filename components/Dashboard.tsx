
import React, { useState, useMemo } from 'react';
import { 
  LogOut, Menu, Calendar, Stethoscope, Package, FileText, Settings, LayoutDashboard, 
  ChevronDown, ChevronRight, Syringe, Activity, 
  ClipboardList, FileSpreadsheet, FilePlus, ShoppingCart, FileOutput, 
  BookOpen, Book, Archive, RotateCcw, Wrench, Scroll, BarChart3,
  Sliders, Store, ShieldCheck, Users, Database, KeyRound, UserCog, Lock, Warehouse, ClipboardCheck, Bell, X, CheckCircle2, ArrowRightCircle, AlertTriangle, Pill, Scissors, Clock, Calculator, Trash2, UsersRound, TrendingUp, Info, PieChart
} from 'lucide-react';
import { APP_NAME, ORG_NAME, FISCAL_YEARS } from '../constants';
import { DashboardProps, PurchaseOrderEntry, InventoryItem } from '../types'; 
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
  const [expandedSubMenu, setExpandedSubMenu] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string>('dashboard');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [pendingPoDakhila, setPendingPoDakhila] = useState<PurchaseOrderEntry | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
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

  // Dashboard Statistics Calculation
  const stats = useMemo(() => {
    const today = new NepaliDate();
    const todayStr = today.format('YYYY-MM-DD'); 
    const todayAd = new Date().toISOString().split('T')[0];
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    
    const todayRabies = rabiesPatients.filter(p => p.regDateBs === todayStr).length;
    const todayScheduled = rabiesPatients.filter(p => p.schedule.some(dose => dose.date === todayAd)).length;
    const todayCompleted = rabiesPatients.filter(p => p.schedule.some(dose => dose.date === todayAd && dose.status === 'Given')).length;
    const todayPending = todayScheduled - todayCompleted;
    const totalDosesExpendedToday = (todayRabies + todayCompleted) * 2;

    const futureDailyDoses: Record<string, number> = {};
    let totalPendingFutureFollowups = 0;
    rabiesPatients.forEach(patient => {
        patient.schedule.forEach(dose => {
            if (dose.status === 'Pending') {
                totalPendingFutureFollowups++;
                const dateKey = dose.date;
                futureDailyDoses[dateKey] = (futureDailyDoses[dateKey] || 0) + 2; 
            }
        });
    });
    
    const totalFutureDosesNeeded = totalPendingFutureFollowups * 2;
    let totalFutureVials1ml = 0;
    let totalFutureVials05ml = 0;
    Object.keys(futureDailyDoses).forEach(date => {
        const dailyDoses = futureDailyDoses[date];
        totalFutureVials1ml += Math.ceil(dailyDoses / 10);
        totalFutureVials05ml += Math.ceil(dailyDoses / 5);
    });

    const monthlyRabies = rabiesPatients.filter(p => p.fiscalYear === currentFiscalYear && p.regMonth === currentMonth).length;

    return { 
      todayRabies, todayScheduled, todayCompleted, todayPending, totalDosesExpendedToday,
      totalPendingFutureFollowups, totalFutureDosesNeeded, futureVials1ml: totalFutureVials1ml,
      futureVials05ml: totalFutureVials05ml, monthlyRabies, totalInventory: inventoryItems.length, 
      pendingMagForms: magForms.filter(f => f.status === 'Pending').length, 
      pendingStockReq: stockEntryRequests.filter(r => r.status === 'Pending').length 
    };
  }, [rabiesPatients, currentFiscalYear, inventoryItems, magForms, stockEntryRequests]);

  interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    subItems?: MenuItem[];
    badgeCount?: number; 
  }

  const pendingStockRequestsCount = stockEntryRequests.filter(r => r.status === 'Pending').length;
  
  const magFaramBadgeCount = useMemo(() => {
      if (currentUser.role === 'STOREKEEPER') return magForms.filter(f => f.status === 'Pending').length;
      if (['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role)) return magForms.filter(f => f.status === 'Verified').length;
      return 0;
  }, [magForms, currentUser.role]);

  const allMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'ड्यासबोर्ड (Dashboard)', icon: <LayoutDashboard size={20} /> },
    { id: 'services', label: 'सेवा (Services)', icon: <Stethoscope size={20} />, subItems: [{ id: 'tb_leprosy', label: 'क्षयरोग/कुष्ठरोग (TB/Leprosy)', icon: <Activity size={16} /> }, { id: 'rabies', label: 'रेबिज खोप क्लिनिक (Rabies Vaccine)', icon: <Syringe size={16} /> }] },
    { id: 'inventory', label: 'जिन्सी व्यवस्थापन (Inventory)', icon: <Package size={20} />, subItems: [ { id: 'stock_entry_approval', label: 'स्टक प्रविष्टि अनुरोध (Stock Requests)', icon: <ClipboardCheck size={16} />, badgeCount: pendingStockRequestsCount }, { id: 'jinshi_maujdat', label: 'जिन्सी मौज्दात (Inventory Stock)', icon: <Warehouse size={16} /> }, { id: 'form_suchikaran', label: 'फर्म सुचीकरण (Firm Listing)', icon: <ClipboardList size={16} /> }, { id: 'quotation', label: 'सामानको कोटेशन (Quotation)', icon: <FileSpreadsheet size={16} /> }, { id: 'mag_faram', label: 'माग फारम (Demand Form)', icon: <FilePlus size={16} />, badgeCount: magFaramBadgeCount }, { id: 'kharid_adesh', label: 'खरिद आदेश (Purchase Order)', icon: <ShoppingCart size={16} /> }, { id: 'nikasha_pratibedan', label: 'निकासा प्रतिवेदन (Issue Report)', icon: <FileOutput size={16} /> }, { id: 'sahayak_jinshi_khata', label: 'सहायक जिन्सी खाता (Sub. Ledger)', icon: <BookOpen size={16} /> }, { id: 'jinshi_khata', label: 'जिन्सी खाता (Inventory Ledger)', icon: <Book size={16} /> }, { id: 'dakhila_pratibedan', label: 'दाखिला प्रतिवेदन (Entry Report)', icon: <Archive size={16} /> }, { id: 'jinshi_firta_khata', label: 'जिन्सी फिर्ता खाता (Return Ledger)', icon: <RotateCcw size={16} /> }, { id: 'marmat_adesh', label: 'मर्मत आवेदन/आदेश (Maintenance)', icon: <Wrench size={16} /> }, { id: 'dhuliyauna_faram', label: 'लिलाम / धुल्याउने (Disposal)', icon: <Trash2 size={16} /> }, { id: 'log_book', label: 'लग बुक (Log Book)', icon: <Scroll size={16} /> }] },
    { id: 'report', label: 'रिपोर्ट (Report)', icon: <FileText size={20} />, subItems: [{ id: 'report_tb_leprosy', label: 'क्षयरोग/कुष्ठरोग रिपोर्ट (TB/Leprosy)', icon: <Activity size={16} /> }, { id: 'report_rabies', label: 'रेबिज रिपोर्ट (Rabies Report)', icon: <Syringe size={16} /> }, { id: 'report_inventory_monthly', label: 'जिन्सी मासिक प्रतिवेदन (Monthly Report)', icon: <BarChart3 size={16} /> }] },
    { id: 'settings', label: 'सेटिङ र सुरक्षा (Settings & Security)', icon: <Settings size={20} />, subItems: [
        { id: 'general_setting', label: 'सामान्य सेटिङ (General Setting)', icon: <Sliders size={16} /> }, 
        { id: 'store_setup', label: 'स्टोर सेटअप (Store Setup)', icon: <Store size={16} /> }, 
        { id: 'user_management', label: 'प्रयोगकर्ता सेटअप (User Setup)', icon: <Users size={16} /> }, 
        { id: 'change_password', label: 'पासवर्ड परिवर्तन (Change Password)', icon: <KeyRound size={16} /> }, 
        { id: 'database_management', label: 'डाटाबेस व्यवस्थापन (Database Management)', icon: <Database size={16} /> }
    ] }
  ];

  const menuItems = useMemo(() => {
    const isSuperOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    const allowedMenus = currentUser.allowedMenus || [];

    return allMenuItems.reduce<MenuItem[]>((acc, item) => {
        // Dashboard and Settings are always processed
        if (item.id === 'dashboard') { acc.push(item); return acc; }
        
        if (item.id === 'settings') {
            // Filter subItems for settings specifically
            const filteredSubItems = item.subItems?.filter(sub => {
                // Change Password must be visible for everyone
                if (sub.id === 'change_password') return true;
                // Other settings only for Admin/Super Admin unless explicitly allowed
                if (isSuperOrAdmin) return true;
                return allowedMenus.includes(sub.id);
            });
            
            if (filteredSubItems && filteredSubItems.length > 0) {
                acc.push({ ...item, subItems: filteredSubItems });
            }
            return acc;
        }

        // For Super Admin / Admin, show everything else too
        if (isSuperOrAdmin) { acc.push(item); return acc; }

        // For Staff, filter by permissions
        const isParentAllowed = allowedMenus.includes(item.id);
        let filteredSubItems: MenuItem[] = [];
        if (item.subItems) {
            filteredSubItems = item.subItems.filter(subItem => allowedMenus.includes(subItem.id));
        }
        
        if (isParentAllowed || filteredSubItems.length > 0) {
            acc.push({ ...item, subItems: filteredSubItems.length > 0 ? filteredSubItems : undefined });
        }
        return acc;
    }, []);
  }, [currentUser, allMenuItems]);

  const handleMenuClick = (item: MenuItem) => {
    if (item.subItems) setExpandedMenu(expandedMenu === item.id ? null : item.id);
    else { setActiveItem(item.id); setExpandedMenu(null); setIsSidebarOpen(false); }
  };

  const handleSubItemClick = (subItemId: string) => { setActiveItem(subItemId); setIsSidebarOpen(false); };
  const handleDakhilaFromPo = (po: PurchaseOrderEntry) => { setPendingPoDakhila(po); setActiveItem('jinshi_maujdat'); };

  const renderContent = () => {
    switch (activeItem) {
      case 'general_setting': return <GeneralSetting settings={generalSettings} onUpdateSettings={onUpdateGeneralSettings} />;
      case 'dashboard': return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
                <div className="bg-primary-100 p-2 rounded-lg text-primary-600"><LayoutDashboard size={24} /></div>
                <div><h2 className="text-xl font-bold text-slate-800 font-nepali">मुख्य जानकारी (Dashboard Overview)</h2><p className="text-sm text-slate-500">संस्थाको हालको अवस्था र मुख्य तथ्याङ्कहरू</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4"><div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Syringe size={24} /></div><span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full uppercase">Today's Progress</span></div>
                    <div className="space-y-3"><div className="flex justify-between items-end"><div><h3 className="text-3xl font-black text-slate-800">{stats.todayRabies}</h3><p className="text-xs font-bold text-slate-400 font-nepali uppercase tracking-wider">नयाँ दर्ता (New)</p></div><div className="text-right"><span className="text-lg font-black text-green-600">{stats.todayCompleted}</span><span className="text-slate-300 mx-1">/</span><span className="text-sm font-bold text-slate-500">{stats.todayScheduled}</span><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">फलोअप (Followups)</p></div></div><div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${stats.todayScheduled > 0 ? (stats.todayCompleted / stats.todayScheduled) * 100 : 0}%` }}></div></div><div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight"><div className="flex flex-col"><span className="text-green-600">लगाएका: {stats.todayCompleted}</span><span className="text-orange-500 text-[8px]">बाँकी: {stats.todayPending}</span></div><div className="text-right bg-indigo-50 px-2 py-1 rounded border border-indigo-100"><span className="text-indigo-700 block">आज खर्च: <span className="font-black">{stats.totalDosesExpendedToday}</span> <span className="text-[8px]">Doses</span></span></div></div></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-12 -mt-12 opacity-50"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10"><div className="bg-rose-50 p-3 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors"><TrendingUp size={24} /></div><span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded-full uppercase">Future Forecast</span></div>
                    <div className="space-y-4 relative z-10"><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.totalFutureDosesNeeded} <span className="text-sm font-medium text-slate-400">Doses</span></h3><p className="text-xs font-bold text-slate-500 font-nepali">कुल भविष्यको खोप आवश्यकता</p></div><div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-3"><div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px] font-nepali uppercase"><Clock size={14} className="text-rose-500" /> भाइल स्टक अनुमान</div><div className="grid grid-cols-2 gap-4"><div className="border-r border-rose-200 pr-2"><p className="text-xl font-black text-rose-600">{stats.futureVials1ml}</p><p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">1ml Vials</p></div><div className="pl-2"><p className="text-xl font-black text-rose-600">{stats.futureVials05ml}</p><p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">0.5ml Vials</p></div></div></div></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4"><div className="bg-orange-50 p-3 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors"><FilePlus size={24} /></div><span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-full uppercase">Pending</span></div>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">{stats.pendingMagForms}</h3><p className="text-sm font-bold text-slate-500 font-nepali">बाँकी माग फारम (Mag Forms)</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4"><div className="bg-teal-50 p-3 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors"><ClipboardCheck size={24} /></div><span className="text-[10px] font-bold bg-teal-50 text-teal-600 px-2 py-1 rounded-full uppercase">To Approve</span></div>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">{stats.pendingStockReq}</h3><p className="text-sm font-bold text-slate-500 font-nepali">स्टक दाखिला अनुरोध (Entries)</p>
                </div>
            </div>
            <div className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-[2rem] p-10 text-white shadow-xl shadow-primary-900/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl text-center md:text-left"><h2 className="text-3xl font-black font-nepali mb-3">नमस्ते, {currentUser.fullName}!</h2><p className="text-primary-100 text-lg font-medium opacity-90 leading-relaxed">स्मार्ट जिन्सी व्यवस्थापन प्रणालीमा तपाईंलाई स्वागत छ। <br className="hidden md:block" /> बायाँतर्फको मेनुबाट कार्य छनोट गरी सुरु गर्नुहोस्।</p></div>
                    <div className="hidden lg:block"><div className="bg-white/10 p-8 rounded-[2.5rem] backdrop-blur-md border border-white/20 shadow-inner"><PieChart size={120} className="text-white opacity-80" /></div></div>
                </div>
            </div>
        </div>
      );
      case 'user_management': return <UserManagement currentUser={currentUser} users={users} onAddUser={onAddUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />;
      case 'change_password': return <ChangePassword currentUser={currentUser} users={users} onChangePassword={onChangePassword} />;
      case 'store_setup': return <StoreSetup currentFiscalYear={currentFiscalYear} stores={stores} onAddStore={onAddStore} onUpdateStore={onUpdateStore} onDeleteStore={onDeleteStore} inventoryItems={inventoryItems} onUpdateInventoryItem={onUpdateInventoryItem} />;
      case 'tb_leprosy': return <TBPatientRegistration currentFiscalYear={currentFiscalYear} currentUser={currentUser} patients={tbPatients} onAddPatient={onAddTBPatient} onUpdatePatient={onUpdateTBPatient} onDeletePatient={onDeleteTBPatient} />;
      case 'rabies': return <RabiesRegistration currentFiscalYear={currentFiscalYear} patients={rabiesPatients} onAddPatient={onAddRabiesPatient} onUpdatePatient={onUpdateRabiesPatient} onDeletePatient={onDeletePatient} currentUser={currentUser} />;
      case 'report_rabies': return <RabiesReport currentFiscalYear={currentFiscalYear} currentUser={currentUser} patients={rabiesPatients} />;
      case 'mag_faram': return <MagFaram currentFiscalYear={currentFiscalYear} currentUser={currentUser} existingForms={magForms} onSave={onSaveMagForm} inventoryItems={inventoryItems} stores={stores} generalSettings={generalSettings} allUsers={users} />;
      case 'kharid_adesh': return <KharidAdesh orders={purchaseOrders} currentFiscalYear={currentFiscalYear} onSave={onUpdatePurchaseOrder} currentUser={currentUser} firms={firms} quotations={quotations} onDakhilaClick={handleDakhilaFromPo} generalSettings={generalSettings} />;
      case 'nikasha_pratibedan': return <NikashaPratibedan reports={issueReports} onSave={onUpdateIssueReport} currentUser={currentUser} currentFiscalYear={currentFiscalYear} generalSettings={generalSettings} />;
      case 'form_suchikaran': return <FirmListing currentFiscalYear={currentFiscalYear} firms={firms} onAddFirm={onAddFirm} />;
      case 'quotation': return <Quotation currentFiscalYear={currentFiscalYear} firms={firms} quotations={quotations} onAddQuotation={onAddQuotation} inventoryItems={inventoryItems} />;
      case 'jinshi_maujdat': return <JinshiMaujdat currentFiscalYear={currentFiscalYear} currentUser={currentUser} inventoryItems={inventoryItems} onAddInventoryItem={onAddInventoryItem} onUpdateInventoryItem={onUpdateInventoryItem} stores={stores} onRequestStockEntry={onRequestStockEntry} pendingPoDakhila={pendingPoDakhila} onClearPendingPoDakhila={() => setPendingPoDakhila(null)} />;
      case 'stock_entry_approval': return <StockEntryApproval requests={stockEntryRequests} currentUser={currentUser} onApprove={onApproveStockEntry} onReject={onRejectStockEntry} stores={stores} />;
      case 'dakhila_pratibedan': return <DakhilaPratibedan dakhilaReports={dakhilaReports} onSaveDakhilaReport={onSaveDakhilaReport} currentFiscalYear={currentFiscalYear} currentUser={currentUser} stockEntryRequests={stockEntryRequests} inventoryItems={inventoryItems} onApproveStockEntry={onApproveStockEntry} onReject={onRejectStockEntry} generalSettings={generalSettings} stores={stores} />;
      case 'sahayak_jinshi_khata': return <SahayakJinshiKhata currentFiscalYear={currentFiscalYear} currentUser={currentUser} inventoryItems={inventoryItems} issueReports={issueReports} dakhilaReports={dakhilaReports} stockEntryRequests={stockEntryRequests} users={users} returnEntries={returnEntries} generalSettings={generalSettings} />;
      case 'jinshi_khata': return <JinshiKhata currentFiscalYear={currentFiscalYear} inventoryItems={inventoryItems} issueReports={issueReports} dakhilaReports={dakhilaReports} stockEntryRequests={stockEntryRequests} returnEntries={returnEntries} generalSettings={generalSettings} />;
      case 'jinshi_firta_khata': return <JinshiFirtaFaram currentFiscalYear={currentFiscalYear} currentUser={currentUser} inventoryItems={inventoryItems} returnEntries={returnEntries} onSaveReturnEntry={onSaveReturnEntry} issueReports={issueReports} generalSettings={generalSettings} />;
      case 'marmat_adesh': return <MarmatAdesh currentFiscalYear={currentFiscalYear} currentUser={currentUser} marmatEntries={marmatEntries} onSaveMarmatEntry={onSaveMarmatEntry} inventoryItems={inventoryItems} generalSettings={generalSettings} />;
      case 'dhuliyauna_faram': return <DhuliyaunaFaram currentFiscalYear={currentFiscalYear} currentUser={currentUser} inventoryItems={inventoryItems} dhuliyaunaEntries={dhuliyaunaEntries} onSaveDhuliyaunaEntry={onSaveDhuliyaunaEntry} stores={stores} />;
      case 'log_book': return <LogBook currentUser={currentUser} currentFiscalYear={currentFiscalYear} inventoryItems={inventoryItems} logBookEntries={logBookEntries} onAddLogEntry={onSaveLogBookEntry} />;
      case 'report_inventory_monthly': return <InventoryMonthlyReport currentFiscalYear={currentFiscalYear} currentUser={currentUser} inventoryItems={inventoryItems} stores={stores} magForms={magForms} onSaveMagForm={onSaveMagForm} generalSettings={generalSettings} />;
      case 'database_management': return <DatabaseManagement currentUser={currentUser} users={users} inventoryItems={inventoryItems} magForms={magForms} purchaseOrders={purchaseOrders} issueReports={issueReports} rabiesPatients={rabiesPatients} firms={firms} stores={stores} onClearData={onClearData} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300 no-print" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed md:relative z-30 h-full bg-slate-900 text-white flex flex-col shadow-xl transition-all duration-300 ease-in-out no-print ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-0 md:translate-x-0 md:overflow-hidden'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950 shrink-0"><div className="bg-primary-600 p-2 rounded-lg"><Activity size={20} className="text-white" /></div><div className={`transition-opacity duration-300 ${isSidebarOpen || (window.innerWidth < 768) ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}><h2 className="font-nepali font-bold text-lg leading-tight">{APP_NAME}</h2><p className="text-xs text-slate-400 font-nepali">{currentUser.organizationName || ORG_NAME}</p></div></div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
             {menuItems.map((item) => (
               <div key={item.id}>
                  <button onClick={() => handleMenuClick(item)} className={`w-full flex items-start justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${activeItem === item.id ? 'bg-primary-600 text-white shadow-lg' : (expandedMenu === item.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800')}`}><div className="flex items-start gap-3"><div className={`mt-0.5 ${activeItem === item.id ? 'text-white' : 'group-hover:text-primary-400'}`}>{item.icon}</div><span className="font-medium font-nepali text-left leading-snug">{item.label}</span></div>{item.subItems && <div className="text-slate-500 mt-1">{expandedMenu === item.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</div>}</button>
                  {item.subItems && expandedMenu === item.id && (<div className="mt-1 ml-4 pl-3 border-l border-slate-700 space-y-1">{item.subItems.map((subItem) => (<div key={subItem.id}><button onClick={() => handleSubItemClick(subItem.id)} className={`w-full flex items-start justify-between px-4 py-2.5 rounded-lg text-sm transition-colors ${activeItem === subItem.id ? 'bg-slate-800 text-primary-300 font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}><div className="flex items-start gap-2"><div className="mt-0.5">{subItem.icon}</div><span className="font-nepali text-left leading-normal">{subItem.label}</span></div><div className="flex items-center gap-2 mt-0.5">{subItem.badgeCount !== undefined && subItem.badgeCount > 0 && (<span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">{subItem.badgeCount}</span>)}</div></button></div>))}</div>)}
               </div>
             ))}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0"><button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full rounded-xl transition-all duration-200 group"><LogOut size={18} /><span className="font-medium">लगआउट (Logout)</span></button></div>
      </aside>
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative print:h-auto print:overflow-visible">
        <header className="bg-white border-b border-slate-200 p-4 flex md:hidden items-center justify-between shadow-sm z-10 shrink-0 no-print">
            <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="bg-primary-600 p-1.5 rounded-md hover:bg-primary-700 transition-colors"><Menu size={18} className="text-white" /></button><span className="font-bold text-slate-700 font-nepali">{APP_NAME}</span></div>
            <div className="flex items-center gap-4">{latestApprovedDakhila && (<button onClick={handleNotificationClick} className={`relative p-1 transition-colors ${latestApprovedDakhila ? 'text-slate-600 hover:text-slate-800' : 'text-slate-300'}`}><Bell size={20} />{latestApprovedDakhila.id !== lastSeenNotificationId && (<span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>)}</button>)}<button onClick={onLogout} className="text-slate-500 hover:text-red-500"><LogOut size={20} /></button></div>
        </header>
        <div className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 justify-between items-center shadow-sm z-10 shrink-0 no-print">
            <div className="flex items-center gap-4"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"><Menu size={24} /></button><h2 className="text-lg font-semibold text-slate-700">ड्यासबोर्ड (Dashboard)</h2><div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-sm font-medium"><Calendar size={14} /><span className="font-nepali">आ.व. {fiscalYearLabel}</span></div></div>
            <div className="flex items-center gap-6"><div className="relative"><button onClick={handleNotificationClick} className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${latestApprovedDakhila ? 'text-slate-600' : 'text-slate-300 cursor-not-allowed'}`} disabled={!latestApprovedDakhila}><Bell size={22} />{latestApprovedDakhila && latestApprovedDakhila.id !== lastSeenNotificationId && (<span className="absolute top-1.5 right-2 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>)}</button></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-sm font-bold text-slate-800">{currentUser.username}</p><p className="text-xs text-slate-500">{currentUser.role}</p></div><div className="w-10 h-10 bg-primary-100 border-2 border-primary-200 text-primary-700 rounded-full flex items-center justify-center font-bold shadow-sm uppercase">{currentUser.username.charAt(0)}</div></div></div>
        </div>
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-4 md:p-6 relative scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent print:p-0 print:bg-white print:h-auto print:overflow-visible">
             {renderContent()}
        </main>
      </div>
    </div>
  );
};
