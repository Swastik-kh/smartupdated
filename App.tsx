
import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { APP_NAME, ORG_NAME } from './constants';
import { Landmark, ShieldCheck } from 'lucide-react';
import { User, OrganizationSettings, MagFormEntry, RabiesPatient, PurchaseOrderEntry, IssueReportEntry, FirmEntry, QuotationEntry, InventoryItem, Store, StockEntryRequest, DakhilaPratibedanEntry, ReturnEntry, MarmatEntry, DhuliyaunaEntry, LogBookEntry, DakhilaItem, TBPatient, HafaEntry, HafaItem } from './types';
import { db } from './firebase';
import { ref, onValue, set, remove, update, get, Unsubscribe } from "firebase/database";
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

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
    if (!currentUser) {
        setInventoryItems([]);
        setStores([]);
        setMagForms([]);
        setHafaEntries([]);
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

  const handleSaveHafaEntry = async (entry: HafaEntry) => {
    if (!currentUser) return;
    try {
        const sourceSafeOrg = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
        const updates: Record<string, any> = {};
        
        // Ensure source identity is preserved for recipient preview
        const finalEntry = {
            ...entry,
            sourceOrg: entry.sourceOrg || currentUser.organizationName,
            sourceOrgDetails: entry.sourceOrgDetails || {
                name: generalSettings.orgNameNepali,
                subTitle: generalSettings.subTitleNepali,
                address: generalSettings.address
            }
        };

        // 1. Update source organization record
        updates[`orgData/${sourceSafeOrg}/hafaEntries/${entry.id}`] = finalEntry;

        // 2. If approved, sync with recipient organization
        if (finalEntry.status === 'Approved') {
            const recipientName = finalEntry.recipientOrg?.trim();
            const targetUser = allUsers.find(u => u.organizationName.trim().toLowerCase() === recipientName.toLowerCase());
            
            if (targetUser) {
                const targetSafeOrg = targetUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
                
                // Also create the Hafa entry in the recipient's office data for their signature
                updates[`orgData/${targetSafeOrg}/hafaEntries/${finalEntry.id}`] = finalEntry;

                // Prepare Stock Request for Recipient
                const requestItems: InventoryItem[] = finalEntry.items.map((item, idx) => ({
                    id: `TEMP-${Date.now()}-${idx}`,
                    itemName: item.name,
                    unit: item.unit,
                    currentQuantity: item.quantity,
                    rate: item.rate,
                    totalAmount: item.totalAmount,
                    itemType: finalEntry.itemType,
                    specification: item.specification,
                    uniqueCode: item.codeNo,
                    lastUpdateDateBs: finalEntry.date,
                    lastUpdateDateAd: new Date().toISOString().split('T')[0],
                    fiscalYear: finalEntry.fiscalYear,
                    storeId: '', 
                    receiptSource: 'हस्तान्तरण (Transfer)'
                }));

                const stockRequest: StockEntryRequest = {
                    id: `TR-${finalEntry.id}`,
                    requestDateBs: finalEntry.date,
                    requestDateAd: new Date().toISOString().split('T')[0],
                    fiscalYear: finalEntry.fiscalYear,
                    storeId: '', 
                    receiptSource: 'हस्तान्तरण (Transfer)',
                    supplier: currentUser.organizationName,
                    refNo: finalEntry.formNo,
                    items: requestItems,
                    status: 'Pending',
                    requestedBy: currentUser.username,
                    requesterName: currentUser.fullName,
                    requesterDesignation: currentUser.designation,
                    mode: 'add'
                };

                updates[`orgData/${targetSafeOrg}/stockRequests/${stockRequest.id}`] = stockRequest;
            }
        }

        await update(ref(db), updates);
    } catch (error) {
        console.error("Error saving Hafa Entry:", error);
        alert("त्रुटि: फारम सुरक्षित हुन सकेन।");
    }
  };

  const handleDeleteHafaEntry = async (id: string) => {
    if (!currentUser) return;
    try {
        const sourceSafeOrg = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
        const entryRef = ref(db, `orgData/${sourceSafeOrg}/hafaEntries/${id}`);
        const snap = await get(entryRef);
        if (snap.exists()) {
            const entry: HafaEntry = snap.val();
            // Delete from source
            await remove(entryRef);
            // If it was synced to a recipient (even if pending for them), try to remove there too
            if (entry.recipientOrg) {
                const recipientName = entry.recipientOrg.trim();
                const targetUser = allUsers.find(u => u.organizationName.trim().toLowerCase() === recipientName.toLowerCase());
                if (targetUser) {
                    const targetSafeOrg = targetUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
                    await remove(ref(db, `orgData/${targetSafeOrg}/hafaEntries/${id}`));
                    await remove(ref(db, `orgData/${targetSafeOrg}/stockRequests/TR-${id}`));
                }
            }
        }
    } catch (error) {
        console.error("Error deleting Hafa Entry:", error);
        alert("त्रुटि: फारम मेटाउन सकिएन।");
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
                const matchingItem = invList.find(i => i.itemName.trim().toLowerCase() === retItem.name.trim().toLowerCase());
                if (matchingItem) {
                    const currentQty = Number(matchingItem.currentQuantity) || 0;
                    const returnQty = Number(retItem.quantity) || 0;
                    const newQty = currentQty + returnQty;
                    updates[`${orgPath}/inventory/${matchingItem.id}`] = { ...matchingItem, currentQuantity: newQty, lastUpdateDateBs: entry.date };
                }
            }
        }
        updates[`${orgPath}/returnEntries/${entry.id}`] = entry;
        await update(ref(db), updates);
    } catch (error) { console.error(error); alert("Error saving return"); }
  };

  const handleSaveMagForm = async (f: MagFormEntry) => {
      if (!currentUser) return;
      try {
          const updates: Record<string, any> = {};
          const formToSave = { ...f, sourceOrg: f.sourceOrg || currentUser.organizationName };
          
          const sourceSafeName = formToSave.sourceOrg.trim().replace(/[.#$[\]]/g, "_");
          updates[`orgData/${sourceSafeName}/magForms/${formToSave.id}`] = formToSave;
          
          if (formToSave.isInstitutional && formToSave.targetOrg) {
              const targetSafeName = formToSave.targetOrg.trim().replace(/[.#$[\]]/g, "_");
              updates[`orgData/${targetSafeName}/magForms/${formToSave.id}`] = formToSave;
          }

          if (formToSave.status === 'Approved') {
              const actingOrg = formToSave.targetOrg || formToSave.sourceOrg || currentUser.organizationName;
              const actingSafeOrg = actingOrg.trim().replace(/[.#$[\]]/g, "_");
              const orgPath = `orgData/${actingSafeOrg}`;
              
              if (formToSave.storeKeeper?.status === 'market') {
                  const poId = `PO-${formToSave.id}`;
                  const poPath = `${orgPath}/purchaseOrders/${poId}`;
                  updates[poPath] = { id: poId, magFormId: formToSave.id, magFormNo: formToSave.formNo, requestDate: formToSave.date, items: formToSave.items, status: 'Pending', fiscalYear: formToSave.fiscalYear };
              } else if (formToSave.storeKeeper?.status === 'stock') {
                  const irId = `IR-${formToSave.id}`;
                  const irPath = `${orgPath}/issueReports/${irId}`;
                  updates[irPath] = { id: irId, magFormId: formToSave.id, magFormNo: formToSave.formNo, requestDate: formToSave.date, items: formToSave.items, status: 'Pending', fiscalYear: formToSave.fiscalYear, itemType: formToSave.issueItemType || 'Expendable', storeId: formToSave.selectedStoreId, demandBy: formToSave.demandBy };
              }
          }
          await update(ref(db), updates);
      } catch (error) { console.error(error); alert("Error saving Mag Form"); }
  };

  const handleApproveIssueReport = async (report: IssueReportEntry) => {
    if (!currentUser) return;
    try {
        const safeOrgName = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
        const orgPath = `orgData/${safeOrgName}`;
        const currentReportSnap = await get(ref(db, `${orgPath}/issueReports/${report.id}`));
        const prevStatus = currentReportSnap.exists() ? currentReportSnap.val().status : null;
        const updates: Record<string, any> = {};

        if (report.status === 'Issued' && prevStatus !== 'Issued') {
            const invSnap = await get(ref(db, `${orgPath}/inventory`));
            const inventory: Record<string, InventoryItem> = invSnap.exists() ? invSnap.val() : {};
            const inventoryKeys = Object.keys(inventory);

            report.items.forEach(rptItem => {
                let remainingToIssue = Number(rptItem.quantity) || 0;
                const matches = inventoryKeys
                    .map(key => ({ key, data: inventory[key] }))
                    .filter(item => item.data.itemName.trim().toLowerCase() === rptItem.name.trim().toLowerCase() && item.data.storeId === report.storeId && item.data.currentQuantity > 0);
                
                for (const invMatch of matches) {
                    if (remainingToIssue <= 0) break;
                    const takeQty = Math.min(invMatch.data.currentQuantity, remainingToIssue);
                    remainingToIssue -= takeQty;
                    updates[`${orgPath}/inventory/${invMatch.key}/currentQuantity`] = invMatch.data.currentQuantity - takeQty;
                }
            });

            // AUTOMATION: Create Transfer Form (Hafa) IF AND ONLY IF linked to an Institutional Request
            if (report.magFormId) {
                const magSnap = await get(ref(db, `${orgPath}/magForms/${report.magFormId}`));
                if (magSnap.exists()) {
                    const magForm: MagFormEntry = magSnap.val();
                    if (magForm.isInstitutional && magForm.sourceOrg) {
                        const hafaId = `HF-AUTO-${report.id}`;
                        const todayBs = new NepaliDate().format('YYYY-MM-DD');
                        
                        const hafaItems: HafaItem[] = report.items.map((item, idx) => ({
                            id: Date.now() + idx,
                            codeNo: item.codeNo || '',
                            name: item.name,
                            specification: item.specification || '',
                            model: '',
                            idNo: '',
                            unit: item.unit,
                            quantity: Number(item.quantity) || 0,
                            rate: item.rate || 0,
                            totalAmount: (Number(item.quantity) || 0) * (item.rate || 0),
                            startDate: todayBs,
                            condition: 'चालू',
                            remarks: `निकासा नं. ${report.issueNo || report.id} बाट स्वतः सिर्जना`
                        }));

                        const autoHafa: HafaEntry = {
                            id: hafaId,
                            fiscalYear: report.fiscalYear || currentFiscalYear,
                            formNo: 'TBD', 
                            date: todayBs,
                            status: 'Pending',
                            decisionNo: `माग फारम नं. ${magForm.formNo}`,
                            decisionDate: magForm.date,
                            recipientOrg: magForm.sourceOrg, 
                            sourceOrg: currentUser.organizationName,
                            sourceOrgDetails: {
                                name: generalSettings.orgNameNepali,
                                subTitle: generalSettings.subTitleNepali,
                                address: generalSettings.address
                            },
                            itemType: report.itemType || 'Expendable',
                            items: hafaItems,
                            preparedBy: { name: currentUser.fullName, designation: currentUser.designation, date: todayBs },
                            approvedBy: { name: '', designation: '', date: '' }
                        };

                        // CRITICAL: Save to the PROVIDER'S database so their storekeeper sees it in Outgoing
                        updates[`orgData/${safeOrgName}/hafaEntries/${hafaId}`] = autoHafa;
                    }
                }
            }
        }
        updates[`${orgPath}/issueReports/${report.id}`] = report;
        await update(ref(db), updates);
    } catch (error) { console.error(error); alert("Error issuing report"); }
  };

  const handleApproveStockEntry = async (requestId: string, approverName: string, approverDesignation: string) => {
      if (!currentUser) return;
      try {
          const safeOrgName = currentUser.organizationName.trim().replace(/[.#$[\]]/g, "_");
          const orgPath = `orgData/${safeOrgName}`;
          const requestSnap = await get(ref(db, `${orgPath}/stockRequests/${requestId}`));
          if (!requestSnap.exists()) return;
          const request: StockEntryRequest = requestSnap.val();
          const invAllSnap = await get(ref(db, `${orgPath}/inventory`));
          const currentInvData = invAllSnap.val() || {};
          const currentInvList: InventoryItem[] = Object.keys(currentInvData).map(k => ({ ...currentInvData[k], id: k }));
          const updates: Record<string, any> = {};

          for (const item of request.items) {
              const existingItem = currentInvList.find(i => i.itemName.trim().toLowerCase() === item.itemName.trim().toLowerCase() && i.storeId === request.storeId && i.batchNo === item.batchNo);
              if (existingItem) {
                  updates[`${orgPath}/inventory/${existingItem.id}/currentQuantity`] = (Number(existingItem.currentQuantity) || 0) + (Number(item.currentQuantity) || 0);
              } else {
                  const newId = item.id.startsWith('TEMP') ? `ITEM-${Date.now()}-${Math.random().toString(36).substring(7)}` : item.id;
                  updates[`${orgPath}/inventory/${newId}`] = { ...item, id: newId, storeId: request.storeId, fiscalYear: request.fiscalYear };
              }
          }
          updates[`${orgPath}/stockRequests/${requestId}/status`] = 'Approved';
          await update(ref(db), updates);
      } catch (error) { console.error(error); alert("Error during stock approval"); }
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
          hafaEntries={hafaEntries}
          onSaveHafaEntry={handleSaveHafaEntry}
          onDeleteHafaEntry={handleDeleteHafaEntry}
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
        <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] overflow-y-auto">
          <div className="w-full max-w-[440px] py-10 animate-in fade-in zoom-in-95 duration-500">
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
