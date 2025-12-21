
import React, { useState, useEffect, useMemo } from 'react';
import { Wrench, Plus, Trash2, Printer, Save, ArrowLeft, Clock, CheckCircle2, Send, Eye, FileText } from 'lucide-react';
import { User, MarmatEntry, MarmatItem, InventoryItem, OrganizationSettings } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { NepaliDatePicker } from './NepaliDatePicker';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

interface MarmatAdeshProps {
  currentFiscalYear: string;
  currentUser: User;
  marmatEntries: MarmatEntry[];
  onSaveMarmatEntry: (entry: MarmatEntry) => void;
  inventoryItems: InventoryItem[];
  generalSettings: OrganizationSettings;
}

export const MarmatAdesh: React.FC<MarmatAdeshProps> = ({
  currentFiscalYear,
  currentUser,
  marmatEntries,
  onSaveMarmatEntry,
  inventoryItems,
  generalSettings
}) => {
  const [items, setItems] = useState<MarmatItem[]>([
    { id: Date.now(), name: '', codeNo: '', details: '', quantity: 0, unit: '', remarks: '' }
  ]);

  const [formDetails, setFormDetails] = useState({
    id: '',
    fiscalYear: currentFiscalYear,
    formNo: '1',
    date: '',
    status: 'Pending' as 'Pending' | 'Approved' | 'Completed',
    requestedBy: { name: currentUser.fullName, designation: currentUser.designation, date: '' },
    recommendedBy: { name: '', designation: '', date: '' },
    approvedBy: { name: '', designation: '', date: '' },
  });

  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const todayBS = useMemo(() => {
      try {
          return new NepaliDate().format('YYYY-MM-DD');
      } catch (e) {
          return '';
      }
  }, []);

  const pendingRequests = useMemo(() => 
    marmatEntries.filter(e => e.status === 'Pending').sort((a, b) => parseInt(b.formNo) - parseInt(a.formNo)),
  [marmatEntries]);

  const allHistory = useMemo(() =>
    marmatEntries.filter(e => e.status !== 'Pending').sort((a, b) => parseInt(b.formNo) - parseInt(a.formNo)),
  [marmatEntries]);

  const canApprove = ['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role);

  // Filter items to show only Non-Expendable for maintenance
  const itemOptions = useMemo(() => {
    return inventoryItems
        .filter(item => item.itemType === 'Non-Expendable')
        .map(item => ({
            id: item.id,
            value: item.itemName,
            label: `${item.itemName} (${item.uniqueCode || item.sanketNo || '-'}) - Qty: ${item.currentQuantity}`,
            itemData: item
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
  }, [inventoryItems]);

  useEffect(() => {
    if (!formDetails.id) {
        const entriesInFY = marmatEntries.filter(e => e.fiscalYear === currentFiscalYear);
        const maxNo = entriesInFY.reduce((max, e) => {
            const val = parseInt(e.formNo) || 0;
            return Math.max(max, val);
        }, 0);
        setFormDetails(prev => ({ ...prev, formNo: (maxNo + 1).toString() }));
    }
  }, [currentFiscalYear, marmatEntries, formDetails.id]);

  // Renamed handleAddItem to handleAddRow to fix the 'Cannot find name handleAddRow' error on line 331.
  const handleAddRow = () => {
    setItems([...items, { id: Date.now(), name: '', codeNo: '', details: '', quantity: 0, unit: '', remarks: '' }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: keyof MarmatItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) return { ...item, [field]: value };
      return item;
    }));
  };

  const handleLoadEntry = (entry: MarmatEntry, viewOnly: boolean = false) => {
      setFormDetails({
          id: entry.id,
          fiscalYear: entry.fiscalYear,
          formNo: entry.formNo,
          date: entry.date,
          status: entry.status,
          requestedBy: { 
              name: entry.requestedBy.name, 
              designation: entry.requestedBy.designation || '', 
              date: entry.requestedBy.date || '' 
          },
          recommendedBy: { 
              name: entry.recommendedBy?.name || '', 
              designation: entry.recommendedBy?.designation || '', 
              date: entry.recommendedBy?.date || '' 
          },
          approvedBy: { 
              name: entry.approvedBy?.name || '', 
              designation: entry.approvedBy?.designation || '', 
              date: entry.approvedBy?.date || '' 
          },
      });
      setItems(entry.items);
      setIsViewOnly(viewOnly);
      setIsSaved(false);
      // Scroll to top of form
      const container = document.getElementById('marmat-form-container');
      if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReset = () => {
      setFormDetails({
        id: '', fiscalYear: currentFiscalYear, formNo: '', date: '', status: 'Pending',
        requestedBy: { name: currentUser.fullName, designation: currentUser.designation, date: '' },
        recommendedBy: { name: '', designation: '', date: '' },
        approvedBy: { name: '', designation: '', date: '' },
      });
      setItems([{ id: Date.now(), name: '', codeNo: '', details: '', quantity: 0, unit: '', remarks: '' }]);
      setIsViewOnly(false);
      setIsSaved(false);
  }

  const handleSave = (statusToSet: 'Pending' | 'Approved' = 'Pending') => {
    if (!formDetails.date) { alert('कृपया मिति भर्नुहोस्।'); return; }
    const entry: MarmatEntry = {
        id: formDetails.id || Date.now().toString(),
        fiscalYear: formDetails.fiscalYear,
        formNo: formDetails.formNo,
        date: formDetails.date,
        items: items,
        status: statusToSet,
        requestedBy: { ...formDetails.requestedBy, date: formDetails.date }, 
        recommendedBy: formDetails.recommendedBy,
        approvedBy: statusToSet === 'Approved' ? 
            { name: currentUser.fullName, designation: currentUser.designation, date: formDetails.date } : 
            formDetails.approvedBy,
    };
    onSaveMarmatEntry(entry);
    setIsSaved(true);
    setTimeout(() => { setIsSaved(false); handleReset(); }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Pending Banner */}
      {canApprove && pendingRequests.length > 0 && !isViewOnly && (
          <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden no-print mb-6">
              <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex justify-between items-center text-orange-800">
                  <div className="flex items-center gap-2"><Clock size={18} /><h3 className="font-bold font-nepali">स्वीकृति अनुरोधहरू (Pending Requests)</h3></div>
                  <span className="bg-orange-200 text-xs font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
              </div>
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium">
                      <tr><th className="px-6 py-3">Order No</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Requested By</th><th className="px-6 py-3 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {pendingRequests.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50">
                              <td className="px-6 py-3 font-mono font-medium">#{req.formNo}</td>
                              <td className="px-6 py-3 font-nepali">{req.date}</td>
                              <td className="px-6 py-3">{req.requestedBy.name}</td>
                              <td className="px-6 py-3 text-right">
                                  <button onClick={() => handleLoadEntry(req, false)} className="text-primary-600 font-bold hover:underline bg-primary-50 px-3 py-1.5 rounded-lg">Review Now</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {/* Actions Top Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border no-print shadow-sm">
        <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Wrench size={24} /></div>
            <div>
                <h2 className="font-bold text-slate-700 font-nepali text-lg">मर्मत सम्भार आदेश फारम</h2>
                <p className="text-xs text-slate-500 font-nepali">म.ले.प. फारम नं: ४०२ | आ.व. {currentFiscalYear}</p>
            </div>
        </div>
        <div className="flex gap-2">
            {!isViewOnly ? (
                <>
                    {(canApprove && formDetails.status === 'Pending' && formDetails.id) ? (
                        <button onClick={() => handleSave('Approved')} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 transition-all"><CheckCircle2 size={18} /> स्वीकृत गर्नुहोस् (Approve)</button>
                    ) : (
                        <button onClick={() => handleSave('Pending')} disabled={isSaved} className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg font-bold shadow-lg transition-all ${isSaved ? 'bg-green-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
                            {isSaved ? <CheckCircle2 size={18} /> : <Send size={18} />}
                            {isSaved ? 'पठाइयो' : 'अनुरोध पठाउनुहोस्'}
                        </button>
                    )}
                </>
            ) : (
                <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-bold transition-all"><Plus size={18} /> नयाँ बनाउनुहोस्</button>
            )}
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold shadow-sm hover:bg-slate-900 transition-all"><Printer size={18} /> प्रिन्ट</button>
        </div>
      </div>

      {/* Main A4 Document */}
      <div id="marmat-form-container" className="bg-white p-8 md:p-12 rounded-xl shadow-lg max-w-[210mm] mx-auto min-h-[297mm] text-slate-900 font-nepali text-sm print:shadow-none print:p-0 border relative">
        <div className="text-right text-[10px] font-bold mb-2">म.ले.प.फारम नं: ४०२</div>
        
        <div className="mb-8">
             <div className="flex items-start justify-between">
                 <div className="w-24 pt-2">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emblem_of_Nepal.svg/1200px-Emblem_of_Nepal.svg.png" alt="Emblem" className="h-24 w-24 object-contain" />
                 </div>
                 <div className="flex-1 text-center space-y-1">
                     <h1 className="text-xl font-bold text-red-600">{generalSettings.orgNameNepali}</h1>
                     {generalSettings.subTitleNepali && <h2 className="text-lg font-bold">{generalSettings.subTitleNepali}</h2>}
                     {generalSettings.subTitleNepali2 && <h3 className="text-base font-bold">{generalSettings.subTitleNepali2}</h3>}
                     {generalSettings.subTitleNepali3 && <h3 className="text-lg font-bold">{generalSettings.subTitleNepali3}</h3>}
                 </div>
                 <div className="w-24"></div> 
             </div>
             <div className="text-center pt-8">
                 <h2 className="text-xl font-bold underline underline-offset-4">मर्मत सम्भार अनुरोध/आदेश फाराम</h2>
             </div>
        </div>

        <div className="flex justify-between items-end mb-4">
            <div className="w-1/3">
                <div className="flex items-center gap-2"><span>श्री:</span><input className="border-b border-dotted border-slate-600 flex-1 outline-none bg-transparent" placeholder="शाखा प्रमुख / प्रशासन" disabled={isViewOnly}/></div>
            </div>
            <div className="w-1/3 text-right space-y-1">
                <div className="flex items-center justify-end gap-2"><span>अनुरोध नं:</span><span className="border-b border-dotted border-slate-600 w-24 text-center font-bold text-red-600 px-1">{formDetails.formNo}</span></div>
                <div className="flex items-center justify-end gap-2">
                    <span>मिति:</span>
                    <NepaliDatePicker 
                        value={formDetails.date}
                        onChange={(val) => setFormDetails({...formDetails, date: val})}
                        format="YYYY/MM/DD"
                        label=""
                        hideIcon={true}
                        inputClassName="border-b border-dotted border-slate-600 w-32 text-center outline-none bg-transparent font-bold px-0 py-0 h-auto focus:ring-0"
                        wrapperClassName="w-32"
                        disabled={isViewOnly}
                        popupAlign="right"
                        minDate={todayBS}
                        maxDate={todayBS}
                    />
                </div>
            </div>
        </div>

        <table className="w-full border-collapse border border-slate-900 text-center text-xs">
            <thead>
                <tr className="bg-slate-50">
                    <th className="border border-slate-900 p-2 w-10">क्र.सं.</th>
                    <th className="border border-slate-900 p-2 w-64">सामानको नाम (खर्च नहुने)</th>
                    <th className="border border-slate-900 p-2 w-32">संकेत नं. / कोड</th>
                    <th className="border border-slate-900 p-2">विवरण (के भएको हो?)</th>
                    <th className="border border-slate-900 p-2 w-16">परिमाण</th>
                    <th className="border border-slate-900 p-2 w-16">एकाई</th>
                    <th className="border border-slate-900 p-2 w-32">कैफियत</th>
                    {!isViewOnly && <th className="border border-slate-900 p-2 w-8 no-print"></th>}
                </tr>
            </thead>
            <tbody>
                {items.map((item, index) => (
                    <tr key={item.id}>
                        <td className="border border-slate-900 p-2">{index + 1}</td>
                        <td className="border border-slate-900 p-1">
                            {!isViewOnly ? (
                                <SearchableSelect 
                                    options={itemOptions} 
                                    value={item.name} 
                                    onChange={(val) => updateItem(item.id, 'name', val)} 
                                    onSelect={(opt) => {
                                        const invItem = opt.itemData as InventoryItem;
                                        if (invItem) {
                                            updateItem(item.id, 'codeNo', invItem.uniqueCode || invItem.sanketNo || '');
                                            updateItem(item.id, 'unit', invItem.unit);
                                            updateItem(item.id, 'name', invItem.itemName);
                                        }
                                    }} 
                                    placeholder="सामान छान्नुहोस्..." 
                                    className="!border-none !bg-transparent !p-0" 
                                />
                            ) : <div className="text-left px-2 font-bold">{item.name}</div>}
                        </td>
                        <td className="border border-slate-900 p-1">
                            <input disabled={isViewOnly} value={item.codeNo} onChange={(e) => updateItem(item.id, 'codeNo', e.target.value)} className="w-full bg-transparent text-center outline-none font-mono" />
                        </td>
                        <td className="border border-slate-900 p-1">
                            <input disabled={isViewOnly} value={item.details} onChange={(e) => updateItem(item.id, 'details', e.target.value)} className="w-full bg-transparent text-left px-2 outline-none" placeholder="Description"/>
                        </td>
                        <td className="border border-slate-900 p-1">
                            <input disabled={isViewOnly} type="number" value={item.quantity || ''} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} className="w-full bg-transparent text-center outline-none font-bold" />
                        </td>
                        <td className="border border-slate-900 p-1">
                            <input disabled={isViewOnly} value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="w-full bg-transparent text-center outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                            <input disabled={isViewOnly} value={item.remarks} onChange={(e) => updateItem(item.id, 'remarks', e.target.value)} className="w-full bg-transparent text-left px-2 outline-none" />
                        </td>
                        {!isViewOnly && (
                            <td className="border border-slate-900 p-1 no-print">
                                <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>

        {!isViewOnly && (
            <button onClick={handleAddRow} className="mt-2 no-print flex items-center gap-1 text-primary-600 font-bold text-xs px-2 py-1 bg-primary-50 rounded border border-dashed border-primary-200">
                <Plus size={12} /> थप्नुहोस् (Add Item)
            </button>
        )}

        <div className="grid grid-cols-3 gap-8 mt-16 text-[11px]">
            <div>
                <div className="font-bold mb-4 border-t border-slate-800 pt-2">अनुरोध गर्नेको दस्तखत:</div>
                <div className="space-y-1">
                    <div className="flex gap-1"><span>नाम:</span><input value={formDetails.requestedBy.name} onChange={(e) => setFormDetails({...formDetails, requestedBy: {...formDetails.requestedBy, name: e.target.value}})} className="border-b border-dotted border-slate-400 flex-1 outline-none bg-transparent" disabled={isViewOnly}/></div>
                    <div className="flex gap-1"><span>पद:</span><input value={formDetails.requestedBy.designation} onChange={(e) => setFormDetails({...formDetails, requestedBy: {...formDetails.requestedBy, designation: e.target.value}})} className="border-b border-dotted border-slate-400 flex-1 outline-none bg-transparent" disabled={isViewOnly}/></div>
                    {/* अनुरोध गर्ने मुनि मिति */}
                    <div className="flex gap-1"><span>मिति:</span><input value={formDetails.requestedBy.date || formDetails.date} readOnly className="border-b border-dotted border-slate-400 flex-1 outline-none bg-transparent text-slate-500" /></div>
                </div>
            </div>
            <div>
                <div className="font-bold mb-4 border-t border-slate-800 pt-2">सिफारिस गर्नेको दस्तखत:</div>
                <div className="space-y-1">
                    <div className="flex gap-1"><span>नाम:</span><input value={formDetails.recommendedBy.name} onChange={(e) => setFormDetails({...formDetails, recommendedBy: {...formDetails.recommendedBy, name: e.target.value}})} className="border-b border-dotted border-slate-400 flex-1 outline-none bg-transparent" disabled={isViewOnly}/></div>
                    <div className="flex gap-1"><span>पद:</span><input value={formDetails.recommendedBy.designation} onChange={(e) => setFormDetails({...formDetails, recommendedBy: {...formDetails.recommendedBy, designation: e.target.value}})} className="border-b border-dotted border-slate-400 flex-1 outline-none bg-transparent" disabled={isViewOnly}/></div>
                </div>
            </div>
            <div>
                <div className="font-bold mb-4 border-t border-slate-800 pt-2">आदेश दिनेको दस्तखत:</div>
                <div className="space-y-1">
                    <div className="flex gap-1"><span>नाम:</span><input value={formDetails.approvedBy.name} onChange={(e) => setFormDetails({...formDetails, approvedBy: {...formDetails.approvedBy, name: e.target.value}})} className="border-b border-dotted border-slate-400 flex-1 outline-none bg-transparent" disabled={isViewOnly || !canApprove}/></div>
                    {/* आदेश दिनेको पद */}
                    <div className="flex gap-1"><span>पद:</span><input value={formDetails.approvedBy.designation} onChange={(e) => setFormDetails({...formDetails, approvedBy: {...formDetails.approvedBy, designation: e.target.value}})} className="border-b border-dotted border-slate-400 flex-1 outline-none bg-transparent" disabled={isViewOnly || !canApprove}/></div>
                    <div className="flex gap-1"><span>मिति:</span><input value={formDetails.approvedBy.date} readOnly className="border-b border-dotted border-slate-400 flex-1 outline-none bg-transparent text-slate-500" /></div>
                </div>
            </div>
        </div>

        <div className="mt-12 pt-4 border-t border-slate-200">
            <p className="font-bold mb-2">मर्मत गर्ने (फर्म/निकाय/व्यक्ति):</p>
            <div className="flex gap-2"><span>नाम:</span><input className="border-b border-dotted border-slate-400 w-64 outline-none bg-transparent" disabled={isViewOnly}/></div>
        </div>
      </div>

      {/* History Table */}
      {allHistory.length > 0 && !isViewOnly && (
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden no-print mt-6">
              <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex justify-between items-center text-blue-800">
                  <div className="flex items-center gap-2"><FileText size={18} /><h3 className="font-bold font-nepali">मर्मत इतिहास (Maintenance History)</h3></div>
                  <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{allHistory.length} Forms</span>
              </div>
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium">
                      <tr><th className="px-6 py-3">Order No</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Requested By</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {allHistory.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50">
                              <td className="px-6 py-3 font-mono font-medium">#{req.formNo}</td>
                              <td className="px-6 py-3 font-nepali">{req.date}</td>
                              <td className="px-6 py-3">{req.requestedBy.name}</td>
                              <td className="px-6 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${req.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{req.status}</span>
                              </td>
                              <td className="px-6 py-3 text-right">
                                  <button onClick={() => handleLoadEntry(req, true)} className="text-primary-600 hover:text-primary-800 font-medium text-xs flex items-center justify-end gap-1">
                                      <Eye size={14} /> View / Preview
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
};
