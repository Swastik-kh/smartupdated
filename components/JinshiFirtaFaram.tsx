
import React, { useState, useEffect, useMemo } from 'react';
import { RotateCcw, Plus, Printer, ArrowLeft, Clock, Eye, ShieldCheck } from 'lucide-react';
import { InventoryItem, User, ReturnEntry, ReturnItem, IssueReportEntry, OrganizationSettings, Option } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { NepaliDatePicker } from './NepaliDatePicker';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

interface JinshiFirtaFaramProps {
  currentFiscalYear: string;
  currentUser: User;
  inventoryItems: InventoryItem[];
  returnEntries: ReturnEntry[];
  onSaveReturnEntry: (entry: ReturnEntry) => void;
  issueReports: IssueReportEntry[];
  generalSettings: OrganizationSettings;
}

export const JinshiFirtaFaram: React.FC<JinshiFirtaFaramProps> = ({
  currentFiscalYear,
  currentUser,
  inventoryItems,
  returnEntries,
  onSaveReturnEntry,
  issueReports,
  generalSettings
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const todayBS = useMemo(() => {
    try {
      return new NepaliDate().format('YYYY-MM-DD');
    } catch (e) {
      return '';
    }
  }, []);

  const [items, setItems] = useState<ReturnItem[]>([
    { id: Date.now(), kharchaNikasaNo: '', codeNo: '', name: '', specification: '', unit: '', quantity: 0, rate: 0, totalAmount: 0, vatAmount: 0, grandTotal: 0, condition: 'चालू', remarks: '' }
  ]);

  const [formDetails, setFormDetails] = useState({
    id: '',
    fiscalYear: currentFiscalYear,
    formNo: '1',
    date: todayBS,
    status: 'Pending' as 'Pending' | 'Verified' | 'Approved' | 'Rejected',
    returnedBy: { name: currentUser.fullName, designation: currentUser.designation, date: todayBS },
    preparedBy: { name: currentUser.fullName, designation: currentUser.designation, date: todayBS },
    recommendedBy: { name: '', designation: '', date: '' },
    approvedBy: { name: '', designation: '', date: '' },
  });

  const isAdminOrApproval = ['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role);
  
  const returnableItemOptions = useMemo(() => {
    const possessionMap: Record<string, { 
        name: string, 
        codeNo: string, 
        unit: string, 
        rate: number, 
        quantity: number, 
        issuedTo: string, 
        issueNo: string, 
        specification: string 
    }> = {};

    issueReports.forEach(report => {
        if (report.status === 'Issued') {
            report.items.forEach(item => {
                const invItem = inventoryItems.find(i => i.itemName.trim().toLowerCase() === item.name.trim().toLowerCase());
                if (report.itemType === 'Non-Expendable' || invItem?.itemType === 'Non-Expendable') {
                    const itemName = item.name.trim();
                    const codeNo = (item.codeNo || invItem?.uniqueCode || invItem?.sanketNo || '').trim();
                    const personName = (report.demandBy?.name || 'Unknown').trim();
                    const key = `${itemName.toLowerCase()}|${codeNo.toLowerCase()}|${personName.toLowerCase()}`;
                    
                    if (!possessionMap[key]) {
                        possessionMap[key] = {
                            name: itemName,
                            codeNo: codeNo,
                            unit: item.unit,
                            rate: item.rate || invItem?.rate || 0,
                            quantity: 0,
                            issuedTo: personName,
                            issueNo: report.issueNo || report.magFormNo,
                            specification: item.specification || invItem?.specification || ''
                        };
                    }
                    possessionMap[key].quantity += (parseFloat(item.quantity) || 0);
                }
            });
        }
    });

    const approvedReturns = returnEntries.filter(r => r.status === 'Approved');
    approvedReturns.forEach(ret => {
        ret.items.forEach(item => {
            const itemName = item.name.trim();
            const codeNo = (item.codeNo || '').trim();
            const personName = (ret.returnedBy?.name || '').trim();
            const key = `${itemName.toLowerCase()}|${codeNo.toLowerCase()}|${personName.toLowerCase()}`;
            if (possessionMap[key]) {
                possessionMap[key].quantity -= (item.quantity || 0);
            }
        });
    });

    return Object.values(possessionMap)
        .filter(asset => asset.quantity > 0)
        .map(asset => ({
            id: `${asset.issueNo}-${asset.codeNo}-${asset.issuedTo}`,
            value: asset.name,
            label: `${asset.name} (${asset.codeNo}) - [जिम्मा: ${asset.issuedTo}]`,
            itemData: { ...asset, remaining: asset.quantity }
        })) as Option[];
  }, [issueReports, returnEntries, inventoryItems]);

  const pendingEntries = useMemo(() => 
    returnEntries.filter(e => e.status === 'Pending').sort((a, b) => b.formNo.localeCompare(a.formNo)),
  [returnEntries]);

  const historyEntries = useMemo(() => 
    returnEntries.filter(e => e.status !== 'Pending').sort((a, b) => b.formNo.localeCompare(a.formNo)),
  [returnEntries]);

  useEffect(() => {
    if (!formDetails.id && showForm) {
        const entriesInFY = returnEntries.filter(e => e.fiscalYear === currentFiscalYear);
        const maxNo = entriesInFY.reduce((max, e) => Math.max(max, parseInt(e.formNo || '0')), 0);
        setFormDetails(prev => ({ ...prev, formNo: (maxNo + 1).toString(), date: todayBS }));
    }
  }, [currentFiscalYear, returnEntries, formDetails.id, showForm, todayBS]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), kharchaNikasaNo: '', codeNo: '', name: '', specification: '', unit: '', quantity: 0, rate: 0, totalAmount: 0, vatAmount: 0, grandTotal: 0, condition: 'चालू', remarks: '' }]);
  };

  const updateItem = (id: number, field: keyof ReturnItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (['quantity', 'rate'].includes(field)) {
          const qty = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
          const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
          updated.totalAmount = qty * rate;
          updated.grandTotal = updated.totalAmount;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleItemSelect = (id: number, option: Option) => {
      const data = option.itemData;
      if (!data) return;
      setItems(items.map(item => {
          if (item.id === id) {
              return {
                  ...item,
                  name: data.name,
                  codeNo: data.codeNo,
                  unit: data.unit,
                  rate: data.rate,
                  quantity: data.remaining,
                  totalAmount: data.remaining * data.rate,
                  grandTotal: data.remaining * data.rate,
                  kharchaNikasaNo: data.issueNo,
                  specification: data.specification
              };
          }
          return item;
      }));
  };

  const handleSave = (statusToSet: 'Pending' | 'Approved' = 'Pending') => {
    if (!formDetails.date) { alert('मिति आवश्यक छ'); return; }
    const entry: ReturnEntry = {
        id: formDetails.id || Date.now().toString(),
        fiscalYear: formDetails.fiscalYear,
        formNo: formDetails.formNo,
        date: formDetails.date,
        items: items,
        status: statusToSet,
        returnedBy: { ...formDetails.returnedBy, date: formDetails.date },
        preparedBy: { ...formDetails.preparedBy, date: formDetails.date },
        recommendedBy: formDetails.recommendedBy,
        approvedBy: statusToSet === 'Approved' ? { name: currentUser.fullName, designation: currentUser.designation, date: formDetails.date } : formDetails.approvedBy,
    };
    onSaveReturnEntry(entry);
    setIsSaved(true);
    setTimeout(() => { setIsSaved(false); handleBackToList(); }, 1500);
  };

  const handleLoadEntry = (entry: ReturnEntry, viewOnly: boolean = false) => {
      setFormDetails({
          id: entry.id,
          fiscalYear: entry.fiscalYear,
          formNo: entry.formNo,
          date: entry.date,
          status: entry.status || 'Pending',
          returnedBy: entry.returnedBy,
          preparedBy: entry.preparedBy,
          recommendedBy: entry.recommendedBy || { name: '', designation: '', date: '' },
          approvedBy: entry.approvedBy || { name: '', designation: '', date: '' },
      });
      setItems(entry.items);
      setIsViewOnly(viewOnly);
      setShowForm(true);
  };

  const handleAddNew = () => {
      setFormDetails({
        id: '', fiscalYear: currentFiscalYear, formNo: '1', date: todayBS, status: 'Pending',
        returnedBy: { name: currentUser.fullName, designation: currentUser.designation, date: todayBS },
        preparedBy: { name: currentUser.fullName, designation: currentUser.designation, date: todayBS },
        recommendedBy: { name: '', designation: '', date: '' },
        approvedBy: { name: '', designation: '', date: '' },
      });
      setItems([{ id: Date.now(), kharchaNikasaNo: '', codeNo: '', name: '', specification: '', unit: '', quantity: 0, rate: 0, totalAmount: 0, vatAmount: 0, grandTotal: 0, condition: 'चालू', remarks: '' }]);
      setIsViewOnly(false);
      setShowForm(true);
  };

  const handleBackToList = () => { setShowForm(false); setIsViewOnly(false); };
  const totalAmountSum = items.reduce((acc, i) => acc + i.totalAmount, 0);

  if (!showForm) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg text-red-600"><RotateCcw size={24} /></div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 font-nepali">जिन्सी मालसामान फिर्ता फारम व्यवस्थापन</h2>
                        <p className="text-sm text-slate-500 font-nepali">म.ले.प. फारम नं. ४०५</p>
                    </div>
                </div>
                <button onClick={handleAddNew} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-primary-700 transition-all font-bold font-nepali">
                    <Plus size={20} /> नयाँ फिर्ता फारम
                </button>
            </div>

            {isAdminOrApproval && pendingEntries.length > 0 && (
                <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden mb-6">
                    <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex justify-between items-center text-orange-800">
                        <div className="flex items-center gap-2"><Clock size={18} /><h3 className="font-bold font-nepali">स्वीकृतिको लागि बाँकी</h3></div>
                        <span className="bg-orange-200 text-xs font-bold px-2 py-0.5 rounded-full">{pendingEntries.length} Forms</span>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr><th className="px-6 py-3">Form No</th><th className="px-6 py-3">Returned By</th><th className="px-6 py-3">Date</th><th className="px-6 py-3 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pendingEntries.map(f => (
                                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700">#{f.formNo}</td>
                                    <td className="px-6 py-4">{f.returnedBy?.name}</td>
                                    <td className="px-6 py-4 font-nepali">{f.date}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleLoadEntry(f, false)} className="text-primary-600 font-bold hover:underline bg-primary-50 px-3 py-1.5 rounded-lg">Review & Approve</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-slate-700 font-bold font-nepali">फिर्ता इतिहास (History)</div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr><th className="px-6 py-3">Form No</th><th className="px-6 py-3">Returned By</th><th className="px-6 py-3">Date</th><th className="px-6 py-3 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {historyEntries.map(f => (
                            <tr key={f.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-mono font-bold">#{f.formNo}</td>
                                <td className="px-6 py-4">{f.returnedBy?.name}</td>
                                <td className="px-6 py-4 font-nepali">{f.date}</td>
                                <td className="px-6 py-3 text-right"><button onClick={() => handleLoadEntry(f, true)} className="p-2 text-slate-400 hover:text-primary-600"><Eye size={18} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border no-print shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={handleBackToList} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20}/></button>
            <div className="bg-red-100 p-2 rounded-lg text-red-600"><RotateCcw size={24} /></div>
            <div>
                <h2 className="font-bold text-slate-700 font-nepali text-lg">जिन्सी मालसामान फिर्ता फारम</h2>
                <p className="text-xs text-slate-500 font-nepali">म.ले.प. फारम नं. ४०५</p>
            </div>
        </div>
        <div className="flex gap-2">
            {!isViewOnly && (
                <>
                    {isAdminOrApproval && formDetails.status === 'Pending' && formDetails.id && (
                         <button onClick={() => handleSave('Approved')} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 flex items-center gap-2"><ShieldCheck size={18} /> स्वीकृत र स्टक थप्नुहोस्</button>
                    )}
                    <button onClick={() => handleSave('Pending')} disabled={isSaved} className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-lg hover:bg-primary-700">{isSaved ? 'पठाइयो' : 'प्रमाणिकरण अनुरोध'}</button>
                </>
            )}
            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium shadow-sm"><Printer size={18} className="inline mr-2" /> प्रिन्ट</button>
        </div>
      </div>

      <div id="firta-form-container" className="bg-white p-8 md:p-12 rounded-xl shadow-lg max-w-[210mm] mx-auto min-h-[297mm] text-slate-900 font-nepali text-xs print:shadow-none print:p-0 border">
        <div className="text-right font-bold mb-4">म.ले.प.फारम नं: ४०५</div>
        <div className="mb-8">
             <div className="flex items-start justify-between">
                 <div className="w-24 pt-2">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emblem_of_Nepal.svg/1200px-Emblem_of_Nepal.svg.png" alt="Nepal Emblem" className="h-24 w-24 object-contain" />
                 </div>
                 <div className="flex-1 text-center space-y-1">
                     <h1 className="text-xl font-bold text-red-600">{generalSettings.orgNameNepali}</h1>
                     {generalSettings.subTitleNepali && <h2 className="text-lg font-bold">{generalSettings.subTitleNepali}</h2>}
                     {generalSettings.subTitleNepali2 && <h3 className="text-base font-bold">{generalSettings.subTitleNepali2}</h3>}
                     {generalSettings.subTitleNepali3 && <h3 className="text-lg font-bold">{generalSettings.subTitleNepali3}</h3>}
                     <div className="text-xs mt-2 font-medium text-slate-600">
                        {generalSettings.address} | फोन: {generalSettings.phone} | पान नं: {generalSettings.panNo}
                     </div>
                 </div>
                 <div className="w-24"></div> 
             </div>
             <div className="text-center pt-6 pb-2">
                 <h2 className="text-xl font-bold underline underline-offset-4">जिन्सी मालसामान फिर्ता फारम</h2>
             </div>
        </div>

        <div className="flex justify-between items-end mb-6">
            <div className="w-1/2 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="font-bold">सामान फिर्ता गर्नेको नाम:</span>
                    <input value={formDetails.returnedBy.name} onChange={e => setFormDetails({...formDetails, returnedBy: {...formDetails.returnedBy, name: e.target.value}})} disabled={isViewOnly} className="border-b border-dotted border-slate-800 flex-1 outline-none bg-transparent font-bold" />
                </div>
            </div>
            <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-2">
                    <span>आर्थिक वर्ष:</span>
                    <span className="font-bold border-b border-dotted border-slate-800 px-2">{currentFiscalYear}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                    <span>मिति:</span>
                    <NepaliDatePicker 
                      value={formDetails.date} 
                      onChange={(val) => setFormDetails({...formDetails, date: val})} 
                      format="YYYY/MM/DD" 
                      hideIcon={true} 
                      inputClassName="border-b border-dotted w-32 inline-block p-0 h-auto font-bold text-right" 
                      disabled={isViewOnly} 
                      popupAlign="right"
                      minDate={todayBS} 
                      maxDate={todayBS} 
                    />
                </div>
                <div className="flex items-center justify-end gap-2">
                    <span>फिर्ता फारम नं.:</span>
                    <span className="font-bold text-red-600 border-b border-dotted border-slate-600 px-2">#{formDetails.formNo}</span>
                </div>
            </div>
        </div>

        <table className="w-full border-collapse border border-slate-900 text-center">
            <thead>
                <tr className="bg-slate-50 font-bold">
                    <th className="border border-slate-900 p-2 w-10">क्र.सं.</th>
                    <th className="border border-slate-900 p-2">विवरण (सामानको नाम)</th>
                    <th className="border border-slate-900 p-2 w-24">सङ्केत नं.</th>
                    <th className="border border-slate-900 p-2 w-16">एकाई</th>
                    <th className="border border-slate-900 p-2 w-16">परिमाण</th>
                    <th className="border border-slate-900 p-2 w-20">दर</th>
                    <th className="border border-slate-900 p-2 w-24">जम्मा मूल्य</th>
                    <th className="border border-slate-900 p-2 w-32">सामानको अवस्था</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, index) => (
                    <tr key={item.id}>
                        <td className="border border-slate-900 p-1">{index + 1}</td>
                        <td className="border border-slate-900 p-0 text-left">
                            {!isViewOnly ? (
                                <SearchableSelect 
                                    options={returnableItemOptions}
                                    value={item.name}
                                    onChange={(val) => updateItem(item.id, 'name', val)}
                                    onSelect={(opt) => handleItemSelect(item.id, opt)}
                                    placeholder="सामान छान्नुहोस्..."
                                    className="!border-none !bg-transparent !p-1"
                                />
                            ) : (
                                <span className="px-2 font-medium">{item.name}</span>
                            )}
                        </td>
                        <td className="border border-slate-900 p-1"><input value={item.codeNo} onChange={e => updateItem(item.id, 'codeNo', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-center outline-none" /></td>
                        <td className="border border-slate-900 p-1"><input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-center outline-none" /></td>
                        <td className="border border-slate-900 p-1 font-bold"><input type="number" value={item.quantity || ''} onChange={e => updateItem(item.id, 'quantity', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-center outline-none" /></td>
                        <td className="border border-slate-900 p-1"><input type="number" value={item.rate || ''} onChange={e => updateItem(item.id, 'rate', e.target.value)} disabled={isViewOnly} className="w-full bg-transparent text-right outline-none" /></td>
                        <td className="border border-slate-900 p-1 text-right px-2">{item.totalAmount.toFixed(2)}</td>
                        <td className="border border-slate-900 p-1">
                            <select 
                                value={item.condition} 
                                onChange={e => updateItem(item.id, 'condition', e.target.value)} 
                                disabled={isViewOnly} 
                                className="w-full bg-transparent outline-none px-1 text-xs"
                            >
                                <option value="चालू">चालू</option>
                                <option value="बिग्रेको">बिग्रेको</option>
                            </select>
                        </td>
                    </tr>
                ))}
                <tr className="font-bold bg-slate-50">
                    <td colSpan={6} className="border border-slate-900 p-2 text-right px-4 uppercase">कुल जम्मा (Total)</td>
                    <td className="border border-slate-900 p-2 text-right px-2">{totalAmountSum.toFixed(2)}</td>
                    <td className="border border-slate-900"></td>
                </tr>
            </tbody>
        </table>
        
        {!isViewOnly && (
            <button onClick={handleAddItem} className="mt-2 no-print text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded border border-dashed border-primary-200 hover:bg-primary-100 flex items-center gap-1"><Plus size={12} /> थप्नुहोस् (Add Row)</button>
        )}

        <div className="grid grid-cols-2 gap-20 mt-20 text-sm">
            <div className="text-center">
                <div className="border-t border-slate-800 pt-3">
                    <p className="font-bold">अनुरोधकर्ता/बुझाउनेको दस्तखत</p>
                    <div className="mt-4 space-y-1">
                        <p className="font-bold">{formDetails.preparedBy.name}</p>
                        <p className="text-xs">{formDetails.preparedBy.designation || 'Staff'}</p>
                        <p className="text-[10px] italic">मिति: {formDetails.preparedBy.date || formDetails.date}</p>
                    </div>
                </div>
            </div>
            <div className="text-center">
                <div className="border-t border-slate-800 pt-3">
                    <p className="font-bold">स्वीकृत गर्ने/बुझिलिनेको दस्तखत</p>
                    <div className="mt-4 space-y-1">
                        <p className="font-bold">{formDetails.approvedBy.name || '................................'}</p>
                        <p className="text-xs">{formDetails.approvedBy.designation || 'Storekeeper / Head'}</p>
                        <p className="text-[10px] italic">मिति: {formDetails.approvedBy.date || '................'}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
