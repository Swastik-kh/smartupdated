
import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { APP_NAME, ORG_NAME } from './constants';
import { Landmark, ShieldCheck } from 'lucide-react';
import { User, OrganizationSettings, MagFormEntry, RabiesPatient, PurchaseOrderEntry, IssueReportEntry, FirmEntry, QuotationEntry, InventoryItem, Store, StockEntryRequest, DakhilaPratibedanEntry, ReturnEntry, MarmatEntry, DhuliyaunaEntry, LogBookEntry, DakhilaItem } from './types';
import { db } from './firebase';
import { ref, onValue, set, remove, update, get, Unsubscribe } from "firebase/database";

const INITIAL_SETTINGS: OrganizationSettings = {
    orgNameNepali: 'Smart Inventory System',
    orgNameEnglish: 'Smart Inventory System',
    subTitleNepali: 'जिन्सी व्यवस्थापन प्रणाली',
    address: 'City, Nepal',
    phone: '01-XXXXXXX',
    email: 'info@smartinventory.com',
    website: 'www.smartinventory.com',
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
    allowedMenus: ['dashboard', 'inventory', 'settings']
};

const App: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentFiscalYear, setCurrentFiscalYear] = useState<string>('2081/082');
  const [generalSettings, setGeneralSettings] = useState<OrganizationSettings>(INITIAL_SETTINGS);
  const [isDbConnected, setIsDbConnected] = useState(false);
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [magForms, setMagForms] = useState<MagFormEntry[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderEntry[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReportEntry[]>([]);
  const [stockEntryRequests, setStockEntryRequests] = useState<StockEntryRequest[]>([]);
  const [dakhilaReports, setDakhilaReports] = useState<DakhilaPratibedanEntry[]>([]);
  const [returnEntries, setReturnEntries] = useState<ReturnEntry[]>([]);
  const [firms, setFirms] = useState<FirmEntry[]>([]);
  const [quotations, setQuotations] = useState<QuotationEntry[]>([]);
  const [rabiesPatients, setRabiesPatients] = useState<RabiesPatient[]>([]);
  const [marmatEntries, setMarmatEntries] = useState<MarmatEntry[]>([]);
  const [dhuliyaunaEntries, setDhuliyaunaEntries] = useState<DhuliyaunaEntry[]>([]);
  const [logBookEntries, setLogBookEntries] = useState<LogBookEntry[]>([]);

  useEffect(() => {
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => setIsDbConnected(snap.val() === true));

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
    if (!currentUser) {
        setInventoryItems([]);
        setStores([]);
        setMagForms([]);
        setPurchaseOrders([]);
        setIssueReports([]);
        setStockEntryRequests([]);
        setDakhilaReports([]);
        setReturnEntries([]);
        setFirms([]);
        setQuotations([]);
        setRabiesPatients([]);
        setMarmatEntries([]);
        setDhuliyaunaEntries([]);
        setLogBookEntries([]);
        setGeneralSettings(INITIAL_SETTINGS);
        return;
    }

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
    setupOrgListener('purchaseOrders', setPurchaseOrders);
    setupOrgListener('issueReports', setIssueReports);
    setupOrgListener('stockRequests', setStockEntryRequests);
    setupOrgListener('dakhilaReports', setDakhilaReports);
    setupOrgListener('returnEntries', setReturnEntries);
    setupOrgListener('firms', setFirms);
    setupOrgListener('quotations', setQuotations);
    setupOrgListener('rabiesPatients', setRabiesPatients);
    setupOrgListener('marmatEntries', setMarmatEntries);
    setupOrgListener('disposalEntries', setDhuliyaunaEntries);
    setupOrgListener('logBook', setLogBookEntries);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser]);

  const handleLoginSuccess = (user: User, fiscalYear: string) => {
    setCurrentUser(user);
    setCurrentFiscalYear(fiscalYear);
  };

  const getOrgRef = (subPath: string) => {
      const safeOrgName = currentUser?.organizationName.trim().replace(/[.#$[\]]/g, "_") || "unknown";
      return ref(db, `orgData/${safeOrgName}/${subPath}`);
  };

  const filteredUsersForDashboard = allUsers.filter(u => {
      if (currentUser?.role === 'SUPER_ADMIN') return true;
      return u.organizationName === currentUser?.organizationName;
  });

  const handleSaveMagForm = async (f: MagFormEntry) => {
      if (!currentUser) return;
      try {
          const safeOrgName = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
          const orgPath = `orgData/${safeOrgName}`;
          
          const updates: Record<string, any> = {};
          updates[`${orgPath}/magForms/${f.id}`] = f;

          if (f.status === 'Approved') {
              if (f.storeKeeper?.status === 'market') {
                  const poId = `PO-${f.id}`;
                  const poPath = `${orgPath}/purchaseOrders/${poId}`;
                  const poSnap = await get(ref(db, poPath));
                  if (!poSnap.exists()) {
                      const ordersSnap = await get(ref(db, `${orgPath}/purchaseOrders`));
                      const allOrders: PurchaseOrderEntry[] = ordersSnap.exists() ? Object.values(ordersSnap.val()) : [];
                      const fyOrders = allOrders.filter(o => o.fiscalYear === f.fiscalYear && o.orderNo);
                      const maxNo = fyOrders.reduce((max, o) => {
                          const parts = o.orderNo?.split('-');
                          const val = parts ? parseInt(parts[0]) : 0;
                          return isNaN(val) ? max : Math.max(max, val);
                      }, 0);
                      const nextOrderNo = `${String(maxNo + 1).padStart(4, '0')}-KH`;
                      const newPO: PurchaseOrderEntry = {
                          id: poId,
                          magFormId: f.id,
                          magFormNo: f.formNo,
                          requestDate: f.date,
                          items: f.items,
                          status: 'Pending',
                          orderNo: nextOrderNo,
                          fiscalYear: f.fiscalYear,
                          preparedBy: { name: '', designation: '', date: '' },
                          recommendedBy: { name: '', designation: '', date: '' },
                          financeBy: { name: '', designation: '', date: '' },
                          approvedBy: { name: '', designation: '', date: '' }
                      };
                      updates[poPath] = newPO;
                  }
              }
              else if (f.storeKeeper?.status === 'stock') {
                  const irId = `IR-${f.id}`;
                  const irPath = `${orgPath}/issueReports/${irId}`;
                  const irSnap = await get(ref(db, irPath));
                  if (!irSnap.exists()) {
                      const newIR: IssueReportEntry = {
                          id: irId,
                          magFormId: f.id,
                          magFormNo: f.formNo,
                          requestDate: f.date,
                          items: f.items,
                          status: 'Pending',
                          fiscalYear: f.fiscalYear,
                          itemType: f.issueItemType || 'Expendable',
                          storeId: f.selectedStoreId, 
                          demandBy: f.demandBy,
                          preparedBy: { name: '', designation: '', date: '' },
                          recommendedBy: { name: '', designation: '', date: '' },
                          approvedBy: { name: '', designation: '', date: '' }
                      };
                      updates[irPath] = newIR;
                  }
              }
          }
          await update(ref(db), updates);
      } catch (error) {
          console.error("Error saving Mag Form workflow:", error);
          alert("माग फारम सुरक्षित गर्दा समस्या आयो।");
      }
  };

  const handleApproveIssueReport = async (report: IssueReportEntry) => {
    if (!currentUser) return;
    try {
        const safeOrgName = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
        const orgPath = `orgData/${safeOrgName}`;
        
        // 1. Fetch current version to check previous status
        const currentReportSnap = await get(ref(db, `${orgPath}/issueReports/${report.id}`));
        const prevStatus = currentReportSnap.exists() ? currentReportSnap.val().status : null;
        
        const updates: Record<string, any> = {};

        // 2. Logic to deduct stock ONLY if status is transitioning TO 'Issued'
        if (report.status === 'Issued' && prevStatus !== 'Issued' && report.storeId) {
            const invSnap = await get(ref(db, `${orgPath}/inventory`));
            const inventory: Record<string, InventoryItem> = invSnap.exists() ? invSnap.val() : {};
            const inventoryKeys = Object.keys(inventory);

            // Fetch the linked Mag Form to update its remarks as well
            const magFormSnap = await get(ref(db, `${orgPath}/magForms/${report.magFormId}`));
            let linkedMagForm: MagFormEntry | null = magFormSnap.exists() ? magFormSnap.val() : null;

            const updatedReportItems = report.items.map(rptItem => {
                let remainingToIssue = Number(rptItem.quantity) || 0;
                let usedBatches: string[] = [];

                // FEFO: Find and sort inventory items
                const matchingInventoryItems = inventoryKeys
                    .map(key => ({ key, data: inventory[key] }))
                    .filter(item => 
                        item.data.itemName.trim().toLowerCase() === rptItem.name.trim().toLowerCase() &&
                        item.data.storeId === report.storeId &&
                        item.data.itemType === report.itemType &&
                        item.data.currentQuantity > 0
                    );

                // FEFO Sort: Near Expiry Date first
                matchingInventoryItems.sort((a, b) => {
                    const dateA = a.data.expiryDateAd ? new Date(a.data.expiryDateAd).getTime() : Infinity;
                    const dateB = b.data.expiryDateAd ? new Date(b.data.expiryDateAd).getTime() : Infinity;
                    return dateA - dateB;
                });

                for (const invMatch of matchingInventoryItems) {
                    if (remainingToIssue <= 0) break;
                    const invItem = invMatch.data;
                    const availableQty = invItem.currentQuantity;
                    const takeQty = Math.min(availableQty, remainingToIssue);
                    const newQty = availableQty - takeQty;
                    remainingToIssue -= takeQty;

                    if (invItem.batchNo) {
                        usedBatches.push(`B:${invItem.batchNo}(${takeQty}${invItem.unit})`);
                    }

                    const rate = Number(invItem.rate) || 0;
                    const tax = Number(invItem.tax) || 0;
                    const newTotal = newQty * rate * (1 + tax / 100);

                    updates[`${orgPath}/inventory/${invMatch.key}`] = {
                        ...invItem,
                        currentQuantity: newQty,
                        totalAmount: newTotal,
                        lastUpdateDateBs: report.issueDate || report.requestDate,
                    };
                }

                if (usedBatches.length > 0) {
                    const batchInfo = usedBatches.join(', ');
                    const newRemarks = rptItem.remarks ? `${rptItem.remarks} [Batch: ${batchInfo}]` : `[Batch: ${batchInfo}]`;
                    
                    // Update linked Mag Form's item remarks if form exists
                    if (linkedMagForm) {
                        linkedMagForm.items = linkedMagForm.items.map(mItem => {
                            if (mItem.name.trim().toLowerCase() === rptItem.name.trim().toLowerCase()) {
                                return { ...mItem, remarks: newRemarks };
                            }
                            return mItem;
                        });
                    }

                    return { ...rptItem, remarks: newRemarks };
                }
                return rptItem;
            });

            report.items = updatedReportItems;

            // Save the updated Mag Form with batch info in remarks
            if (linkedMagForm) {
                updates[`${orgPath}/magForms/${report.magFormId}`] = linkedMagForm;
            }
        }

        // 3. Final Update to Database
        updates[`${orgPath}/issueReports/${report.id}`] = report;
        await update(ref(db), updates);
    } catch (error) {
        console.error("Error issuing report with FEFO and audit trail:", error);
        alert("निकासा गर्दा स्टक र माग फारम अपडेट गर्न समस्या आयो।");
    }
  };

  const handleApproveStockEntry = async (requestId: string, approverName: string, approverDesignation: string) => {
      if (!currentUser) return;
      try {
          const safeOrgName = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
          const orgPath = `orgData/${safeOrgName}`;
          
          const requestRef = ref(db, `${orgPath}/stockRequests/${requestId}`);
          const requestSnap = await get(requestRef);
          if (!requestSnap.exists()) return;
          const request: StockEntryRequest = requestSnap.val();
          
          const invAllSnap = await get(ref(db, `${orgPath}/inventory`));
          const currentInvData = invAllSnap.val() || {};
          const currentInvList: InventoryItem[] = Object.keys(currentInvData).map(k => ({ ...currentInvData[k], id: k }));

          const updates: Record<string, any> = {};
          const dakhilaItems: DakhilaItem[] = [];

          for (const item of request.items) {
              const existingItem = currentInvList.find(i => 
                  i.itemName.trim().toLowerCase() === item.itemName.trim().toLowerCase() && 
                  i.storeId === request.storeId &&
                  i.itemType === item.itemType &&
                  i.batchNo === item.batchNo && 
                  i.expiryDateAd === item.expiryDateAd
              );

              const incomingQty = Number(item.currentQuantity) || 0;
              const incomingRate = Number(item.rate) || 0;
              const incomingTax = Number(item.tax) || 0;
              const incomingTotal = incomingQty * incomingRate * (1 + incomingTax / 100);

              dakhilaItems.push({
                  id: Date.now() + Math.random(),
                  name: item.itemName,
                  codeNo: item.sanketNo || item.uniqueCode || '',
                  specification: item.specification || '',
                  source: request.receiptSource,
                  unit: item.unit,
                  quantity: incomingQty,
                  rate: incomingRate,
                  totalAmount: incomingQty * incomingRate,
                  vatAmount: (incomingQty * incomingRate) * (incomingTax / 100),
                  grandTotal: incomingTotal,
                  otherExpenses: 0,
                  finalTotal: incomingTotal,
                  remarks: item.remarks || ''
              });

              if (existingItem) {
                  const newQty = (Number(existingItem.currentQuantity) || 0) + incomingQty;
                  const newVal = (Number(existingItem.totalAmount) || 0) + incomingTotal;
                  updates[`${orgPath}/inventory/${existingItem.id}`] = {
                      ...existingItem,
                      currentQuantity: newQty,
                      totalAmount: newVal,
                      lastUpdateDateBs: request.requestDateBs,
                      lastUpdateDateAd: request.requestDateAd,
                      dakhilaNo: request.dakhilaNo || item.dakhilaNo || existingItem.dakhilaNo
                  };
              } else {
                  const newId = item.id.startsWith('TEMP') ? `ITEM-${Date.now()}-${Math.random().toString(36).substring(7)}` : item.id;
                  updates[`${orgPath}/inventory/${newId}`] = {
                      ...item,
                      id: newId,
                      currentQuantity: incomingQty,
                      totalAmount: incomingTotal,
                      lastUpdateDateBs: request.requestDateBs,
                      lastUpdateDateAd: request.requestDateAd,
                      storeId: request.storeId,
                      fiscalYear: request.fiscalYear,
                      dakhilaNo: request.dakhilaNo || item.dakhilaNo
                  };
              }
          }

          updates[`${orgPath}/stockRequests/${requestId}/status`] = 'Approved';
          updates[`${orgPath}/stockRequests/${requestId}/approvedBy`] = approverName;

          const formalDakhilaId = `DA-${Date.now()}`;
          const formalReport: DakhilaPratibedanEntry = {
              id: formalDakhilaId,
              fiscalYear: request.fiscalYear,
              dakhilaNo: request.dakhilaNo || (request.items[0]?.dakhilaNo) || formalDakhilaId,
              date: request.requestDateBs,
              orderNo: request.refNo || 'BULK-ENTRY',
              items: dakhilaItems,
              status: 'Final',
              preparedBy: { name: request.requesterName || request.requestedBy, designation: request.requesterDesignation || 'Staff', date: request.requestDateBs },
              approvedBy: { name: approverName, designation: approverDesignation, date: request.requestDateBs }
          };
          updates[`${orgPath}/dakhilaReports/${formalDakhilaId}`] = formalReport;

          await update(ref(db), updates);
      } catch (error) {
          console.error("Critical Error during stock approval:", error);
          alert("सिस्टममा समस्या आयो। स्टक अपडेट हुन सकेन।");
      }
  };

  return (
    <>
      {currentUser ? (
        <Dashboard 
          onLogout={() => setCurrentUser(null)} 
          currentUser={currentUser}
          currentFiscalYear={currentFiscalYear} 
          users={filteredUsersForDashboard}
          onAddUser={(u) => set(ref(db, `users/${u.id}`), u)}
          onUpdateUser={(u) => set(ref(db, `users/${u.id}`), u)}
          onDeleteUser={(id) => remove(ref(db, `users/${id}`))}
          onChangePassword={(id, pass) => update(ref(db, `users/${id}`), { password: pass })}
          generalSettings={generalSettings}
          onUpdateGeneralSettings={(s) => set(getOrgRef('settings'), s)}
          magForms={magForms}
          onSaveMagForm={handleSaveMagForm}
          purchaseOrders={purchaseOrders}
          onUpdatePurchaseOrder={(o) => set(getOrgRef(`purchaseOrders/${o.id}`), o)}
          issueReports={issueReports}
          onUpdateIssueReport={handleApproveIssueReport} 
          rabiesPatients={rabiesPatients}
          onAddRabiesPatient={(p) => set(getOrgRef(`rabiesPatients/${p.id}`), p)}
          onUpdateRabiesPatient={(p) => set(getOrgRef(`rabiesPatients/${p.id}`), p)}
          onDeletePatient={(id) => remove(getOrgRef(`rabiesPatients/${id}`))}
          firms={firms}
          onAddFirm={(f) => set(getOrgRef(`firms/${f.id}`), f)}
          quotations={quotations}
          onAddQuotation={(q) => set(getOrgRef(`quotations/${q.id}`), q)}
          inventoryItems={inventoryItems}
          onAddInventoryItem={(i) => set(getOrgRef(`inventory/${i.id}`), i)}
          onUpdateInventoryItem={(i) => set(getOrgRef(`inventory/${i.id}`), i)}
          stockEntryRequests={stockEntryRequests}
          onRequestStockEntry={(r) => set(getOrgRef(`stockRequests/${r.id}`), r)}
          onApproveStockEntry={handleApproveStockEntry}
          onRejectStockEntry={(id, res, app) => update(getOrgRef(`stockRequests/${id}`), { status: 'Rejected', rejectionReason: res, approvedBy: app })}
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
        <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
          <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100">
              <div className="bg-primary-600 p-12 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor"></path>
                    </svg>
                </div>
                <div className="relative z-10">
                    <div className="bg-white/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-inner border border-white/30">
                        <Landmark className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold font-nepali tracking-tight mb-2">{APP_NAME}</h1>
                    <p className="text-primary-100 font-semibold tracking-wide uppercase text-xs">जिन्सी व्यवस्थापन पोर्टल</p>
                </div>
              </div>
              <div className="p-10">
                <LoginForm 
                    users={allUsers} 
                    onLoginSuccess={handleLoginSuccess} 
                    initialFiscalYear={'2081/082'} 
                />
              </div>
              <div className="bg-slate-50 p-5 text-center border-t border-slate-100 flex items-center justify-center gap-3">
                 <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
                    <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-green-50 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-50 animate-pulse'}`}></span>
                    <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">{isDbConnected ? 'System Online' : 'System Offline'}</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck size={14} />
                    <span className="text-[11px] font-medium">Secure Access</span>
                 </div>
              </div>
            </div>
            <p className="text-center mt-8 text-slate-400 text-xs font-medium uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Smart Inventory Solutions
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
