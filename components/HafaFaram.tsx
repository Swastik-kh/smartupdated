
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Printer, Save, ArrowLeft, Send, CheckCircle2, FileText, Search, Clock, ShieldCheck, Warehouse, Layers, X, AlertCircle, Eye, UserCheck, Loader2, DownloadCloud, UploadCloud, ArrowRightLeft, Building2, Sparkles } from 'lucide-react';
import { User, HafaEntry, HafaItem, InventoryItem, OrganizationSettings, Option, Store } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { Select } from './Select';
import { NepaliDatePicker } from './NepaliDatePicker';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

interface HafaFaramProps {
  currentFiscalYear: string;
  currentUser: User;
  existingEntries: HafaEntry[];
  onSave: (entry: HafaEntry) => void;
  onDelete?: (id: string) => void;
  inventoryItems: InventoryItem[];
  stores: Store[];
  generalSettings: OrganizationSettings;
  users?: User[]; 
}

export const HafaFaram: React.FC<HafaFaramProps> = ({ 
    currentFiscalYear, 
    currentUser, 
    existingEntries, 
    onSave, 
    onDelete,
    inventoryItems, 
    stores,
    generalSettings,
    users = []
}) => {
    const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const todayBS = useMemo(() => {
        try { return new NepaliDate().format('YYYY-MM-DD'); } catch (e) { return ''; }
    }, []);

    const [items, setItems] = useState<HafaItem[]>([
        { id: Date.now(), codeNo: '', name: '', specification: '', model: '', idNo: '', unit: '', quantity: 1, rate: 0, totalAmount: 0, startDate: '', condition: 'चालू', remarks: '' }
    ]);

    const isApprover = ['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role);
    const isStoreKeeper = currentUser.role === 'STOREKEEPER';

    const [formDetails, setFormDetails] = useState<HafaEntry>({
        id: '',
        fiscalYear: currentFiscalYear,
        formNo: '',
        date: '', 
        status: 'Pending',
        decisionNo: '',
        decisionDate: '',
        recipientOrg: '',
        sourceOrg: currentUser.organizationName,
        itemType: 'Expendable',
        items: [],
        preparedBy: { name: isStoreKeeper ? currentUser.fullName : '', designation: isStoreKeeper ? currentUser.designation : '', date: '' },
        approvedBy: { name: '', designation: '', date: '' },
        recipientPreparedBy: { name: '', designation: '', date: '' },
        recipientApprovedBy: { name: '', designation: '', date: '' }
    });

    const itemOptions = useMemo(() => inventoryItems.map(item => ({
        id: item.id,
        value: item.itemName,
        label: `${item.itemName} (${item.unit}) - [${item.uniqueCode || item.sanketNo || ''}]`,
        itemData: item
    })), [inventoryItems]);

    // Robust filtering for current user's organization
    const outgoingEntries = useMemo(() => {
        const myOrg = currentUser.organizationName.trim().toLowerCase();
        return existingEntries.filter(e => e.sourceOrg?.trim().toLowerCase() === myOrg);
    }, [existingEntries, currentUser.organizationName]);

    const incomingEntries = useMemo(() => {
        const myOrg = currentUser.organizationName.trim().toLowerCase();
        return existingEntries.filter(e => e.recipientOrg?.trim().toLowerCase() === myOrg);
    }, [existingEntries, currentUser.organizationName]);

    const actionableEntries = useMemo(() => {
        if (activeTab === 'outgoing') {
            // For sender: Forms that are Pending need to be finalizing by Storekeeper or Approved by Admin
            return outgoingEntries.filter(e => e.status === 'Pending').sort((a, b) => b.id.localeCompare(a.id));
        } else {
            // For recipient: Forms Approved by sender but not yet acknowledged by recipient
            return incomingEntries.filter(e => e.status === 'Approved' && !e.recipientApprovedBy?.name).sort((a, b) => b.id.localeCompare(a.id));
        }
    }, [activeTab, outgoingEntries, incomingEntries]);

    const historyEntries = useMemo(() => {
        if (activeTab === 'outgoing') {
            return outgoingEntries.filter(e => e.status !== 'Pending').sort((a, b) => b.id.localeCompare(a.id));
        } else {
            return incomingEntries.sort((a, b) => b.id.localeCompare(a.id));
        }
    }, [activeTab, outgoingEntries, incomingEntries]);

    const generateFormNo = useCallback(() => {
        const fyEntries = outgoingEntries.filter(e => e.fiscalYear === currentFiscalYear && e.formNo !== 'TBD');
        if (fyEntries.length === 0) return "001-HF";
        const maxNo = fyEntries.reduce((max, e) => {
            const parts = e.formNo.split('-');
            const val = parseInt(parts[0]);
            return isNaN(val) ? max : Math.max(max, val);
        }, 0);
        return `${String(maxNo + 1).padStart(3, '0')}-HF`;
    }, [outgoingEntries, currentFiscalYear]);

    useEffect(() => {
        if (!isEditing && !editingId && activeTab === 'outgoing') {
            setFormDetails(prev => ({ ...prev, formNo: generateFormNo() }));
        }
    }, [isEditing, editingId, generateFormNo, activeTab]);

    const handleAddItem = () => {
        if (items.length < 15) {
            setItems([...items, { id: Date.now(), codeNo: '', name: '', specification: '', model: '', idNo: '', unit: '', quantity: 1, rate: 0, totalAmount: 0, startDate: '', condition: 'चालू', remarks: '' }]);
        }
    };

    const handleRemoveItem = (id: number) => {
        if (items.length > 1) setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: number, field: keyof HafaItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'rate') {
                    const q = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
                    const r = field === 'rate' ? parseFloat(value) || 0 : item.rate;
                    updated.totalAmount = q * r;
                }
                return updated;
            }
            return item;
        }));
    };

    const handleItemSelect = (id: number, option: Option) => {
        const inv = option.itemData as InventoryItem;
        if (inv) {
            setItems(items.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        name: inv.itemName,
                        unit: inv.unit,
                        codeNo: inv.uniqueCode || inv.sanketNo || '',
                        rate: inv.rate || 0,
                        totalAmount: inv.rate ? (item.quantity * inv.rate) : 0,
                        specification: inv.specification || '',
                        startDate: inv.lastUpdateDateBs || ''
                    };
                }
                return item;
            }));
        }
    };

    const handleSave = (statusToSet: 'Pending' | 'Approved' | 'Rejected' = 'Pending') => {
        if (isSubmitting) return;
        setValidationError(null);
        
        if (!formDetails.date) { setValidationError("हस्तान्तरण गरिएको मिति आवश्यक छ।"); return; }
        if (!formDetails.recipientOrg) { setValidationError("प्राप्त गर्ने कार्यालयको नाम आवश्यक छ।"); return; }
        
        setIsSubmitting(true);
        let updatedPreparedBy = { ...formDetails.preparedBy };
        let updatedApprovedBy = { ...formDetails.approvedBy };
        let updatedRecipientPrepared = { ...formDetails.recipientPreparedBy };
        let updatedRecipientApproved = { ...formDetails.recipientApprovedBy };

        if (activeTab === 'outgoing') {
            if (statusToSet === 'Pending' && isStoreKeeper) {
                updatedPreparedBy = { name: currentUser.fullName, designation: currentUser.designation, date: formDetails.date };
            }
            if (statusToSet === 'Approved' && isApprover) {
                updatedApprovedBy = { name: currentUser.fullName, designation: currentUser.designation, date: formDetails.date };
            }
        } else {
            if (isStoreKeeper) {
                updatedRecipientPrepared = { name: currentUser.fullName, designation: currentUser.designation, date: todayBS };
            }
            if (isApprover) {
                updatedRecipientApproved = { name: currentUser.fullName, designation: currentUser.designation, date: todayBS };
            }
        }

        const entry: HafaEntry = {
            ...formDetails,
            id: editingId && editingId !== 'new' ? editingId : Date.now().toString(),
            items: items,
            status: statusToSet,
            preparedBy: updatedPreparedBy,
            approvedBy: updatedApprovedBy,
            recipientPreparedBy: updatedRecipientPrepared,
            recipientApprovedBy: updatedRecipientApproved
        };

        try {
            onSave(entry);
            setSuccessMessage(statusToSet === 'Approved' ? "हस्तान्तरण फारम सफलतापूर्वक स्वीकृत भयो।" : "हस्तान्तरण फारम सुरक्षित गरियो।");
            setTimeout(() => handleReset(), 2000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm("के तपाईं यो हस्तान्तरण फारम सधैंको लागि मेटाउन चाहनुहुन्छ? यो कार्य फिर्ता गर्न सकिने छैन।")) {
            if (onDelete) {
                onDelete(id);
                setSuccessMessage("फारम सफलतापूर्वक हटाइयो।");
                setTimeout(() => setSuccessMessage(null), 2000);
                if (editingId) handleReset();
            }
        }
    };

    const handleReset = () => {
        setIsEditing(false);
        setEditingId(null);
        setIsViewOnly(false);
        setValidationError(null);
        setSuccessMessage(null);
        setIsSubmitting(false);
        setItems([{ id: Date.now(), codeNo: '', name: '', specification: '', model: '', idNo: '', unit: '', quantity: 1, rate: 0, totalAmount: 0, startDate: '', condition: 'चालू', remarks: '' }]);
        setFormDetails({
            id: '', fiscalYear: currentFiscalYear, formNo: generateFormNo(), date: '', 
            status: 'Pending',
            decisionNo: '', decisionDate: '', recipientOrg: '', sourceOrg: currentUser.organizationName, itemType: 'Expendable', items: [],
            preparedBy: { name: isStoreKeeper ? currentUser.fullName : '', designation: isStoreKeeper ? currentUser.designation : '', date: '' },
            approvedBy: { name: '', designation: '', date: '' },
            recipientPreparedBy: { name: '', designation: '', date: '' },
            recipientApprovedBy: { name: '', designation: '', date: '' }
        });
    };

    const handleLoadEntry = (entry: HafaEntry, viewOnly: boolean = false) => {
        setEditingId(entry.id);
        setIsEditing(true);
        setIsViewOnly(viewOnly);
        
        // If it's auto-generated and storekeeper is loading it for first time
        const initialFormNo = (entry.formNo === 'TBD' && activeTab === 'outgoing') ? generateFormNo() : entry.formNo;

        setFormDetails({
            ...entry,
            formNo: initialFormNo
        });
        setItems(entry.items);
        setValidationError(null);
        setSuccessMessage(null);
        setIsSubmitting(false);
    };

    const totalVal = items.reduce((sum, i) => sum + i.totalAmount, 0);

    if (!isEditing) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 font-nepali flex items-center gap-2">
                           <ArrowRightLeft className="text-primary-600" /> हस्तान्तरण फाराम व्यवस्थापन (Transfer Management)
                        </h2>
                        <p className="text-sm text-slate-500 font-nepali">म.ले.प. फारम नं ४०६ अनुसारको हस्तान्तरण प्रक्रिया</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setActiveTab('outgoing')} 
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'outgoing' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500'}`}
                            >
                                <UploadCloud size={14} /> पठाएको (Outgoing)
                                {outgoingEntries.filter(e => e.status === 'Pending').length > 0 && (
                                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse ml-1"></span>
                                )}
                            </button>
                            <button 
                                onClick={() => setActiveTab('incoming')} 
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'incoming' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                            >
                                <DownloadCloud size={14} /> प्राप्त भएको (Received)
                                {incomingEntries.filter(e => e.status === 'Approved' && !e.recipientApprovedBy?.name).length > 0 && (
                                    <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse ml-1"></span>
                                )}
                            </button>
                        </div>
                        {activeTab === 'outgoing' && (
                            <button onClick={() => setIsEditing(true)} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-primary-700 transition-all font-bold font-nepali">
                                <Plus size={20} /> नयाँ हस्तान्तरण
                            </button>
                        )}
                    </div>
                </div>

                {successMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2 no-print">
                        <CheckCircle2 className="text-green-500" />
                        <p className="text-green-800 font-bold">{successMessage}</p>
                    </div>
                )}

                {actionableEntries.length > 0 && (
                    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden mb-6 ${activeTab === 'outgoing' ? 'border-orange-200' : 'border-emerald-200'}`}>
                        <div className={`px-6 py-3 border-b flex justify-between items-center ${activeTab === 'outgoing' ? 'bg-orange-50 text-orange-800' : 'bg-emerald-50 text-emerald-800'}`}>
                            <div className="flex items-center gap-2">
                                <Clock size={18} />
                                <h3 className="font-bold font-nepali">{activeTab === 'outgoing' ? 'प्रक्रिया गर्न बाँकी (Outgoing Actionable)' : 'बुझिलिन बाँकी (Awaiting Reception)'}</h3>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50">{actionableEntries.length} Forms</span>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-medium">
                                <tr>
                                    <th className="px-6 py-3">फारम नं</th>
                                    <th className="px-6 py-3">मिति</th>
                                    <th className="px-6 py-3">{activeTab === 'outgoing' ? 'प्राप्त गर्ने कार्यालय' : 'पठाउने कार्यालय'}</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {actionableEntries.map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-mono font-bold text-slate-700">#{e.formNo === 'TBD' ? 'PENDING' : e.formNo}</div>
                                            {e.id.startsWith('HF-AUTO') && (
                                                <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 uppercase mt-1">
                                                    <Sparkles size={10} /> Auto-Generated
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-nepali">{e.date || 'सेट गरिएको छैन'}</td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'outgoing' ? e.recipientOrg : (
                                                <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                                                    <Building2 size={14} />
                                                    {e.sourceOrg}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {activeTab === 'outgoing' && (
                                                    <button onClick={() => handleDeleteClick(e.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all" title="मेटाउनुहोस् (Delete)">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                                <button onClick={() => handleLoadEntry(e, false)} className="text-primary-600 font-bold hover:underline bg-primary-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                    {activeTab === 'outgoing' ? (isStoreKeeper ? 'Prepare' : 'Review/Approve') : <><DownloadCloud size={14}/> बुझिलिनुहोस्</>}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-slate-700 font-bold font-nepali flex items-center gap-2"><FileText size={18} /> {activeTab === 'outgoing' ? 'पठाएको इतिहास' : 'प्राप्त इतिहास (All Received Forms)'}</div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">फारम नं</th>
                                <th className="px-6 py-3">मिति</th>
                                <th className="px-6 py-3">{activeTab === 'outgoing' ? 'प्राप्त गर्ने कार्यालय' : 'पठाउने कार्यालय'}</th>
                                <th className="px-6 py-3">अवस्था</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {historyEntries.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">कुनै अभिलेख भेटिएन।</td></tr>
                            ) : (
                                historyEntries.map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-700">#{e.formNo}</td>
                                        <td className="px-6 py-4 font-nepali">{e.date}</td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'outgoing' ? e.recipientOrg : (
                                                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                                    <Building2 size={14} className="text-slate-400" />
                                                    {e.sourceOrg}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'outgoing' ? (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    e.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                    e.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-orange-50 text-orange-700 border-orange-200'}`}>{e.status}</span>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    e.recipientApprovedBy?.name ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                    'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                    {e.recipientApprovedBy?.name ? 'बुझिलिएको (Received)' : 'प्राप्त भएको (Sent by Source)'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleLoadEntry(e, true)} className="p-2 text-slate-400 hover:text-primary-600" title="Preview"><Eye size={18} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const inputClass = "border-b border-dotted border-slate-800 outline-none bg-transparent px-1 min-w-[50px]";

    const headerDetails = (activeTab === 'incoming' && formDetails.sourceOrgDetails) ? {
        orgName: formDetails.sourceOrgDetails.name,
        subTitle: formDetails.sourceOrgDetails.subTitle || '',
        address: formDetails.sourceOrgDetails.address || ''
    } : {
        orgName: generalSettings.orgNameNepali,
        subTitle: generalSettings.subTitleNepali,
        address: generalSettings.address
    };

    return (
        <div className="space-y-6">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4 landscape; margin: 10mm; }
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    #hastantaran-print-container { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; box-shadow: none !important; border: none !important; }
                    table { font-size: 9px !important; }
                    th, td { padding: 2px !important; }
                }
            `}} />
            
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
                <div className="flex items-center gap-3">
                    <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
                    <h2 className="font-bold text-slate-700 font-nepali text-lg">
                        {isViewOnly ? 'हस्तान्तरण फारम प्रिभ्यु' : activeTab === 'incoming' ? 'हस्तान्तरण बुझिलिनुहोस्' : 'हस्तान्तरण फारम भर्नुहोस्'}
                    </h2>
                </div>
                <div className="flex gap-2">
                    {!isViewOnly && (
                        <>
                            {activeTab === 'outgoing' && formDetails.status === 'Pending' && editingId && (
                                <button onClick={() => handleDeleteClick(editingId)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold border border-red-200 hover:bg-red-100 flex items-center gap-2">
                                    <Trash2 size={18} /> मेटाउनुहोस्
                                </button>
                            )}
                            {activeTab === 'outgoing' ? (
                                <>
                                    {isApprover && formDetails.status === 'Pending' && editingId && (
                                        <button onClick={() => handleSave('Approved')} disabled={isSubmitting} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-green-700 flex items-center gap-2 disabled:opacity-70">
                                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                            {isSubmitting ? 'प्रक्रियामा...' : 'स्वीकृत गर्नुहोस्'}
                                        </button>
                                    )}
                                    {(isStoreKeeper || !editingId) && (
                                        <button onClick={() => handleSave('Pending')} disabled={isSubmitting} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2 disabled:opacity-70">
                                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                            {isSubmitting ? 'पठाउँदै...' : 'सुरक्षित गरि पठाउनुहोस्'}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button onClick={() => handleSave('Approved')} disabled={isSubmitting} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-70">
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                    {isSubmitting ? 'बचत हुँदै...' : 'बुझिलिएको प्रमाणित गर्नुहोस्'}
                                </button>
                            )}
                        </>
                    )}
                    <button onClick={() => window.print()} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold"><Printer size={18} className="inline mr-2" /> प्रिन्ट</button>
                </div>
            </div>

            {validationError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 no-print">
                    <AlertCircle className="text-red-500 mt-1" />
                    <p className="text-red-800 font-bold">{validationError}</p>
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2 no-print">
                    <div className="text-green-500"><CheckCircle2 size={24} /></div>
                    <div className="flex-1">
                        <h3 className="text-green-800 font-bold text-lg font-nepali">सफल भयो (Success)</h3>
                        <p className="text-green-700 text-sm font-nepali font-bold">{successMessage}</p>
                    </div>
                </div>
            )}

            <div id="hastantaran-print-container" className="bg-white p-6 md:p-10 max-w-[297mm] mx-auto min-h-[210mm] font-nepali text-slate-900 border shadow-lg rounded-xl print:p-0 print:shadow-none print:border-none print:w-full">
                <div className="text-right font-bold text-[10px] mb-2">म.ले.प.फारम नं: ४०६</div>
                
                <div className="mb-6">
                    <div className="flex items-start justify-between">
                        <div className="w-24 flex justify-start pt-1">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emblem_of_Nepal.svg/1200px-Emblem_of_Nepal.svg.png" alt="Nepal Emblem" className="h-20 w-20 object-contain" />
                        </div>
                        <div className="flex-1 text-center">
                            <h1 className="text-lg font-bold">{headerDetails.orgName}</h1>
                            <h2 className="text-base font-bold">{headerDetails.subTitle}</h2>
                            <div className="text-[10px] mt-2 space-x-1 font-medium text-slate-600">
                                <span>{headerDetails.address}</span>
                            </div>
                        </div>
                        <div className="w-24"></div> 
                    </div>
                    <div className="text-center mt-4">
                        <h2 className="text-lg font-bold underline underline-offset-4">हस्तान्तरण फाराम</h2>
                    </div>
                </div>

                <div className="text-sm space-y-3 mb-4">
                    <p className="text-xs">तपसिल अनुसारको सम्पत्ति तथा जिन्सी मालसामान हस्तान्तरण गरिएको छ।</p>
                    
                    <div className="grid grid-cols-12 gap-x-4 gap-y-2">
                        <div className="col-span-8 space-y-2">
                            <div className="flex gap-2 items-center">
                                <span className="font-bold text-xs">निर्णय नं.:</span>
                                <input value={formDetails.decisionNo} onChange={e => setFormDetails({...formDetails, decisionNo: e.target.value})} disabled={isViewOnly || activeTab === 'incoming'} className={`${inputClass} flex-1 text-xs`} />
                                <span className="font-bold text-xs ml-2">निर्णय मिति:</span>
                                <NepaliDatePicker 
                                    value={formDetails.decisionDate} 
                                    onChange={val => setFormDetails({...formDetails, decisionDate: val})} 
                                    format="YYYY/MM/DD" 
                                    hideIcon={true} 
                                    label="" 
                                    inputClassName="border-b border-dotted w-28 p-0 h-auto font-bold text-xs" 
                                    disabled={isViewOnly || activeTab === 'incoming'}
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <span className="font-bold text-xs">प्राप्त गर्ने कार्यालयको नाम:</span>
                                {activeTab === 'outgoing' && !isViewOnly ? (
                                    <div className="flex-1">
                                        <Select 
                                            options={users.filter(u => u.role === 'ADMIN').map(u => ({ id: u.id, value: u.organizationName, label: u.organizationName }))} 
                                            value={formDetails.recipientOrg} 
                                            onChange={e => setFormDetails({...formDetails, recipientOrg: e.target.value})}
                                            label=""
                                            className="!py-0 !h-6 !text-xs !font-bold"
                                        />
                                    </div>
                                ) : (
                                    <input value={formDetails.recipientOrg} readOnly className={`${inputClass} flex-1 font-bold text-primary-700 text-xs`} />
                                )}
                            </div>
                        </div>
                        <div className="col-span-4 text-right space-y-2">
                            <div className="flex justify-end gap-2 text-xs">
                                <span>हस्तान्तरण गरिएको मिति:</span>
                                <div className="inline-block border-b border-dotted border-slate-800 min-w-[80px]">
                                    <NepaliDatePicker 
                                        value={formDetails.date} 
                                        onChange={(val) => setFormDetails({...formDetails, date: val})} 
                                        format="YYYY/MM/DD" 
                                        hideIcon={true} 
                                        label="" 
                                        inputClassName="!border-none !bg-transparent !p-0 !text-center !font-bold !h-auto w-full" 
                                        disabled={isViewOnly || activeTab === 'incoming'} 
                                        popupAlign="right"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 text-xs"><span>हस्तान्तरण फाराम नं.:</span><span className="border-b border-dotted border-slate-800 px-1 font-bold text-red-600">{formDetails.formNo}</span></div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mt-2 font-bold text-xs">
                        <span>जिन्सी मालसामानको प्रकार:</span>
                        <div className="flex items-center gap-4">
                            <button onClick={() => !isViewOnly && activeTab === 'outgoing' && setFormDetails({...formDetails, itemType: 'Expendable'})} className="flex items-center gap-1.5 cursor-pointer">
                                {formDetails.itemType === 'Expendable' ? <CheckCircle2 size={14} className="text-primary-600"/> : <div className="w-3 h-3 border border-slate-800 rounded-sm"></div>}
                                <span>जिन्सी मालसामान (खर्च भएर जाने)</span>
                            </button>
                            <button onClick={() => !isViewOnly && activeTab === 'outgoing' && setFormDetails({...formDetails, itemType: 'Non-Expendable'})} className="flex items-center gap-1.5 cursor-pointer">
                                {formDetails.itemType === 'Non-Expendable' ? <CheckCircle2 size={14} className="text-primary-600"/> : <div className="w-3 h-3 border border-slate-800 rounded-sm"></div>}
                                <span>सम्पत्ति (खर्च भएर नजाने)</span>
                            </button>
                        </div>
                    </div>
                </div>

                <table className="w-full border-collapse border border-slate-900 text-center text-[9px]">
                    <thead>
                        <tr className="bg-slate-50 font-bold">
                            <th className="border border-slate-900 p-1 w-8" rowSpan={2}>क्र.सं.</th>
                            <th className="border border-slate-900 p-1" colSpan={5}>सम्पत्ति तथा जिन्सी मालसामानको</th>
                            <th className="border border-slate-900 p-1 w-10" rowSpan={2}>एकाई</th>
                            <th className="border border-slate-900 p-1 w-10" rowSpan={2}>परिमाण</th>
                            <th className="border border-slate-900 p-1 w-14" rowSpan={2}>दर</th>
                            <th className="border border-slate-900 p-1 w-16" rowSpan={2}>जम्मा मूल्य</th>
                            <th className="border border-slate-900 p-1 w-20" rowSpan={2}>भौतिक अवस्था</th>
                            <th className="border border-slate-900 p-1 no-print" rowSpan={2}></th>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                            <th className="border border-slate-900 p-1 w-14">सङ्केत नं.</th>
                            <th className="border border-slate-900 p-1">नाम</th>
                            <th className="border border-slate-900 p-1">स्पेसिफिकेशन</th>
                            <th className="border border-slate-900 p-1 w-14">मोडेल</th>
                            <th className="border border-slate-900 p-1 w-14">पहिचान नं.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={item.id}>
                                <td className="border border-slate-900 p-1">{idx + 1}</td>
                                <td className="border border-slate-900 p-1 font-mono">{item.codeNo}</td>
                                <td className="border border-slate-900 p-0 text-left">
                                    {!isViewOnly && activeTab === 'outgoing' ? (
                                        <SearchableSelect options={itemOptions} value={item.name} onChange={v => updateItem(item.id, 'name', v)} onSelect={opt => handleItemSelect(item.id, opt)} className="!border-none !bg-transparent !p-1 !text-[9px]" />
                                    ) : <div className="px-1 font-bold">{item.name}</div>}
                                </td>
                                <td className="border border-slate-900 p-1">{item.specification}</td>
                                <td className="border border-slate-900 p-1">{item.model}</td>
                                <td className="border border-slate-900 p-1">{item.idNo}</td>
                                <td className="border border-slate-900 p-1">{item.unit}</td>
                                <td className="border border-slate-900 p-1 font-bold">{item.quantity}</td>
                                <td className="border border-slate-900 p-1 text-right">{item.rate ? item.rate.toFixed(2) : '-'}</td>
                                <td className="border border-slate-900 p-1 text-right font-bold bg-slate-50">{item.totalAmount.toFixed(2)}</td>
                                <td className="border border-slate-900 p-1">{item.condition}</td>
                                <td className="border border-slate-900 p-1 no-print">
                                    {!isViewOnly && activeTab === 'outgoing' && <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button>}
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold">
                            <td colSpan={9} className="border border-slate-900 p-1 text-right px-4">जम्मा रकम</td>
                            <td className="border border-slate-900 p-1 text-right">{totalVal.toFixed(2)}</td>
                            <td className="border border-slate-900 p-1"></td>
                            <td className="border border-slate-900 p-1 no-print"></td>
                        </tr>
                    </tbody>
                </table>

                {!isViewOnly && activeTab === 'outgoing' && (
                    <button onClick={handleAddItem} className="mt-2 no-print flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded border border-dashed border-primary-200">
                        <Plus size={12} /> थप्नुहोस् (Add Row)
                    </button>
                )}

                <div className="grid grid-cols-2 mt-8 gap-6 text-[9px]">
                    <div className="border border-slate-400 p-3 relative rounded bg-slate-50/50">
                        <p className="font-bold mb-3">हस्तान्तरण गर्ने कार्यालयले भर्ने (From):</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="border-t border-slate-900 mt-4 pt-1 font-bold flex items-center gap-1"><UserCheck size={10} className="text-primary-600" /> तयार गर्ने:</div>
                                <div className="flex gap-1"><span>नाम:</span><input value={formDetails.preparedBy.name} disabled className={inputClass + " flex-1 text-[9px] font-bold"} /></div>
                                <div className="flex gap-1"><span>पद:</span><input value={formDetails.preparedBy.designation} disabled className={inputClass + " flex-1 text-[9px]"} /></div>
                                <div className="flex gap-1"><span>मिति:</span><input value={formDetails.preparedBy.date || formDetails.date} disabled className={inputClass + " flex-1 text-[9px]"} /></div>
                            </div>
                            <div className="space-y-2">
                                <div className="border-t border-slate-900 mt-4 pt-1 font-bold flex items-center gap-1"><ShieldCheck size={10} className="text-green-600" /> स्वीकृत गर्ने:</div>
                                <div className="flex gap-1"><span>नाम:</span><input value={formDetails.approvedBy.name} disabled className={inputClass + " flex-1 text-[9px] font-bold"} /></div>
                                <div className="flex gap-1"><span>पद:</span><input value={formDetails.approvedBy.designation} disabled className={inputClass + " flex-1 text-[9px]"} /></div>
                                <div className="flex gap-1"><span>मिति:</span><input value={formDetails.approvedBy.date || formDetails.date} disabled className={inputClass + " flex-1 text-[9px]"} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-400 p-3 relative rounded">
                        <p className="font-bold mb-3">बुझिलिने कार्यालयले भर्ने (To):</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="border-t border-slate-900 mt-4 pt-1 font-bold">तयार गर्ने (Recipient SK):</div>
                                <div className="flex gap-1"><span>नाम:</span><input value={formDetails.recipientPreparedBy?.name} onChange={e => setFormDetails({...formDetails, recipientPreparedBy: {...formDetails.recipientPreparedBy!, name: e.target.value}})} disabled={activeTab === 'outgoing' || isViewOnly} className={inputClass + " flex-1 text-[9px] font-bold text-primary-700"} /></div>
                                <div className="flex gap-1"><span>पद:</span><input value={formDetails.recipientPreparedBy?.designation} onChange={e => setFormDetails({...formDetails, recipientPreparedBy: {...formDetails.recipientPreparedBy!, designation: e.target.value}})} disabled={activeTab === 'outgoing' || isViewOnly} className={inputClass + " flex-1 text-[9px]"} /></div>
                                <div className="flex gap-1"><span>मिति:</span><input value={formDetails.recipientPreparedBy?.date || todayBS} readOnly className={inputClass + " flex-1 text-[9px]"} /></div>
                            </div>
                            <div className="space-y-2">
                                <div className="border-t border-slate-900 mt-4 pt-1 font-bold">स्वीकृत गर्ने (Recipient Head):</div>
                                <div className="flex gap-1"><span>नाम:</span><input value={formDetails.recipientApprovedBy?.name} onChange={e => setFormDetails({...formDetails, recipientApprovedBy: {...formDetails.recipientApprovedBy!, name: e.target.value}})} disabled={activeTab === 'outgoing' || isViewOnly} className={inputClass + " flex-1 text-[9px] font-bold text-green-700"} /></div>
                                <div className="flex gap-1"><span>पद:</span><input value={formDetails.recipientApprovedBy?.designation} onChange={e => setFormDetails({...formDetails, recipientApprovedBy: {...formDetails.recipientApprovedBy!, designation: e.target.value}})} disabled={activeTab === 'outgoing' || isViewOnly} className={inputClass + " flex-1 text-[9px]"} /></div>
                                <div className="flex gap-1"><span>मिति:</span><input value={formDetails.recipientApprovedBy?.date || todayBS} readOnly className={inputClass + " flex-1 text-[9px]"} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
