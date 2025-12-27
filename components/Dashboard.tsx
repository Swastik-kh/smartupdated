
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

  const stats = useMemo(() => {
    const today = new NepaliDate();
    const todayStr = today.format('YYYY-MM-DD'); 
    const todayAd = new Date().toISOString().split('T')[0];
    
    const todayRabies = rabiesPatients.filter(p => p.regDateBs === todayStr).length;
    const todayScheduled = rabiesPatients.filter(p => p.schedule.some(dose => dose.date === todayAd)).length;
    const todayCompleted = rabiesPatients.filter(p => p.schedule.some(dose => dose.date === todayAd && dose.status === 'Given')).length;
    
    let totalFutureDosesNeeded = 0;
    rabiesPatients.forEach(patient => {
        patient.schedule.forEach(dose => {
            if (dose.status === 'Pending') totalFutureDosesNeeded++;
        });
    });

    return { 
      todayRabies, 
      totalFutureDosesNeeded: totalFutureDosesNeeded, 
      totalInventory: inventoryItems.length, 
      pendingMagForms: magForms.filter(f => f.status === 'Pending').length, 
      pendingStockReq: stockEntryRequests.filter(r => r.status === 'Pending').length 
    };
  }, [rabiesPatients, inventoryItems, magForms, stockEntryRequests]);

  const pendingStockRequestsCount = stockEntryRequests.filter(r => r.status === 'Pending').length;
  const magFaramBadgeCount = useMemo(() => {
      if (currentUser.role === 'STOREKEEPER') return magForms.filter(f => f.status === 'Pending').length;
      if (['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role)) return magForms.filter(f => f.status === 'Verified').length;
      return 0;
  }, [magForms, currentUser.role]);

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
            { id: 'kharid_adesh', label: 'खरिद आदेश', icon: <ShoppingCart size={16} /> }, 
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
  }, [currentUser, pendingStockRequestsCount, magFaramBadgeCount]);

  const handleMenuClick = (item: any) => {
    if (item.subItems) setExpandedMenu(expandedMenu === item.id ? null : item.id);
    else { setActiveItem(item.id); setIsSidebarOpen(false); }
  };

  const handleSubItemClick = (subItemId: string) => { setActiveItem(subItemId); setIsSidebarOpen(false); };
  const handleDakhilaFromPo = (po: PurchaseOrderEntry) => { setPendingPoDakhila(po); setActiveItem('jinshi_maujdat'); };

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard': return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-4">
                <div className="bg-primary-100 p-2 rounded-lg text-primary-600"><LayoutDashboard size={24} /></div>
                <div><h2 className="text-xl font-bold text-slate-800 font-nepali">मुख्य ड्यासबोर्ड</h2><p className="text-xs text-slate-500 font-medium font-nepali">हालको अवस्था र तथ्याङ्क</p></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat Card 1: Today Rabies */}
                <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">{stats.todayRabies}</h3>
                            <p className="text-[11px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">आजको रेबिज दर्ता</p>
                        </div>
                        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Syringe size={20} />
                        </div>
                    </div>
                </div>

                {/* Stat Card 2: Future Doses */}
                <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">{stats.totalFutureDosesNeeded}</h3>
                            <p className="text-[11px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">बाँकी खोप डोजहरू</p>
                        </div>
                        <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                            <Clock size={20} />
                        </div>
                    </div>
                </div>

                {/* Stat Card 3: Pending Mag Form */}
                <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">{stats.pendingMagForms}</h3>
                            <p className="text-[11px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">बाँकी माग फारम</p>
                        </div>
                        <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <FilePlus size={20} />
                        </div>
                    </div>
                </div>

                {/* Stat Card 4: Pending Stock Req */}
                <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">{stats.pendingStockReq}</h3>
                            <p className="text-[11px] font-bold text-slate-400 font-nepali uppercase tracking-wider mt-1">स्टक दाखिला अनुरोध</p>
                        </div>
                        <div className="bg-teal-50 p-2.5 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <Warehouse size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black font-nepali mb-2">नमस्ते, {currentUser.fullName}!</h2>
                    <p className="text-primary-100 font-medium opacity-90 text-sm">स्मार्ट जिन्सी व्यवस्थापन प्रणालीमा तपाईंलाई स्वागत छ।</p>
                </div>
            </div>
        </div>
      );
      case 'general_setting': return <GeneralSetting settings={generalSettings} onUpdateSettings={onUpdateGeneralSettings} />;
      case 'user_management': return <UserManagement currentUser={currentUser} users={users} onAddUser={onAddUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />;
      case 'change_password': return <ChangePassword currentUser={currentUser} users={users} onChangePassword={onChangePassword} />;
      case 'store_setup': return <StoreSetup currentFiscalYear={currentFiscalYear} stores={stores} onAddStore={onAddStore} onUpdateStore={onUpdateStore} onDeleteStore={onDeleteStore} inventoryItems={inventoryItems} onUpdateInventoryItem={onUpdateInventoryItem} />;
      case 'tb_leprosy': return <TBPatientRegistration currentFiscalYear={currentFiscalYear} currentUser={currentUser} patients={tbPatients} onAddPatient={onAddTBPatient} onUpdatePatient={onUpdateTBPatient} onDeletePatient={onDeleteTBPatient} />;
      case 'rabies': return <RabiesRegistration currentFiscalYear={currentFiscalYear} patients={rabiesPatients} onAddPatient={onAddRabiesPatient} onUpdatePatient={onUpdateRabiesPatient} onDeletePatient={onDeletePatient} currentUser={currentUser} />;
      case 'mag_faram': return <MagFaram currentFiscalYear={currentFiscalYear} currentUser={currentUser} existingForms={magForms} onSave={onSaveMagForm} inventoryItems={inventoryItems} stores={stores} generalSettings={generalSettings} allUsers={users} />;
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
      {/* Backdrop for all screen sizes when menu is open */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" 
            onClick={() => setIsSidebarOpen(false)} 
        />
      )}
      
      {/* Sidebar: Starts hidden on both Mobile and PC (-translate-x-full) */}
      <aside className={`fixed z-[110] h-full bg-slate-900 text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out no-print 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-[280px]`}>
        
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950 shrink-0">
            <div className="bg-primary-600 p-2 rounded-lg"><Activity size={20} className="text-white" /></div>
            <div className="overflow-hidden">
                <h2 className="font-nepali font-bold text-lg leading-tight truncate">{APP_NAME}</h2>
                <p className="text-[10px] text-slate-400 font-nepali truncate">{currentUser.organizationName}</p>
            </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 custom-scrollbar">
             {menuItems.map((item: any) => (
               <div key={item.id}>
                  <button onClick={() => handleMenuClick(item)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeItem === item.id ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                      <div className="flex items-center gap-3">{item.icon}<span className="font-medium font-nepali text-sm">{item.label}</span></div>
                      {item.subItems && (expandedMenu === item.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                  </button>
                  {item.subItems && expandedMenu === item.id && (
                      <div className="mt-1 ml-4 pl-3 border-l border-slate-800 space-y-1">
                          {item.subItems.map((sub: any) => (
                              <button key={sub.id} onClick={() => handleSubItemClick(sub.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-nepali ${activeItem === sub.id ? 'bg-slate-800 text-primary-300' : 'text-slate-500 hover:text-slate-200'}`}>
                                  <div className="flex items-center gap-2">{sub.icon}<span>{sub.label}</span></div>
                                  {sub.badgeCount !== undefined && sub.badgeCount > 0 && <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">{sub.badgeCount}</span>}
                              </button>
                          ))}
                      </div>
                  )}
               </div>
             ))}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
            <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 w-full rounded-xl transition-all font-bold font-nepali text-sm"><LogOut size={18} /> लगआउट</button>
        </div>
      </aside>

      {/* Main Container: Full width since sidebar is fixed/overlay */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm z-50 shrink-0 no-print">
            <div className="flex items-center gap-3">
                {/* Menu Button: Always visible to open the hidden menu */}
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <Menu size={20} />
                </button>
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-xs font-bold uppercase tracking-wider">
                    <Calendar size={12} /> {fiscalYearLabel}
                </div>
                <h2 className="font-bold text-slate-700 font-nepali truncate max-w-[150px] sm:max-w-none">{activeItem === 'dashboard' ? 'ड्यासबोर्ड' : 'कार्य क्षेत्र'}</h2>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={handleNotificationClick} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 relative">
                    <Bell size={20} />
                    {latestApprovedDakhila && latestApprovedDakhila.id !== lastSeenNotificationId && <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-slate-800">{currentUser.username}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{currentUser.role}</p>
                    </div>
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-xs shadow-sm uppercase">{currentUser.username.charAt(0)}</div>
                </div>
            </div>
        </header>

        <main className="flex-1 custom-scrollbar bg-slate-50/30 p-4 md:p-6">
             <div className="max-w-7xl mx-auto pb-20">
                {renderContent()}
             </div>
        </main>
      </div>
    </div>
  );
};