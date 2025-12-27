
import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { APP_NAME, ORG_NAME } from './constants';
import { ShieldCheck, Box } from 'lucide-react';
import { User, OrganizationSettings, MagFormEntry, RabiesPatient, PurchaseOrderEntry, IssueReportEntry, FirmEntry, QuotationEntry, InventoryItem, Store, StockEntryRequest, DakhilaPratibedanEntry, ReturnEntry, MarmatEntry, DhuliyaunaEntry, LogBookEntry, DakhilaItem, TBPatient, HafaEntry, HafaItem } from './types';
import { db } from './firebase';
import { ref, onValue, set, remove, update, get, Unsubscribe } from "firebase/database";
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

const INITIAL_SETTINGS: OrganizationSettings = {
    orgNameNepali: 'स्मार्ट इन्भेन्टरी प्रणाली',
    orgNameEnglish: 'Smart Inventory System',
    subTitleNepali: 'जिन्सी व्यवस्थापन शाखा',
    subTitleNepali2: 'नगरकार्यपालिकाको कार्यालय',
    subTitleNepali3: 'प्रदेश नं. १, नेपाल',
    address: 'बेल्टार, उदयपुर',
    phone: '०१-XXXXXXX',
    email: 'info@domain.com',
    website: 'www.domain.com',
    panNo: 'XXXXXXXXX',
    defaultVatRate: '13',
    activeFiscalYear: '2081/082',
    enableEnglishDate: 'no',
    logoUrl: ''
};

const DEFAULT_ADMIN: User = {
    id: 'superadmin',
    username: 'admin',
    password: 'admin',
    role: 'SUPER_ADMIN',
    organizationName: 'Smart Inventory HQ',
    fullName: 'Administrator',
    designation: 'System Manager',
    phoneNumber: '98XXXXXXXX',
    allowedMenus: ['dashboard', 'inventory', 'settings', 'general_setting', 'user_management', 'store_setup', 'database_management']
};

const STORAGE_KEY_USER = 'smart_inventory_active_user';
const STORAGE_KEY_FY = 'smart_inventory_active_fy';

const App: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [currentFiscalYear, setCurrentFiscalYear] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FY);
    return saved || '2081/082';
  });

  const [appDefaultFiscalYear, setAppDefaultFiscalYear] = useState<string>('2081/082');
  const [generalSettings, setGeneralSettings] = useState<OrganizationSettings>(INITIAL_SETTINGS);
  const [isDbConnected, setIsDbConnected] = useState(false);
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [magForms, setMagForms] = useState<MagFormEntry[]>([]);
  const [hafaEntries, setHafaEntries] = useState<HafaEntry[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderEntry[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReportEntry[]>([]);
  const [stockEntryRequests, setStockEntryRequests] = useState<StockEntryRequest[]>([]);
  const [dakhilaReports, setDakhilaReports] = useState<DakhilaPratibedanEntry[]>([]);
  const [returnEntries, setReturnEntries] = useState<ReturnEntry[]>([]);
  const [firms, setFirms] = useState<FirmEntry[]>([]);
  const [quotations, setQuotations] = useState<QuotationEntry[]>([]);
  const [rabiesPatients, setRabiesPatients] = useState<RabiesPatient[]>([]);
  const [tbPatients, setTbPatients] = useState<TBPatient[]>([]);
  const [marmatEntries, setMarmatEntries] = useState<MarmatEntry[]>([]);
  const [dhuliyaunaEntries, setDhuliyaunaEntries] = useState<DhuliyaunaEntry[]>([]);
  const [logBookEntries, setLogBookEntries] = useState<LogBookEntry[]>([]);

  useEffect(() => {
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => setIsDbConnected(snap.val() === true));

    const globalConfigRef = ref(db, 'appConfig/defaultFiscalYear');
    onValue(globalConfigRef, (snap) => {
        if (snap.exists()) {
            setAppDefaultFiscalYear(snap.val());
        }
    });

    const adminRef = ref(db, 'users/superadmin');
    get(adminRef).then((snapshot) => {
        if (!snapshot.exists()) {
            set(adminRef, DEFAULT_ADMIN);
        }
    });

    const usersRef = ref(db, 'users');
    const unsub = onValue(usersRef, (snap) => {
        const data = snap.val();
        const userList = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
        setAllUsers(userList.length > 0 ? userList : [DEFAULT_ADMIN]);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const safeOrgName = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
    const orgPath = `orgData/${safeOrgName}`;
    const unsubscribes: Unsubscribe[] = [];

    const setupOrgListener = (subPath: string, setter: Function) => {
        const unsub = onValue(ref(db, `${orgPath}/${subPath}`), (snap) => {
            const data = snap.val();
            setter(data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : []);
        });
        unsubscribes.push(unsub);
    };

    onValue(ref(db, `${orgPath}/settings`), (snap) => {
        if (snap.exists()) setGeneralSettings(snap.val());
        else {
            const firstSettings = { ...INITIAL_SETTINGS, orgNameNepali: currentUser.organizationName, orgNameEnglish: currentUser.organizationName };
            set(ref(db, `${orgPath}/settings`), firstSettings);
            setGeneralSettings(firstSettings);
        }
    });

    setupOrgListener('inventory', setInventoryItems);
    setupOrgListener('stores', setStores);
    setupOrgListener('magForms', setMagForms);
    setupOrgListener('hafaEntries', setHafaEntries);
    setupOrgListener('purchaseOrders', setPurchaseOrders);
    setupOrgListener('issueReports', setIssueReports);
    setupOrgListener('stockRequests', setStockEntryRequests);
    setupOrgListener('dakhilaReports', setDakhilaReports);
    setupOrgListener('returnEntries', setReturnEntries);
    setupOrgListener('firms', setFirms);
    setupOrgListener('quotations', setQuotations);
    setupOrgListener('tbPatients', setTbPatients);
    setupOrgListener('marmatEntries', setMarmatEntries);
    setupOrgListener('disposalEntries', setDhuliyaunaEntries);
    setupOrgListener('logBook', setLogBookEntries);

    if (currentUser.role === 'SUPER_ADMIN') {
        const allOrgRef = ref(db, 'orgData');
        const unsub = onValue(allOrgRef, (snap) => {
            const allData = snap.val() || {};
            const combinedRabies: RabiesPatient[] = [];
            const combinedInventory: InventoryItem[] = [];
            const combinedStores: Store[] = [];

            Object.keys(allData).forEach(orgKey => {
                const orgNameClean = orgKey.replace(/_/g, ' ');
                const orgRabies = allData[orgKey].rabiesPatients;
                if (orgRabies) {
                    Object.keys(orgRabies).forEach(pKey => {
                        combinedRabies.push({ ...orgRabies[pKey], id: pKey, orgName: orgNameClean });
                    });
                }
                const orgInv = allData[orgKey].inventory;
                if (orgInv) {
                    Object.keys(orgInv).forEach(iKey => {
                        combinedInventory.push({ ...orgInv[iKey], id: iKey, orgName: orgNameClean });
                    });
                }
                const orgStores = allData[orgKey].stores;
                if (orgStores) {
                    Object.keys(orgStores).forEach(sKey => {
                        combinedStores.push({ ...orgStores[sKey], id: sKey });
                    });
                }
            });
            setRabiesPatients(combinedRabies);
            setInventoryItems(combinedInventory);
            setStores(combinedStores);
        });
        unsubscribes.push(unsub);
    } else {
        setupOrgListener('rabiesPatients', setRabiesPatients);
    }

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser]);

  const handleLoginSuccess = (user: User, fiscalYear: string) => {
    setCurrentUser(user);
    setCurrentFiscalYear(fiscalYear);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_FY, fiscalYear);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_FY);
  };

  const getOrgRef = (subPath: string) => {
      const safeOrgName = currentUser?.organizationName.trim().replace(/[.#$[\]]/g, "_") || "unknown";
      return ref(db, `orgData/${safeOrgName}/${subPath}`);
  };

  const handleUpdateGeneralSettings = (s: OrganizationSettings) => {
      if (!currentUser) return;
      set(getOrgRef('settings'), s);
      if (currentUser.role === 'SUPER_ADMIN') {
          set(ref(db, 'appConfig/defaultFiscalYear'), s.activeFiscalYear);
      }
  };

  return (
    <>
      {currentUser ? (
        <Dashboard 
          onLogout={handleLogout} 
          currentUser={currentUser}
          currentFiscalYear={currentFiscalYear} 
          users={allUsers}
          onAddUser={(u) => set(ref(db, `users/${u.id}`), u)}
          onUpdateUser={(u) => set(ref(db, `users/${u.id}`), u)}
          onDeleteUser={(id) => remove(ref(db, `users/${id}`))}
          onChangePassword={(id, pass) => update(ref(db, `users/${id}`), { password: pass })}
          generalSettings={generalSettings}
          onUpdateGeneralSettings={handleUpdateGeneralSettings}
          magForms={magForms}
          onSaveMagForm={(f) => set(getOrgRef(`magForms/${f.id}`), f)}
          hafaEntries={hafaEntries}
          onSaveHafaEntry={(e) => set(getOrgRef(`hafaEntries/${e.id}`), e)}
          onDeleteHafaEntry={(id) => remove(getOrgRef(`hafaEntries/${id}`))}
          purchaseOrders={purchaseOrders}
          onUpdatePurchaseOrder={(o) => set(getOrgRef(`purchaseOrders/${o.id}`), o)}
          issueReports={issueReports}
          onUpdateIssueReport={(r) => set(getOrgRef(`issueReports/${r.id}`), r)}
          rabiesPatients={rabiesPatients}
          onAddRabiesPatient={async (p) => { await set(getOrgRef(`rabiesPatients/${p.id}`), p); }}
          onUpdateRabiesPatient={async (p) => { await set(getOrgRef(`rabiesPatients/${p.id}`), p); }}
          onDeletePatient={(id) => remove(getOrgRef(`rabiesPatients/${id}`))}
          tbPatients={tbPatients}
          onAddTBPatient={async (p) => { await set(getOrgRef(`tbPatients/${p.id}`), p); }}
          onUpdateTBPatient={async (p) => { await set(getOrgRef(`tbPatients/${p.id}`), p); }}
          onDeleteTBPatient={(id) => remove(getOrgRef(`tbPatients/${id}`))}
          firms={firms}
          onAddFirm={(f) => set(getOrgRef(`firms/${f.id}`), f)}
          quotations={quotations}
          onAddQuotation={(q) => set(getOrgRef(`quotations/${q.id}`), q)}
          inventoryItems={inventoryItems}
          onAddInventoryItem={(i) => set(getOrgRef(`inventory/${i.id}`), i)}
          onUpdateInventoryItem={(i) => set(getOrgRef(`inventory/${i.id}`), i)}
          stockEntryRequests={stockEntryRequests}
          onRequestStockEntry={(r) => set(getOrgRef(`stockRequests/${r.id}`), r)}
          onApproveStockEntry={() => {}} 
          onRejectStockEntry={() => {}}
          stores={stores}
          onAddStore={(s) => set(getOrgRef(`stores/${s.id}`), s)}
          onUpdateStore={(s) => set(getOrgRef(`stores/${s.id}`), s)}
          onDeleteStore={(id) => remove(getOrgRef(`stores/${id}`))}
          dakhilaReports={dakhilaReports}
          onSaveDakhilaReport={(r) => set(getOrgRef(`dakhilaReports/${r.id}`), r)}
          returnEntries={returnEntries}
          onSaveReturnEntry={(e) => set(getOrgRef(`returnEntries/${e.id}`), e)}
          marmatEntries={marmatEntries}
          onSaveMarmatEntry={(e) => set(getOrgRef(`marmatEntries/${e.id}`), e)}
          dhuliyaunaEntries={dhuliyaunaEntries}
          onSaveDhuliyaunaEntry={(e) => set(getOrgRef(`disposalEntries/${e.id}`), e)}
          logBookEntries={logBookEntries}
          onSaveLogBookEntry={(e) => set(getOrgRef(`logBook/${e.id}`), e)}
          onClearData={(p) => remove(getOrgRef(p))}
        />
      ) : (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-primary-600 p-10 text-center text-white">
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                    <Box size={32} />
                </div>
                <h1 className="text-3xl font-bold font-nepali tracking-tight">{APP_NAME}</h1>
                <p className="text-sm font-nepali text-primary-100 mt-1">जिन्सी व्यवस्थापन अब तपाइँको हातमा</p>
                <p className="text-primary-200 text-[10px] mt-2 uppercase font-bold tracking-widest opacity-60">Login Portal</p>
              </div>
              <div className="p-8">
                <LoginForm 
                    users={allUsers} 
                    onLoginSuccess={handleLoginSuccess} 
                    initialFiscalYear={appDefaultFiscalYear} 
                />
              </div>
              <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                 <div className="flex items-center justify-center gap-2 text-slate-400">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Protected Database | v2.0</span>
                 </div>
              </div>
            </div>
            <p className="text-center mt-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
                &copy; {new Date().getFullYear()} {APP_NAME}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
