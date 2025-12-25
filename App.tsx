
import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { APP_NAME, ORG_NAME } from './constants';
import { Landmark, ShieldCheck } from 'lucide-react';
import { User, OrganizationSettings, MagFormEntry, RabiesPatient, PurchaseOrderEntry, IssueReportEntry, FirmEntry, QuotationEntry, InventoryItem, Store, StockEntryRequest, DakhilaPratibedanEntry, ReturnEntry, MarmatEntry, DhuliyaunaEntry, LogBookEntry, DakhilaItem, TBPatient } from './types';
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

const STORAGE_KEY_USER = 'smart_inventory_active_user';
const STORAGE_KEY_FY = 'smart_inventory_active_fy';

const App: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  
  // Initialize state from localStorage if available
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

    // Load Global Default Fiscal Year for Login
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
        setTbPatients([]);
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
    setupOrgListener('tbPatients', setTbPatients);
    setupOrgListener('marmatEntries', setMarmatEntries);
    setupOrgListener('disposalEntries', setDhuliyaunaEntries);
    setupOrgListener('logBook', setLogBookEntries);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser]);

  const handleLoginSuccess = (user: User, fiscalYear: string) => {
    setCurrentUser(user);
    setCurrentFiscalYear(fiscalYear);
    // Save session to localStorage
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

  const handleSaveReturnEntry = async (entry: ReturnEntry) => {
    if (!currentUser) return;
    try {
        const safeOrgName = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
        const orgPath = `orgData/${safeOrgName}`;
        const existingSnap = await get(ref(db, `${orgPath}/returnEntries/${entry.id}`));
        const prevStatus = existingSnap.exists() ? existingSnap.val().status : null;
        const updates: Record<string, any> = {};

        if (entry.status === 'Approved' && prevStatus !== 'Approved') {
            const invSnap = await get(ref(db, `${orgPath}/inventory`));
            const inventory: Record<string, InventoryItem> = invSnap.exists() ? invSnap.val() : {};
            const invList = Object.keys(inventory).map(k => ({ ...inventory[k], id: k }));

            for (const retItem of entry.items) {
                const matchingItem = invList.find(i => 
                    i.itemName.trim().toLowerCase() === retItem.name.trim().toLowerCase()
                );
                if (matchingItem) {
                    const currentQty = Number(matchingItem.currentQuantity) || 0;
                    const returnQty = Number(retItem.quantity) || 0;
                    const newQty = currentQty + returnQty;
                    const rate = Number(matchingItem.rate) || 0;
                    const tax = Number(matchingItem.tax) || 0;
                    const newTotal = newQty * rate * (1 + tax / 100);
                    updates[`${orgPath}/inventory/${matchingItem.id}`] = {
                        ...matchingItem,
                        currentQuantity: newQty,
                        totalAmount: newTotal,
                        lastUpdateDateBs: entry.date,
                    };
                }
            }
        }
        updates[`${orgPath}/returnEntries/${entry.id}`] = entry;
        await update(ref(db), updates);
    } catch (error) {
        console.error("Error approving return and updating stock:", error);
        alert("फिर्ता स्वीकृत गर्दा स्टक अपडेट गर्न समस्या आयो।");
    }
  };

  const handleSaveMagForm = async (f: MagFormEntry) => {
      if (!currentUser) return;
      try {
          const updates: Record<string, any> = {};
          const formToSave = { ...f, sourceOrg: f.sourceOrg || currentUser.organizationName };
          const sourceSafeName = formToSave.sourceOrg.trim().replace(/[.#$[\]]/g, "_");
          const targetSafeName = formToSave.targetOrg?.trim().replace(/[.#$[\]]/g, "_");
          updates[`orgData/${sourceSafeName}/magForms/${formToSave.id}`] = formToSave;
          if (formToSave.isInstitutional && targetSafeName) {
            updates[`orgData/${targetSafeName}/magForms/${formToSave.id}`] = formToSave;
          }
          if (formToSave.status === 'Approved') {
              const currentSafeOrg = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
              const orgPath = `orgData/${currentSafeOrg}`;
              if (formToSave.storeKeeper?.status === 'market') {
                  const poId = `PO-${formToSave.id}`;
                  const poPath = `${orgPath}/purchaseOrders/${poId}`;
                  const poSnap = await get(ref(db, poPath));
                  if (!poSnap.exists()) {
                      const ordersSnap = await get(ref(db, `${orgPath}/purchaseOrders`));
                      const allOrders: PurchaseOrderEntry[] = ordersSnap.exists() ? Object.values(ordersSnap.val()) : [];
                      const fyOrders = allOrders.filter(o => o.fiscalYear === formToSave.fiscalYear && o.orderNo);
                      const maxNo = fyOrders.reduce((max, o) => {
                          const parts = o.orderNo?.split('-');
                          const val = parts ? parseInt(parts[0]) : 0;
                          return isNaN(val) ? max : Math.max(max, val);
                      }, 0);
                      const nextOrderNo = `${String(maxNo + 1).padStart(4, '0')}-KH`;
                      updates[poPath] = {
                          id: poId, magFormId: formToSave.id, magFormNo: formToSave.formNo,
                          requestDate: formToSave.date, items: formToSave.items, status: 'Pending',
                          orderNo: nextOrderNo, fiscalYear: formToSave.fiscalYear,
                          preparedBy: { name: '', designation: '', date: '' }, recommendedBy: { name: '', designation: '', date: '' },
                          financeBy: { name: '', designation: '', date: '' }, approvedBy: { name: '', designation: '', date: '' }
                      };
                  }
              }
              else if (formToSave.storeKeeper?.status === 'stock') {
                  const irId = `IR-${formToSave.id}`;
                  const irPath = `${orgPath}/issueReports/${irId}`;
                  const irSnap = await get(ref(db, irPath));
                  if (!irSnap.exists()) {
                      updates[irPath] = {
                          id: irId, magFormId: formToSave.id, magFormNo: formToSave.formNo,
                          requestDate: formToSave.date, items: formToSave.items, status: 'Pending',
                          fiscalYear: formToSave.fiscalYear, itemType: formToSave.issueItemType || 'Expendable',
                          storeId: formToSave.selectedStoreId, demandBy: formToSave.demandBy,
                          preparedBy: { name: '', designation: '', date: '' }, recommendedBy: { name: '', designation: '', date: '' },
                          approvedBy: { name: '', designation: '', date: '' }
                      };
                  }
              }
          }
          await update(ref(db), updates);
      } catch (error) {
          console.error("Error saving Mag Form sync:", error);
          alert("माग फारम सुरक्षित गर्दा समस्या आयो।");
      }
  };

  const handleApproveIssueReport = async (report: IssueReportEntry) => {
    if (!currentUser) return;
    try {
        const safeOrgName = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
        const orgPath = `orgData/${safeOrgName}`;
        const currentReportSnap = await get(ref(db, `${orgPath}/issueReports/${report.id}`));
        const prevStatus = currentReportSnap.exists() ? currentReportSnap.val().status : null;
        const updates: Record<string, any> = {};

        if (report.status === 'Issued' && prevStatus !== 'Issued' && report.storeId) {
            const invSnap = await get(ref(db, `${orgPath}/inventory`));
            const inventory: Record<string, InventoryItem> = invSnap.exists() ? invSnap.val() : {};
            const inventoryKeys = Object.keys(inventory);
            const magFormSnap = await get(ref(db, `${orgPath}/magForms/${report.magFormId}`));
            let linkedMagForm: MagFormEntry | null = magFormSnap.exists() ? magFormSnap.val() : null;

            const updatedReportItems = report.items.map(rptItem => {
                let remainingToIssue = Number(rptItem.quantity) || 0;
                let usedBatches: string[] = [];
                let firstMatchedCode = ''; 
                const matchingInventoryItems = inventoryKeys
                    .map(key => ({ key, data: inventory[key] }))
                    .filter(item => 
                        item.data.itemName.trim().toLowerCase() === rptItem.name.trim().toLowerCase() &&
                        item.data.storeId === report.storeId &&
                        item.data.itemType === report.itemType &&
                        item.data.currentQuantity > 0
                    );
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
                    if (!firstMatchedCode) firstMatchedCode = invItem.uniqueCode || invItem.sanketNo || '';
                    if (invItem.batchNo) usedBatches.push(`B:${invItem.batchNo}(${takeQty}${invItem.unit})`);
                    const rate = Number(invItem.rate) || 0;
                    const tax = Number(invItem.tax) || 0;
                    updates[`${orgPath}/inventory/${invMatch.key}`] = {
                        ...invItem, currentQuantity: newQty, totalAmount: newQty * rate * (1 + tax / 100),
                        lastUpdateDateBs: report.issueDate || report.requestDate,
                    };
                }
                const batchSuffix = usedBatches.length > 0 ? ` [Batch: ${usedBatches.join(', ')}]` : '';
                const newRemarks = rptItem.remarks ? `${rptItem.remarks}${batchSuffix}` : batchSuffix.trim();
                if (linkedMagForm) {
                    linkedMagForm.items = linkedMagForm.items.map(mItem => {
                        if (mItem.name.trim().toLowerCase() === rptItem.name.trim().toLowerCase()) return { ...mItem, remarks: newRemarks };
                        return mItem;
                    });
                }
                return { ...rptItem, remarks: newRemarks, codeNo: firstMatchedCode || rptItem.codeNo };
            });

            report.items = updatedReportItems;
            if (linkedMagForm) {
                linkedMagForm.receiver = { name: linkedMagForm.demandBy?.name || '', designation: linkedMagForm.demandBy?.designation || '', date: report.issueDate || report.requestDate };
                const sourceSafeName = linkedMagForm.sourceOrg?.trim().replace(/[.#$[\]]/g, "_");
                const targetSafeName = linkedMagForm.targetOrg?.trim().replace(/[.#$[\]]/g, "_");
                if (sourceSafeName) updates[`orgData/${sourceSafeName}/magForms/${linkedMagForm.id}`] = linkedMagForm;
                if (targetSafeName) updates[`orgData/${targetSafeName}/magForms/${linkedMagForm.id}`] = linkedMagForm;
                if (!linkedMagForm.isInstitutional) updates[`${orgPath}/magForms/${linkedMagForm.id}`] = linkedMagForm;
            }
        }
        updates[`${orgPath}/issueReports/${report.id}`] = report;
        await update(ref(db), updates);
    } catch (error) {
        console.error("Error issuing report:", error);
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
                  i.itemName.trim().toLowerCase() === item.itemName.trim().toLowerCase() && i.storeId === request.storeId &&
                  i.itemType === item.itemType && i.batchNo === item.batchNo && i.expiryDateAd === item.expiryDateAd
              );
              const incomingQty = Number(item.currentQuantity) || 0;
              const incomingRate = Number(item.rate) || 0;
              const incomingTax = Number(item.tax) || 0;
              const incomingTotal = incomingQty * incomingRate * (1 + incomingTax / 100);

              dakhilaItems.push({
                  id: Date.now() + Math.random(), name: item.itemName, codeNo: item.sanketNo || item.uniqueCode || '',
                  specification: item.specification || '', source: request.receiptSource, unit: item.unit, quantity: incomingQty,
                  rate: incomingRate, totalAmount: incomingQty * incomingRate, vatAmount: (incomingQty * incomingRate) * (incomingTax / 100),
                  grandTotal: incomingTotal, otherExpenses: 0, finalTotal: incomingTotal, remarks: item.remarks || ''
              });

              if (existingItem) {
                  const newQty = (Number(existingItem.currentQuantity) || 0) + incomingQty;
                  updates[`${orgPath}/inventory/${existingItem.id}`] = {
                      ...existingItem, currentQuantity: newQty, totalAmount: (Number(existingItem.totalAmount) || 0) + incomingTotal,
                      lastUpdateDateBs: request.requestDateBs, lastUpdateDateAd: request.requestDateAd,
                      dakhilaNo: request.dakhilaNo || item.dakhilaNo || existingItem.dakhilaNo
                  };
              } else {
                  const newId = item.id.startsWith('TEMP') ? `ITEM-${Date.now()}-${Math.random().toString(36).substring(7)}` : item.id;
                  updates[`${orgPath}/inventory/${newId}`] = {
                      ...item, id: newId, currentQuantity: incomingQty, totalAmount: incomingTotal,
                      lastUpdateDateBs: request.requestDateBs, lastUpdateDateAd: request.requestDateAd,
                      storeId: request.storeId, fiscalYear: request.fiscalYear, dakhilaNo: request.dakhilaNo || item.dakhilaNo
                  };
              }
          }
          updates[`${orgPath}/stockRequests/${requestId}/status`] = 'Approved';
          updates[`${orgPath}/stockRequests/${requestId}/approvedBy`] = approverName;
          const formalDakhilaId = `DA-${Date.now()}`;
          updates[`${orgPath}/dakhilaReports/${formalDakhilaId}`] = {
              id: formalDakhilaId, fiscalYear: request.fiscalYear, dakhilaNo: request.dakhilaNo || (request.items[0]?.dakhilaNo) || formalDakhilaId,
              date: request.requestDateBs, orderNo: request.refNo || 'BULK-ENTRY', items: dakhilaItems, status: 'Final',
              preparedBy: { name: request.requesterName || request.requestedBy, designation: request.requesterDesignation || 'Staff', date: request.requestDateBs },
              approvedBy: { name: approverName, designation: approverDesignation, date: request.requestDateBs }
          };
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
          onSaveMagForm={handleSaveMagForm}
          purchaseOrders={purchaseOrders}
          onUpdatePurchaseOrder={(o) => set(getOrgRef(`purchaseOrders/${o.id}`), o)}
          issueReports={issueReports}
          onUpdateIssueReport={handleApproveIssueReport} 
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
          onApproveStockEntry={handleApproveStockEntry}
          onRejectStockEntry={(id, res, app) => update(getOrgRef(`stockRequests/${id}`), { status: 'Rejected', rejectionReason: res, approvedBy: app })}
          stores={stores}
          onAddStore={(s) => set(getOrgRef(`stores/${s.id}`), s)}
          onUpdateStore={(s) => set(getOrgRef(`stores/${s.id}`), s)}
          onDeleteStore={(id) => remove(getOrgRef(`stores/${id}`))}
          dakhilaReports={dakhilaReports}
          onSaveDakhilaReport={(r) => set(getOrgRef(`dakhilaReports/${r.id}`), r)}
          returnEntries={returnEntries}
          onSaveReturnEntry={handleSaveReturnEntry}
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
                    initialFiscalYear={appDefaultFiscalYear} 
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