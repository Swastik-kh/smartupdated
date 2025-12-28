
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Printer, Save, ArrowLeft, Send, CheckCircle2, Clock, FileText, Eye, Search, X, AlertCircle, Building2, Loader2, Square } from 'lucide-react';
import { User, MagItem, MagFormEntry, InventoryItem, Option, Store, OrganizationSettings, IssueReportEntry, PurchaseOrderEntry } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { Select } from './Select';
import { NepaliDatePicker } from './NepaliDatePicker';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

interface LocalMagItem extends MagItem {
  isFromInventory?: boolean;
}

interface MagFaramProps {
  currentFiscalYear: string;
  currentUser: User;
  existingForms: MagFormEntry[];
  onSave: (form: MagFormEntry) => void;
  inventoryItems: InventoryItem[];
  stores?: Store[];
  generalSettings: OrganizationSettings;
  allUsers?: User[];
  issueReports: IssueReportEntry[];
  purchaseOrders: PurchaseOrderEntry[];
  onSavePurchaseOrder: (order: PurchaseOrderEntry) => void;
  onSaveIssueReport: (report: IssueReportEntry) => void;
}

const itemTypeOptions: Option[] = [
  { id: 'expendable', value: 'Expendable', label: 'खर्च हुने (Expendable)' },
  { id: 'nonExpendable', value: 'Non-Expendable', label: 'खर्च नहुने (Non-Expendable)' },
];

export const MagFaram: React.FC<MagFaramProps> = ({ 
    currentFiscalYear, 
    currentUser, 
    existingForms, 
    onSave, 
    inventoryItems, 
    generalSettings, 
    stores = [], 
    allUsers = [], 
    issueReports = [],
    purchaseOrders = [],
    onSavePurchaseOrder,
    onSaveIssueReport
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isInstitutionalMode, setIsInstitutionalMode] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [verificationData, setVerificationData] = useState({ storeId: '', itemType: '' as 'Expendable' | 'Non-Expendable' | '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableOrgs = useMemo(() => {
    const orgsWithAdmins = allUsers.filter(u => u.role === 'ADMIN').map(u => u.organizationName);
    const uniqueOrgsWithAdmins = Array.from(new Set(orgsWithAdmins)).filter(o => o !== currentUser.organizationName);
    return uniqueOrgsWithAdmins.map(o => ({ id: o, value: o, label: o }));
  }, [allUsers, currentUser.organizationName]);

  const generateMagFormNo = (forms: MagFormEntry[], fy: string) => {
    const mySourceForms = forms.filter(f => f.fiscalYear === fy && (f.sourceOrg === currentUser.organizationName || !f.sourceOrg));
    if (mySourceForms.length === 0) return "0001-MF";
    const maxNo = mySourceForms.reduce((max, f) => {
        let val = 0;
        if (typeof f.formNo === 'string') { val = parseInt(f.formNo.split('-')[0]); }
        else if (typeof f.formNo === 'number') { val = f.formNo; }
        return isNaN(val) ? max : Math.max(max, val);
    }, 0);
    return `${String(maxNo + 1).padStart(4, '0')}-MF`;
  };

  const todayBS = useMemo(() => { try { return new NepaliDate().format('YYYY-MM-DD'); } catch (e) { return ''; } }, []);

  const [items, setItems] = useState<LocalMagItem[]>([{ id: Date.now(), name: '', specification: '', unit: '', quantity: '', remarks: '', isFromInventory: false }]);
  
  const [formDetails, setFormDetails] = useState<MagFormEntry>({
    id: '', items: [], fiscalYear: currentFiscalYear, formNo: '', date: todayBS, status: 'Pending',
    demandBy: { name: currentUser.fullName, designation: currentUser.designation, date: todayBS, purpose: '' },
    recommendedBy: { name: '', designation: '', date: '' }, storeKeeper: { status: 'stock', name: '' },
    receiver: { name: '', designation: '', date: '' }, ledgerEntry: { name: '', date: '' },
    approvedBy: { name: '', designation: '', date: '' }, isViewedByRequester: true, isInstitutional: false, targetOrg: '', sourceOrg: currentUser.organizationName
  });

  useEffect(() => {
    if (!editingId && !formDetails.id) {
        setFormDetails(prev => ({ ...prev, formNo: generateMagFormNo(existingForms, currentFiscalYear) }));
    }
  }, [editingId, existingForms, currentFiscalYear]);

  const isStrictStoreKeeper = currentUser.role === 'STOREKEEPER';
  const isAdminOrApproval = ['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role);
  const isStaff = currentUser.role === 'STAFF';
  
  const canVerify = isStrictStoreKeeper || ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
  const canApprove = isAdminOrApproval;

  const isNewForm = !editingId || editingId === 'new';
  const isVerifying = !isViewOnly && !isNewForm && canVerify && formDetails.status === 'Pending';
  const isApproving = !isViewOnly && !isNewForm && canApprove && formDetails.status === 'Verified';

  const actionableForms = useMemo(() => {
      return existingForms.filter(f => {
          const isTargetedToMe = f.targetOrg === currentUser.organizationName || (!f.isInstitutional && f.sourceOrg === currentUser.organizationName);
          if (!isTargetedToMe) return false;
          if (isStrictStoreKeeper) return f.status === 'Pending';
          if (isAdminOrApproval) return f.status === 'Verified';
          return false;
      }).sort((a, b) => b.id.localeCompare(a.id));
  }, [existingForms, isStrictStoreKeeper, isAdminOrApproval, currentUser.organizationName]);

  const historyForms = useMemo(() => {
      const myOrg = currentUser.organizationName;
      let relevantForms = existingForms.filter(f => f.sourceOrg === myOrg || f.targetOrg === myOrg);
      if (isStaff) { relevantForms = relevantForms.filter(f => f.demandBy?.name === currentUser.fullName); }
      return relevantForms.sort((a, b) => b.id.localeCompare(a.id));
  }, [existingForms, isStaff, currentUser.organizationName, currentUser.fullName]);

  const itemOptions = useMemo(() => inventoryItems.map(item => ({
      id: item.id, value: item.itemName, label: `${item.itemName} (${item.unit}) - मौज्दात: ${item.currentQuantity}`, itemData: item
  })), [inventoryItems]);

  const storeOptions: Option[] = useMemo(() => stores.map(s => ({ id: s.id, value: s.id, label: s.name })), [stores]);

  const handleAddItem = () => { if (items.length < 14) setItems([...items, { id: Date.now(), name: '', specification: '', unit: '', quantity: '', remarks: '', isFromInventory: false }]); };
  const handleRemoveItem = (id: number) => { setItems(items.length > 1 ? items.filter(i => i.id !== id) : [{ id: Date.now(), name: '', specification: '', unit: '', quantity: '', remarks: '', isFromInventory: false }]); };
  const updateItem = useCallback((id: number, field: keyof LocalMagItem, value: any) => {
    setItems(prevItems => prevItems.map(item => { if (item.id === id) { const updated = { ...item, [field]: value }; if (field === 'name') updated.isFromInventory = false; return updated; } return item; }));
  }, []);

  const handleItemSelect = (id: number, option: Option) => {
    const invItem = option.itemData as InventoryItem;
    if (invItem) setItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, name: invItem.itemName, unit: invItem.unit, specification: invItem.specification || item.specification, isFromInventory: true } : item)));
  };

  const updateStoreKeeperStatus = (status: string) => { if (isViewOnly || !isVerifying) return; setFormDetails(prev => ({ ...prev, storeKeeper: { ...prev.storeKeeper, status, name: prev.storeKeeper?.name || currentUser.fullName } })); };

  const handleLoadForm = (form: MagFormEntry, viewOnly: boolean = false) => {
      setEditingId(form.id);
      setIsViewOnly(viewOnly);
      setIsInstitutionalMode(!!form.isInstitutional);
      setItems(form.items.map(item => ({ ...item, isFromInventory: inventoryItems.some(i => i.itemName === item.name) })));
      if (viewOnly && form.isViewedByRequester === false && form.sourceOrg === currentUser.organizationName) {
          const updatedForm = { ...form, isViewedByRequester: true };
          onSave(updatedForm);
          setFormDetails(updatedForm);
      } else { setFormDetails({ ...form }); }
      setValidationError(null);
  };

  const finalizeSave = (extraData?: { storeId: string, itemType: 'Expendable' | 'Non-Expendable' }) => {
    setIsSubmitting(true);
    let nextStatus = formDetails.status || 'Pending';
    let nextIsViewed = true;
    let updatedStoreKeeper = { ...formDetails.storeKeeper };
    let updatedApprovedBy = { ...formDetails.approvedBy };
    let updatedReceiver = { ...formDetails.receiver };
    let updatedLedgerEntry = { ...formDetails.ledgerEntry };

    if (editingId && editingId !== 'new') {
        if (isVerifying) { 
            nextStatus = 'Verified'; 
            nextIsViewed = false; 
            updatedStoreKeeper.name = currentUser.fullName; 
        }
        else if (isApproving) { 
            nextStatus = 'Approved'; 
            nextIsViewed = false; 
            updatedApprovedBy = { 
                ...updatedApprovedBy,
                name: currentUser.fullName, 
                designation: currentUser.designation, 
                date: todayBS 
            }; 
        }
    }

    const itemsToSave = items.map(({ isFromInventory, ...rest }) => rest);
    const newForm: MagFormEntry = { 
        ...formDetails, 
        id: editingId === 'new' || !editingId ? Date.now().toString() : editingId, 
        items: itemsToSave, 
        status: nextStatus, 
        isViewedByRequester: nextIsViewed, 
        storeKeeper: updatedStoreKeeper, 
        approvedBy: updatedApprovedBy,
        receiver: updatedReceiver,
        ledgerEntry: updatedLedgerEntry,
        isInstitutional: isInstitutionalMode, 
        sourceOrg: formDetails.sourceOrg || currentUser.organizationName 
    };

    if (extraData?.storeId) newForm.selectedStoreId = extraData.storeId;
    if (extraData?.itemType) newForm.issueItemType = extraData.itemType as any;

    try {
        onSave(newForm);
        
        // --- AUTO-BRIDGE LOGIC ---
        // स्वीकृत भएपछि स्वतः अर्को चरणमा पठाउने
        if (isApproving && nextStatus === 'Approved' && !newForm.isInstitutional) {
            if (newForm.storeKeeper?.status === 'market') {
                // १. खरिद आदेश (PO) सिर्जना गर्ने
                const alreadyHasPO = purchaseOrders.some(po => po.magFormId === newForm.id);
                if (!alreadyHasPO) {
                    const newPO: PurchaseOrderEntry = {
                        id: `PO-${newForm.id}`,
                        magFormId: newForm.id,
                        magFormNo: newForm.formNo,
                        requestDate: newForm.date,
                        items: newForm.items,
                        status: 'Pending',
                        fiscalYear: newForm.fiscalYear
                    };
                    onSavePurchaseOrder(newPO);
                }
            } else if (newForm.storeKeeper?.status === 'stock') {
                // २. निकासा प्रतिवेदन (Issue Report) सिर्जना गर्ने
                const alreadyHasIR = issueReports.some(ir => ir.magFormId === newForm.id);
                if (!alreadyHasIR) {
                    const newIR: IssueReportEntry = {
                        id: `IR-${newForm.id}`,
                        magFormId: newForm.id,
                        magFormNo: newForm.formNo,
                        requestDate: newForm.date,
                        items: newForm.items,
                        status: 'Pending',
                        fiscalYear: newForm.fiscalYear,
                        itemType: newForm.issueItemType,
                        storeId: newForm.selectedStoreId,
                        demandBy: newForm.demandBy
                    };
                    onSaveIssueReport(newIR);
                }
            }
        }

        alert(isInstitutionalMode ? `माग फारम सुरक्षित भयो र ${newForm.targetOrg} मा पठाइयो।` : (isApproving ? "माग फारम स्वीकृत भयो र स्टोरमा पठाइयो।" : "माग फारम सुरक्षित भयो।"));
        setShowVerifyPopup(false);
        handleReset();
    } catch (e) {
        alert("फारम सुरक्षित गर्दा प्राविधिक समस्या आयो।");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    if (isSubmitting) return;
    setValidationError(null);
    if (!formDetails.date) { setValidationError("कृपया मिति भर्नुहोस्।"); return; }
    if (!formDetails.demandBy?.purpose) { setValidationError("कृपया प्रयोजन भर्नुहोस्।"); return; }
    if (isInstitutionalMode && !formDetails.targetOrg) { setValidationError("कृपया माग गर्ने संस्था छान्नुहोस्।"); return; }
    if (items.filter(i => i.name.trim() !== '').length === 0) { setValidationError("कृपया कम्तिमा एउटा सामानको नाम भर्नुहोस्।"); return; }
    
    if (isVerifying && formDetails.storeKeeper?.status === 'stock') {
        const insufficientItems: string[] = [];
        
        items.forEach(item => {
            if (!item.name.trim()) return;
            const totalAvailable = inventoryItems
                .filter(i => i.itemName.trim().toLowerCase() === item.name.trim().toLowerCase())
                .reduce((sum, i) => sum + (Number(i.currentQuantity) || 0), 0);
            
            const requestedQty = parseFloat(item.quantity) || 0;
            if (requestedQty > totalAvailable) {
                insufficientItems.push(`${item.name} (मौज्दात: ${totalAvailable}, माग: ${requestedQty})`);
            }
        });

        if (insufficientItems.length > 0) {
            setValidationError(`मौज्दात अपर्याप्त छ! निम्न सामानहरू स्टोरमा पर्याप्त छैनन्:\n${insufficientItems.join('\n')}\n\nकृपया "बजारबाट खरिद" विकल्प रोज्नुहोस् वा मौज्दात मिलान गर्नुहोस्।`);
            return;
        }
    }

    if (!isNewForm && (formDetails.status === 'Approved' || formDetails.status === 'Rejected')) {
        alert("यो फारम पहिले नै प्रोसेस भइसकेको छ।");
        return;
    }

    if (isVerifying && formDetails.storeKeeper?.status === 'stock') { setShowVerifyPopup(true); return; }
    finalizeSave();
  };

  const handleReject = () => {
      if (isSubmitting) return;
      if (!rejectReason.trim()) { alert("कारण खुलाउनुहोस्।"); return; }
      setIsSubmitting(true);
      const newForm: MagFormEntry = { ...formDetails, status: 'Rejected', rejectionReason: rejectReason, isViewedByRequester: false };
      try {
          onSave(newForm);
          alert("अस्वीकृत गरियो।");
          setShowRejectModal(false);
          handleReset();
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleReset = () => {
    setEditingId(null); setIsViewOnly(false); setIsInstitutionalMode(false); setValidationError(null); setShowVerifyPopup(false); setShowRejectModal(false); setRejectReason('');
    setIsSubmitting(false);
    setItems([{ id: Date.now(), name: '', specification: '', unit: '', quantity: '', remarks: '', isFromInventory: false }]);
    setFormDetails({ id: '', items: [], fiscalYear: currentFiscalYear, formNo: '', date: todayBS, status: 'Pending', demandBy: { name: currentUser.fullName, designation: currentUser.designation, date: todayBS, purpose: '' }, recommendedBy: { name: '', designation: '', date: '' }, storeKeeper: { status: 'stock', name: '' }, receiver: { name: '', designation: '', date: '' }, ledgerEntry: { name: '', date: '' }, approvedBy: { name: '', designation: '', date: '' }, isViewedByRequester: true, isInstitutional: false, targetOrg: '', sourceOrg: currentUser.organizationName });
  };

  const inputReadOnlyClass = "border-b border-dotted border-slate-800 flex-1 outline-none bg-slate-50 text-slate-500 cursor-not-allowed px-1 rounded-sm";
  const inputEditableClass = "border-b border-dotted border-slate-800 flex-1 outline-none bg-white focus:bg-primary-50 px-1 rounded-sm";

  if (!editingId) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 font-nepali">माग फारम व्यवस्थापन (Mag Faram)</h2>
                    <p className="text-sm text-slate-500 font-nepali">म.ले.प. फारम नं ४०१ अनुसारको माग फारम</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { setEditingId('new'); setIsInstitutionalMode(true); }} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all font-bold font-nepali">
                        <Building2 size={20} /> संस्थागत माग फारम
                    </button>
                    <button onClick={() => { setEditingId('new'); setIsInstitutionalMode(false); }} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-primary-700 transition-all font-bold font-nepali">
                        <Plus size={20} /> नयाँ माग फारम थप्नुहोस्
                    </button>
                </div>
            </div>

            {actionableForms.length > 0 && (
                <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden mb-6">
                    <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex justify-between items-center text-orange-800">
                        <div className="flex items-center gap-2"><Clock size={18} /><h3 className="font-bold font-nepali">
                            {isStrictStoreKeeper ? 'प्रमाणिकरणको लागि बाँकी (Actionable)' : 'स्वीकृतिको लागि बाँकी (Actionable)'}
                        </h3></div>
                        <span className="bg-orange-200 text-xs font-bold px-2 py-0.5 rounded-full">{actionableForms.length} Forms</span>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr><th className="px-6 py-3">Form No</th><th className="px-6 py-3">Requested By</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {actionableForms.map(f => (
                                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700">#{f.formNo}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{f.demandBy?.name}</div>
                                        <div className="text-[10px] text-indigo-600">{f.isInstitutional ? `संस्थागत: ${f.sourceOrg}` : 'Internal'}</div>
                                    </td>
                                    <td className="px-6 py-4"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{f.status}</span></td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleLoadForm(f)} className="text-primary-600 font-bold hover:underline bg-primary-50 px-3 py-1.5 rounded-lg">
                                            {isStrictStoreKeeper ? 'Verify Now' : 'Approve Now'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-slate-700 font-bold font-nepali flex items-center gap-2"><FileText size={18} /> फारम इतिहास (All Records)</div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr><th className="px-6 py-3">Form No</th><th className="px-6 py-3">Details</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {historyForms.map(f => {
                            const isIncoming = f.targetOrg === currentUser.organizationName;
                            const isNewUpdate = f.isViewedByRequester === false && f.sourceOrg === currentUser.organizationName;
                            return (
                                <tr key={f.id} className={`hover:bg-slate-50 ${isNewUpdate ? 'bg-primary-50/30' : ''}`}>
                                    <td className="px-6 py-3 font-mono font-bold">#{f.formNo}</td>
                                    <td className="px-6 py-3">
                                        <div className="text-xs font-bold">{f.isInstitutional ? (isIncoming ? `Incoming from: ${f.sourceOrg}` : `Outgoing to: ${f.targetOrg}`) : 'Internal Request'}</div>
                                        <div className="text-[10px] text-slate-400 font-nepali">{f.date} | Requested by: {f.demandBy?.name}</div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${f.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : f.status === 'Verified' ? 'bg-blue-50 text-blue-700 border-blue-200' : f.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : f.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{f.status}</span>
                                            {isNewUpdate && <span className="flex h-5 items-center gap-1 animate-pulse"><span className="h-2 w-2 rounded-full bg-red-500"></span><span className="text-[10px] font-bold text-red-600 uppercase">NEW</span></span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right"><button onClick={() => handleLoadForm(f, true)} className="p-2 text-slate-400 hover:text-primary-600"><Eye size={18} /></button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
          <div className="flex items-center gap-3">
              <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
              <h2 className="font-bold text-slate-700 font-nepali text-lg">{isViewOnly ? 'माग फारम प्रिभ्यु' : isInstitutionalMode ? 'संस्थागत माग फारम' : 'माग फारम'}</h2>
          </div>
          <div className="flex gap-2">
            {!isViewOnly && (
                <>
                    {(isVerifying || isApproving) && (
                        <button 
                            onClick={() => setShowRejectModal(true)} 
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium border border-red-200 disabled:opacity-50"
                        >
                            <X size={18} /> Reject
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSubmitting ? 'प्रक्रियामा...' : (isVerifying ? 'प्रमाणित गर्नुहोस्' : isApproving ? 'स्वीकृत गर्नुहोस्' : 'माग पठाउनुहोस्')}
                    </button>
                </>
            )}
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-medium shadow-sm"><Printer size={18} /> प्रिन्ट</button>
          </div>
       </div>

       {validationError && (
           <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 no-print animate-in slide-in-from-top-2">
               <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
               <div className="flex-1">
                   <h4 className="font-bold text-red-800 text-sm font-nepali">त्रुटि (Error)</h4>
                   <p className="text-red-700 text-sm font-nepali mt-1 whitespace-pre-wrap">{validationError}</p>
               </div>
               <button onClick={() => setValidationError(null)} className="text-red-400 hover:text-red-600"><X size={18} /></button>
           </div>
       )}

       <div id="mag-form-print" className="bg-white p-10 max-w-[210mm] mx-auto min-h-[297mm] font-nepali text-slate-900 print:p-0 print:shadow-none print:w-full border shadow-lg rounded-xl">
          <div className="text-right font-bold text-[10px] mb-2">म.ले.प.फारम नं: ४०१</div>
          
          <div className="mb-6">
              <div className="flex items-start justify-between">
                  <div className="w-24 pt-1"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emblem_of_Nepal.svg/1200px-Emblem_of_Nepal.svg.png" alt="Emblem" className="h-20 w-20 object-contain" /></div>
                  <div className="flex-1 text-center">
                      <h1 className="text-lg font-bold">{generalSettings.orgNameNepali}</h1>
                      <h2 className="text-base font-bold">{generalSettings.subTitleNepali}</h2>
                      {generalSettings.subTitleNepali2 && <h3 className="text-sm font-bold">{generalSettings.subTitleNepali2}</h3>}
                      {generalSettings.subTitleNepali3 && <h3 className="text-base font-bold">{generalSettings.subTitleNepali3}</h3>}
                      <div className="text-[10px] mt-1.5 space-x-1 font-medium text-slate-600">
                          {generalSettings.address && <span>{generalSettings.address}</span>}
                          {generalSettings.phone && <span> | फोन नं: {generalSettings.phone}</span>}
                          {generalSettings.email && <span> | ईमेल: {generalSettings.email}</span>}
                          {generalSettings.website && <span> | वेबसाइट: {generalSettings.website}</span>}
                          {generalSettings.panNo && <span> | पान/भ्याट नं: {generalSettings.panNo}</span>}
                      </div>
                  </div>
                  <div className="w-24"></div> 
              </div>
              <div className="text-center mt-6"><h2 className="text-lg font-bold underline underline-offset-4">माग फारम</h2></div>
          </div>

          <div className="flex justify-between items-start mb-4 text-sm">
              <div className="flex-1">
                {isInstitutionalMode && (
                    <div className="max-w-xs space-y-2">
                        <label className="font-bold text-primary-700 block text-xs">सामान माग गरिएको संस्था:</label>
                        {isViewOnly ? <p className="font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">{formDetails.targetOrg}</p> : <Select options={availableOrgs} value={formDetails.targetOrg || ''} onChange={e => setFormDetails({...formDetails, targetOrg: e.target.value})} label="" placeholder="संस्था छान्नुहोस्..." className="!h-9 !bg-indigo-50 font-bold" />}
                    </div>
                )}
              </div>
              <div className="space-y-1 w-44 shrink-0 text-xs">
                  <div className="flex justify-between"><span>आर्थिक वर्ष :</span><span className="font-bold border-b border-dotted px-1">{currentFiscalYear}</span></div>
                  <div className="flex justify-between"><span>माग फारम नं :</span><span className="font-bold border-b border-dotted px-1 text-red-600">{formDetails.formNo}</span></div>
                  <div className="flex justify-between items-center gap-2"><span>मिति :</span><NepaliDatePicker value={formDetails.date} onChange={val => setFormDetails({...formDetails, date: val})} label="" hideIcon={true} inputClassName="!border-none !bg-transparent !p-0 !text-right !font-bold !h-auto" disabled={isViewOnly || !isNewForm} popupAlign="right" /></div>
              </div>
          </div>

          <table className="w-full border-collapse border border-slate-800 text-center text-xs">
              <thead className="bg-slate-50 font-bold">
                  <tr><th className="border border-slate-800 p-1 w-8">क्र.सं.</th><th className="border border-slate-800 p-1">सामानको नाम</th><th className="border border-slate-800 p-1 w-32">स्पेसिफिकेशन</th><th className="border border-slate-800 p-0.5 w-32" colSpan={2}>माग गरिएको</th><th className="border border-slate-800 p-1 w-24">कैफियत</th><th className="border border-slate-800 p-1 w-10 no-print"></th></tr>
                  <tr><th className="border border-slate-800 p-0.5"></th><th className="border border-slate-800 p-0.5"></th><th className="border border-slate-800 p-0.5"></th><th className="border border-slate-800 p-0.5">एकाई</th><th className="border border-slate-800 p-0.5">परिमाण</th><th className="border border-slate-800 p-0.5"></th><th className="border border-slate-800 p-0.5 no-print"></th></tr>
              </thead>
              <tbody>
                  {items.map((item, idx) => (
                      <tr key={item.id}>
                          <td className="border border-slate-800 p-1">{idx + 1}</td>
                          <td className="border border-slate-800 p-0 text-left relative group">
                              {!isViewOnly && isNewForm ? <SearchableSelect options={itemOptions} value={item.name} onChange={val => updateItem(item.id, 'name', val)} onSelect={opt => handleItemSelect(item.id, opt)} className="!border-none !p-1" placeholder="सामान छान्नुहोस्" /> : <div className="px-2 font-bold">{item.name}</div>}
                          </td>
                          <td className="border border-slate-800 p-1"><input disabled={isViewOnly || !isNewForm} value={item.specification} onChange={e => updateItem(item.id, 'specification', e.target.value)} className="w-full text-left outline-none bg-transparent px-1" /></td>
                          <td className="border border-slate-800 p-1"><input disabled={isViewOnly || !isNewForm} value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} className="w-full text-center outline-none bg-transparent" /></td>
                          <td className="border border-slate-800 p-1 font-bold"><input disabled={isViewOnly || !isNewForm} value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="w-full text-center outline-none bg-transparent" /></td>
                          <td className="border border-slate-800 p-1"><input disabled={isViewOnly || !isNewForm} value={item.remarks} onChange={e => updateItem(item.id, 'remarks', e.target.value)} className="w-full text-left outline-none bg-transparent px-1" /></td>
                          <td className="border border-slate-800 p-1 no-print">{!isViewOnly && isNewForm && <button onClick={() => handleRemoveItem(item.id)} className="text-red-500"><Trash2 size={14} /></button>}</td>
                      </tr>
                  ))}
              </tbody>
          </table>

          {isNewForm && <button onClick={handleAddItem} className="mt-2 no-print text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded border border-dashed border-primary-200"><Plus size={12} /> थप्नुहोस्</button>}

          <div className="mt-8 text-[11px] grid grid-cols-12 gap-y-10">
              <div className="col-span-4 pr-2">
                  <div className="font-bold mb-4">माग गर्नेको:</div>
                  <div className="space-y-1">
                      <div className="flex gap-1"><span>नाम:</span><input value={formDetails.demandBy?.name} className={inputReadOnlyClass} disabled/></div>
                      <div className="flex gap-1"><span>पद:</span><input value={formDetails.demandBy?.designation} className={inputReadOnlyClass} disabled/></div>
                      <div className="flex gap-1"><span>मिति:</span><input value={formDetails.demandBy?.date} className={inputReadOnlyClass} disabled/></div>
                      <div className="flex gap-1"><span>प्रयोजन:</span><input value={formDetails.demandBy?.purpose} onChange={e => setFormDetails({...formDetails, demandBy: {...formDetails.demandBy!, purpose: e.target.value}})} className={isViewOnly || !isNewForm ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isNewForm}/></div>
                  </div>
              </div>

              <div className="col-span-4 px-2">
                  <div className="font-bold mb-4">सिफारिस गर्ने:.......</div>
                  <div className="space-y-1">
                      <div className="flex gap-1"><span>नाम:</span><input value={formDetails.recommendedBy?.name} onChange={e => setFormDetails({...formDetails, recommendedBy: {...formDetails.recommendedBy!, name: e.target.value}})} className={isViewOnly || isNewForm || !isAdminOrApproval ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || isNewForm || !isAdminOrApproval}/></div>
                      <div className="flex gap-1"><span>पद:</span><input value={formDetails.recommendedBy?.designation} onChange={e => setFormDetails({...formDetails, recommendedBy: {...formDetails.recommendedBy!, designation: e.target.value}})} className={isViewOnly || isNewForm || !isAdminOrApproval ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || isNewForm || !isAdminOrApproval}/></div>
                  </div>
              </div>

              <div className="col-span-4 pl-2">
                  <div className="font-bold mb-2">स्टोरकिपरले भर्ने:</div>
                  <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2"><button type="button" onClick={() => updateStoreKeeperStatus('market')} className={`${!isVerifying ? 'opacity-50' : ''}`}>{formDetails.storeKeeper?.status === 'market' ? <CheckCircle2 size={14} className="text-primary-600"/> : <Square size={14}/>}</button><span>क) बजारबाट खरिद</span></div>
                      <div className="flex items-center gap-2"><button type="button" onClick={() => updateStoreKeeperStatus('stock')} className={`${!isVerifying ? 'opacity-50' : ''}`}>{formDetails.storeKeeper?.status === 'stock' ? <CheckCircle2 size={14} className="text-primary-600"/> : <Square size={14}/>}</button><span>ख) मौज्दातमा रहेको</span></div>
                  </div>
                  <div className="space-y-1"><div className="mb-2">स्टोरकिपर:</div><div className="flex gap-1"><span>नाम:</span><input value={formDetails.storeKeeper?.name} onChange={e => setFormDetails({...formDetails, storeKeeper: {...formDetails.storeKeeper!, name: e.target.value}})} className={isViewOnly || !isVerifying ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isVerifying}/></div></div>
              </div>

              <div className="col-span-4 pr-2">
                  <div className="font-bold mb-4">मालसामान बुझिलिने:</div>
                  <div className="space-y-1">
                      <div className="flex gap-1"><span>नाम:</span><input value={formDetails.receiver?.name} onChange={e => setFormDetails({...formDetails, receiver: {...formDetails.receiver!, name: e.target.value}})} className={isViewOnly || !isVerifying ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isVerifying}/></div>
                      <div className="flex gap-1"><span>पद:</span><input value={formDetails.receiver?.designation} onChange={e => setFormDetails({...formDetails, receiver: {...formDetails.receiver!, designation: e.target.value}})} className={isViewOnly || !isVerifying ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isVerifying}/></div>
                      <div className="flex gap-1"><span>मिति:</span><input value={formDetails.receiver?.date} onChange={e => setFormDetails({...formDetails, receiver: {...formDetails.receiver!, date: e.target.value}})} className={isViewOnly || !isVerifying ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isVerifying}/></div>
                  </div>
              </div>

              <div className="col-span-4 px-2">
                  <div className="font-bold mb-4">खातामा चढाउने:.......</div>
                  <div className="space-y-1">
                      <div className="flex gap-1"><span>नाम:</span><input value={formDetails.ledgerEntry?.name} onChange={e => setFormDetails({...formDetails, ledgerEntry: {...formDetails.ledgerEntry!, name: e.target.value}})} className={isViewOnly || !isVerifying ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isVerifying}/></div>
                      <div className="flex gap-1"><span>पद:</span><input value={formDetails.ledgerEntry?.designation} onChange={e => setFormDetails({...formDetails, ledgerEntry: {...formDetails.ledgerEntry!, designation: e.target.value}})} className={isViewOnly || !isVerifying ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isVerifying}/></div>
                      <div className="flex gap-1"><span>मिति:</span><input value={formDetails.ledgerEntry?.date} onChange={e => setFormDetails({...formDetails, ledgerEntry: {...formDetails.ledgerEntry!, date: e.target.value}})} className={isViewOnly || !isVerifying ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isVerifying}/></div>
                  </div>
              </div>

              <div className="col-span-4 pl-2">
                  <div className="font-bold mb-4">स्वीकृत गर्ने:.......</div>
                  <div className="space-y-1">
                      <div className="flex gap-1"><span>नाम:</span><input value={formDetails.approvedBy?.name} onChange={e => setFormDetails({...formDetails, approvedBy: {...formDetails.approvedBy!, name: e.target.value}})} className={isViewOnly || !isApproving ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isApproving}/></div>
                      <div className="flex gap-1"><span>पद:</span><input value={formDetails.approvedBy?.designation} onChange={e => setFormDetails({...formDetails, approvedBy: {...formDetails.approvedBy!, designation: e.target.value}})} className={isViewOnly || !isApproving ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isApproving}/></div>
                      <div className="flex gap-1"><span>मिति:</span><input value={formDetails.approvedBy?.date} onChange={e => setFormDetails({...formDetails, approvedBy: {...formDetails.approvedBy!, date: e.target.value}})} className={isViewOnly || !isApproving ? inputReadOnlyClass : inputEditableClass} disabled={isViewOnly || !isApproving}/></div>
                  </div>
              </div>
          </div>
       </div>

       {showRejectModal && (
           <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowRejectModal(false)}></div>
               <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
                    <h3 className="font-bold font-nepali text-lg text-red-600">अस्वीकार गर्नुहोस्</h3>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="कारण लेख्नुहोस्..." className="w-full border rounded-xl p-4 min-h-[120px] outline-none focus:ring-2 focus:ring-red-500" disabled={isSubmitting} />
                    <div className="flex gap-3">
                        <button onClick={() => setShowRejectModal(false)} disabled={isSubmitting} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold disabled:opacity-50">रद्द</button>
                        <button onClick={handleReject} disabled={isSubmitting} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold disabled:opacity-70 flex items-center justify-center gap-2">
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            अस्वीकार गर्नुहोस्
                        </button>
                    </div>
               </div>
           </div>
       )}

       {showVerifyPopup && (
           <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowVerifyPopup(false)}></div>
               <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
                    <h3 className="font-bold font-nepali text-lg text-indigo-600">निकासा विवरण (Verification)</h3>
                    <div className="space-y-4">
                        <Select label="गोदाम/स्टोर छान्नुहोस्" options={storeOptions} value={verificationData.storeId} onChange={e => setVerificationData({...verificationData, storeId: e.target.value})} required disabled={isSubmitting} />
                        <Select label="सामानको प्रकार" options={itemTypeOptions} value={verificationData.itemType} onChange={e => setVerificationData({...verificationData, itemType: e.target.value as any})} required disabled={isSubmitting} />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowVerifyPopup(false)} disabled={isSubmitting} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold disabled:opacity-50">रद्द</button>
                        <button 
                            onClick={() => { if (!verificationData.storeId || !verificationData.itemType) { alert("विवरण अपूर्ण छ।"); return; } finalizeSave(verificationData as any); }} 
                            disabled={isSubmitting} 
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            प्रमाणित गर्नुहोस्
                        </button>
                    </div>
               </div>
           </div>
       )}
    </div>
  );
};
