
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Printer, Save, ArrowLeft, Send, CheckCircle2, FileText, Search, Clock, ShieldCheck, Warehouse, Layers, X, AlertCircle, Eye } from 'lucide-react';
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
  inventoryItems: InventoryItem[];
  stores: Store[];
  generalSettings: OrganizationSettings;
}

export const HafaFaram: React.FC<HafaFaramProps> = ({ 
    currentFiscalYear, 
    currentUser, 
    existingEntries, 
    onSave, 
    inventoryItems, 
    stores,
    generalSettings 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const todayBS = useMemo(() => {
        try {
            return new NepaliDate().format('YYYY-MM-DD');
        } catch (e) {
            return '';
        }
    }, []);

    const [items, setItems] = useState<HafaItem[]>([
        { id: Date.now(), codeNo: '', name: '', specification: '', model: '', idNo: '', unit: '', quantity: 1, rate: 0, totalAmount: 0, startDate: '', condition: 'चालू', remarks: '' }
    ]);

    const [formDetails, setFormDetails] = useState<HafaEntry>({
        id: '',
        fiscalYear: currentFiscalYear,
        formNo: '',
        date: todayBS,
        status: 'Pending',
        decisionNo: '',
        decisionDate: '',
        recipientOrg: '',
        itemType: 'Expendable',
        items: [],
        preparedBy: { name: currentUser.fullName, designation: currentUser.designation, date: todayBS },
        approvedBy: { name: '', designation: '', date: '' },
        recipientPreparedBy: { name: '', designation: '', date: '' },
        recipientApprovedBy: { name: '', designation: '', date: '' }
    });

    const isApprover = ['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role);
    const isStoreKeeper = currentUser.role === 'STOREKEEPER';

    const itemOptions = useMemo(() => inventoryItems.map(item => ({
        id: item.id,
        value: item.itemName,
        label: `${item.itemName} (${item.unit}) - मौज्दात: ${item.currentQuantity} [${item.uniqueCode || item.sanketNo || ''}]`,
        itemData: item
    })), [inventoryItems]);

    const generateFormNo = useCallback(() => {
        const fyEntries = existingEntries.filter(e => e.fiscalYear === currentFiscalYear);
        if (fyEntries.length === 0) return "0001-HF";
        const maxNo = fyEntries.reduce((max, e) => {
            const parts = e.formNo.split('-');
            const val = parseInt(parts[0]);
            return isNaN(val) ? max : Math.max(max, val);
        }, 0);
        return `${String(maxNo + 1).padStart(4, '0')}-HF`;
    }, [existingEntries, currentFiscalYear]);

    useEffect(() => {
        if (!isEditing && !editingId) {
            setFormDetails(prev => ({ ...prev, formNo: generateFormNo() }));
        }
    }, [isEditing, editingId, generateFormNo]);

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

    const handleSave = (statusToSet: 'Pending' | 'Approved' = 'Pending') => {
        setValidationError(null);
        if (!formDetails.recipientOrg) { setValidationError("प्राप्त गर्ने कार्यालयको नाम आवश्यक छ।"); return; }
        
        const entry: HafaEntry = {
            ...formDetails,
            id: editingId || Date.now().toString(),
            items: items,
            status: statusToSet,
            approvedBy: statusToSet === 'Approved' ? { name: currentUser.fullName, designation: currentUser.designation, date: todayBS } : formDetails.approvedBy
        };

        onSave(entry);
        alert(statusToSet === 'Approved' ? "हस्तान्तरण फारम स्वीकृत भयो।" : "हस्तान्तरण फारम सुरक्षित भयो।");
        handleReset();
    };

    const handleReset = () => {
        setIsEditing(false);
        setEditingId(null);
        setIsViewOnly(false);
        setValidationError(null);
        setItems([{ id: Date.now(), codeNo: '', name: '', specification: '', model: '', idNo: '', unit: '', quantity: 1, rate: 0, totalAmount: 0, startDate: '', condition: 'चालू', remarks: '' }]);
        setFormDetails({
            id: '', fiscalYear: currentFiscalYear, formNo: generateFormNo(), date: todayBS, status: 'Pending',
            decisionNo: '', decisionDate: '', recipientOrg: '', itemType: 'Expendable', items: [],
            preparedBy: { name: currentUser.fullName, designation: currentUser.designation, date: todayBS },
            approvedBy: { name: '', designation: '', date: '' }
        });
    };

    const handleLoadEntry = (entry: HafaEntry, viewOnly: boolean = false) => {
        setEditingId(entry.id);
        setIsEditing(true);
        setIsViewOnly(viewOnly);
        setFormDetails(entry);
        setItems(entry.items);
        setValidationError(null);
    };

    const totalVal = items.reduce((sum, i) => sum + i.totalAmount, 0);

    if (!isEditing) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 font-nepali">हस्तान्तरण फाराम व्यवस्थापन (Transfer Form)</h2>
                        <p className="text-sm text-slate-500 font-nepali">म.ले.प. फारम नं ४०६ अनुसारको हस्तान्तरण फाराम</p>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-primary-700 transition-all font-bold font-nepali">
                        <Plus size={20} /> नयाँ हस्तान्तरण फारम
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-slate-700 font-bold font-nepali flex items-center gap-2"><FileText size={18} /> फारमहरूको सूची (History)</div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr><th className="px-6 py-3">फारम नं</th><th className="px-6 py-3">मिति</th><th className="px-6 py-3">प्राप्त गर्ने कार्यालय</th><th className="px-6 py-3">अवस्था</th><th className="px-6 py-3 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {existingEntries.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">कुनै हस्तान्तरण फारम भेटिएन।</td></tr>
                            ) : (
                                existingEntries.map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-700">#{e.formNo}</td>
                                        <td className="px-6 py-4 font-nepali">{e.date}</td>
                                        <td className="px-6 py-4">{e.recipientOrg}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${e.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{e.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleLoadEntry(e, true)} className="p-2 text-slate-400 hover:text-primary-600"><Eye size={18} /></button>
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
                <div className="flex items-center gap-3">
                    <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
                    <h2 className="font-bold text-slate-700 font-nepali text-lg">{isViewOnly ? 'प्रिभ्यु' : 'हस्तान्तरण फारम भर्नुहोस्'}</h2>
                </div>
                <div className="flex gap-2">
                    {!isViewOnly && (
                        <>
                            {isApprover && formDetails.status === 'Pending' && editingId && (
                                <button onClick={() => handleSave('Approved')} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-green-700"><ShieldCheck size={18} className="inline mr-2" /> स्वीकृत गर्नुहोस्</button>
                            )}
                            <button onClick={() => handleSave('Pending')} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-primary-700"><Save size={18} className="inline mr-2" /> सुरक्षित गर्नुहोस्</button>
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

            <div className="bg-white p-6 md:p-10 max-w-[297mm] mx-auto min-h-[210mm] font-nepali text-slate-900 border shadow-lg rounded-xl print:p-0 print:shadow-none print:border-none print:w-full">
                <div className="text-right font-bold text-[10px] mb-2">म.ले.प.फारम नं: ४०६</div>
                
                <div className="mb-6">
                    <div className="flex items-start justify-between">
                        <div className="w-24 flex justify-start pt-1">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emblem_of_Nepal.svg/1200px-Emblem_of_Nepal.svg.png" alt="Nepal Emblem" className="h-20 w-20 object-contain" />
                        </div>
                        <div className="flex-1 text-center">
                            <h1 className="text-lg font-bold">{generalSettings.orgNameNepali}</h1>
                            <h2 className="text-base font-bold">{generalSettings.subTitleNepali}</h2>
                            {generalSettings.subTitleNepali2 && <h3 className="text-sm font-bold">{generalSettings.subTitleNepali2}</h3>}
                            {generalSettings.subTitleNepali3 && <h3 className="text-base font-bold">{generalSettings.subTitleNepali3}</h3>}
                            <div className="text-[10px] mt-2 space-x-1 font-medium text-slate-600">
                                <span>{generalSettings.address}</span>
                                {generalSettings.phone && <span>| फोन: {generalSettings.phone}</span>}
                                {generalSettings.email && <span>| ईमेल: {generalSettings.email}</span>}
                                {generalSettings.panNo && <span>| पान नं: {generalSettings.panNo}</span>}
                            </div>
                        </div>
                        <div className="w-24"></div> 
                    </div>
                    <div className="text-center mt-6">
                        <h2 className="text-lg font-bold underline underline-offset-4">हस्तान्तरण फाराम</h2>
                    </div>
                </div>

                <div className="text-sm space-y-4 mb-6">
                    <p>यस कार्यालयबाट तपसिल अनुसारको सम्पत्ति तथा जिन्सी मालसामान हस्तान्तरण गरिएको छ।</p>
                    
                    <div className="grid grid-cols-12 gap-x-4 gap-y-2">
                        <div className="col-span-8 space-y-2">
                            <div className="flex gap-2"><span>सम्पत्ति तथा जिन्सी मालसामान हस्तान्तरणको</span></div>
                            <div className="flex gap-2"><span>निर्णय नं.:</span><input value={formDetails.decisionNo} onChange={e => setFormDetails({...formDetails, decisionNo: e.target.value})} disabled={isViewOnly} className={`${inputClass} flex-1`} /></div>
                            <div className="flex gap-2"><span>निर्णय मिति:</span><NepaliDatePicker value={formDetails.decisionDate} onChange={val => setFormDetails({...formDetails, decisionDate: val})} format="YYYY/MM/DD" hideIcon={true} label="" inputClassName="border-b border-dotted w-32 p-0 h-auto font-bold" disabled={isViewOnly}/></div>
                            <div className="flex gap-2"><span>प्राप्त गर्ने कार्यालयको नाम:</span><input value={formDetails.recipientOrg} onChange={e => setFormDetails({...formDetails, recipientOrg: e.target.value})} disabled={isViewOnly} className={`${inputClass} flex-1 font-bold text-primary-700`} /></div>
                        </div>
                        <div className="col-span-4 text-right space-y-2">
                            <div className="flex justify-end gap-2"><span>हस्तान्तरण गरिएको मिति:</span><span className="border-b border-dotted border-slate-800 px-1 font-bold">{formDetails.date}</span></div>
                            <div className="flex justify-end gap-2"><span>हस्तान्तरण फाराम नं.:</span><span className="border-b border-dotted border-slate-800 px-1 font-bold text-red-600">{formDetails.formNo}</span></div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 font-bold">
                        <span>सम्पत्ति तथा जिन्सी मालसामानको प्रकार:</span>
                        <div className="flex items-center gap-4">
                            <button onClick={() => !isViewOnly && setFormDetails({...formDetails, itemType: 'Expendable'})} className="flex items-center gap-1.5 cursor-pointer">
                                {formDetails.itemType === 'Expendable' ? <CheckCircle2 size={16} className="text-primary-600"/> : <div className="w-4 h-4 border border-slate-800 rounded-sm"></div>}
                                <span>जिन्सी मालसामान (खर्च भएर जाने)</span>
                            </button>
                            <button onClick={() => !isViewOnly && setFormDetails({...formDetails, itemType: 'Non-Expendable'})} className="flex items-center gap-1.5 cursor-pointer">
                                {formDetails.itemType === 'Non-Expendable' ? <CheckCircle2 size={16} className="text-primary-600"/> : <div className="w-4 h-4 border border-slate-800 rounded-sm"></div>}
                                <span>सम्पत्ति (खर्च भएर नजाने)</span>
                            </button>
                        </div>
                    </div>
                </div>

                <table className="w-full border-collapse border border-slate-900 text-center text-[10px]">
                    <thead>
                        <tr className="bg-slate-50 font-bold">
                            <th className="border border-slate-900 p-1 w-8" rowSpan={2}>क्र.सं.</th>
                            <th className="border border-slate-900 p-1" colSpan={5}>सम्पत्ति तथा जिन्सी मालसामानको</th>
                            <th className="border border-slate-900 p-1 w-12" rowSpan={2}>एकाई</th>
                            <th className="border border-slate-900 p-1 w-12" rowSpan={2}>परिमाण</th>
                            <th className="border border-slate-900 p-1 w-16" rowSpan={2}>दर</th>
                            <th className="border border-slate-900 p-1 w-20" rowSpan={2}>जम्मा मूल्य (१० = ८x९)</th>
                            <th className="border border-slate-900 p-1 w-20" rowSpan={2}>शुरु प्राप्त मिति</th>
                            <th className="border border-slate-900 p-1 w-24" rowSpan={2}>भौतिक अवस्था</th>
                            <th className="border border-slate-900 p-1 no-print" rowSpan={2}></th>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                            <th className="border border-slate-900 p-1 w-16">सङ्केत नं.</th>
                            <th className="border border-slate-900 p-1">नाम</th>
                            <th className="border border-slate-900 p-1">स्पेसिफिकेशन</th>
                            <th className="border border-slate-900 p-1 w-16">मोडेल</th>
                            <th className="border border-slate-900 p-1 w-16">पहिचान नं.</th>
                        </tr>
                        <tr className="bg-slate-100 text-[8px]">
                            {Array.from({length: 12}).map((_, i) => <th key={i} className="border border-slate-900 p-0.5">{i+1}</th>)}
                            <th className="border border-slate-900 no-print"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={item.id}>
                                <td className="border border-slate-900 p-1">{idx + 1}</td>
                                <td className="border border-slate-900 p-1"><input value={item.codeNo} onChange={e => updateItem(item.id, 'codeNo', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-center outline-none" /></td>
                                <td className="border border-slate-900 p-0 text-left">
                                    {!isViewOnly ? (
                                        <SearchableSelect options={itemOptions} value={item.name} onChange={v => updateItem(item.id, 'name', v)} onSelect={opt => handleItemSelect(item.id, opt)} className="!border-none !bg-transparent !p-1 !text-[10px]" />
                                    ) : <div className="px-1 font-bold">{item.name}</div>}
                                </td>
                                <td className="border border-slate-900 p-1"><input value={item.specification} onChange={e => updateItem(item.id, 'specification', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-left outline-none" /></td>
                                <td className="border border-slate-900 p-1"><input value={item.model} onChange={e => updateItem(item.id, 'model', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-center outline-none" /></td>
                                <td className="border border-slate-900 p-1"><input value={item.idNo} onChange={e => updateItem(item.id, 'idNo', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-center outline-none" /></td>
                                <td className="border border-slate-900 p-1"><input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-center outline-none" /></td>
                                <td className="border border-slate-900 p-1 font-bold"><input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-center outline-none" /></td>
                                <td className="border border-slate-900 p-1"><input type="number" value={item.rate || ''} onChange={e => updateItem(item.id, 'rate', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-right outline-none" /></td>
                                <td className="border border-slate-900 p-1 text-right font-bold bg-slate-50">{item.totalAmount.toFixed(2)}</td>
                                <td className="border border-slate-900 p-1"><input value={item.startDate} onChange={e => updateItem(item.id, 'startDate', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-center outline-none" /></td>
                                <td className="border border-slate-900 p-1">
                                    <select value={item.condition} onChange={e => updateItem(item.id, 'condition', e.target.value)} disabled={isViewOnly} className="bg-transparent outline-none w-full">
                                        <option value="चालू">चालू</option>
                                        <option value="बिग्रेको">बिग्रेको</option>
                                        <option value="लिलाम">लिलाम</option>
                                    </select>
                                </td>
                                <td className="border border-slate-900 p-1 no-print">
                                    {!isViewOnly && <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button>}
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold">
                            <td colSpan={9} className="border border-slate-900 p-1 text-right px-4">जम्मा रकम</td>
                            <td className="border border-slate-900 p-1 text-right">{totalVal.toFixed(2)}</td>
                            <td className="border border-slate-900 p-1"></td>
                            <td className="border border-slate-900 p-1"></td>
                            <td className="border border-slate-900 p-1 no-print"></td>
                        </tr>
                    </tbody>
                </table>

                {!isViewOnly && (
                    <button onClick={handleAddItem} className="mt-2 no-print flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded border border-dashed border-primary-200">
                        <Plus size={12} /> थप्नुहोस् (Add Row)
                    </button>
                )}

                <div className="grid grid-cols-2 mt-12 gap-8 text-[11px]">
                    <div className="border border-slate-400 p-4 relative">
                        <p className="font-bold mb-4">सम्पत्ति तथा जिन्सी मालसामान हस्तान्तरण गर्ने कार्यालयले भर्ने:</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="border-t border-slate-900 mt-8 pt-1">तयार गर्ने:.......</div>
                                <div className="flex gap-1"><span>नाम:</span><input value={formDetails.preparedBy.name} disabled className={inputClass + " flex-1"} /></div>
                                <div className="flex gap-1"><span>पद:</span><input value={formDetails.preparedBy.designation} disabled className={inputClass + " flex-1"} /></div>
                                <div className="flex gap-1"><span>मिति:</span><input value={formDetails.preparedBy.date} disabled className={inputClass + " flex-1"} /></div>
                            </div>
                            <div className="space-y-4">
                                <div className="border-t border-slate-900 mt-8 pt-1">स्वीकृत गर्ने:.......</div>
                                <div className="flex gap-1"><span>नाम:</span><input value={formDetails.approvedBy.name} disabled className={inputClass + " flex-1"} /></div>
                                <div className="flex gap-1"><span>पद:</span><input value={formDetails.approvedBy.designation} disabled className={inputClass + " flex-1"} /></div>
                                <div className="flex gap-1"><span>मिति:</span><input value={formDetails.approvedBy.date} disabled className={inputClass + " flex-1"} /></div>
                            </div>
                        </div>
                        <p className="mt-6 text-center">कार्यालयको छाप:-</p>
                    </div>

                    <div className="border border-slate-400 p-4 relative">
                        <p className="font-bold mb-4">सम्पत्ति तथा जिन्सी मालसामान बुझिलिने कार्यालयले भर्ने:</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="border-t border-slate-900 mt-8 pt-1">तयार गर्ने:.......</div>
                                <div className="flex gap-1"><span>नाम:</span><input className={inputClass + " flex-1"} disabled={isViewOnly}/></div>
                                <div className="flex gap-1"><span>पद:</span><input className={inputClass + " flex-1"} disabled={isViewOnly}/></div>
                                <div className="flex gap-1"><span>मिति:</span><input className={inputClass + " flex-1"} disabled={isViewOnly}/></div>
                            </div>
                            <div className="space-y-4">
                                <div className="border-t border-slate-900 mt-8 pt-1">स्वीकृत गर्ने:.......</div>
                                <div className="flex gap-1"><span>नाम:</span><input className={inputClass + " flex-1"} disabled={isViewOnly}/></div>
                                <div className="flex gap-1"><span>पद:</span><input className={inputClass + " flex-1"} disabled={isViewOnly}/></div>
                                <div className="flex gap-1"><span>मिति:</span><input className={inputClass + " flex-1"} disabled={isViewOnly}/></div>
                            </div>
                        </div>
                        <p className="mt-6 text-center">कार्यालयको छाप:-</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
