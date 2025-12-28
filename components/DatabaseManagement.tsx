
import React, { useState, useMemo } from 'react';
import { Database, Download, Upload, FileJson, FileSpreadsheet, ShieldCheck, HardDrive, FileText, Users, ShoppingCart, Archive, Syringe, FileUp, AlertCircle, CheckCircle2, FolderUp, Info, Trash2, AlertTriangle, Lock, Store as StoreIcon, Table as TableIcon, Loader2, Sparkles, OctagonAlert } from 'lucide-react';
import { User, InventoryItem, MagFormEntry, PurchaseOrderEntry, IssueReportEntry, RabiesPatient, FirmEntry, Store, Option } from '../types';
import { Select } from './Select';

interface DatabaseManagementProps {
  currentUser: User;
  users: User[];
  inventoryItems: InventoryItem[];
  magForms: MagFormEntry[];
  purchaseOrders: PurchaseOrderEntry[];
  issueReports: IssueReportEntry[];
  rabiesPatients: RabiesPatient[];
  firms: FirmEntry[];
  stores: Store[];
  onClearData?: (sectionId: string) => void;
}

export const DatabaseManagement: React.FC<DatabaseManagementProps> = ({
  currentUser,
  users,
  inventoryItems,
  magForms,
  purchaseOrders,
  issueReports,
  rabiesPatients,
  firms,
  stores,
  onClearData
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'upload' | 'delete'>('download');
  const [uploadTarget, setUploadTarget] = useState('');
  const [selectedStoreForUpload, setSelectedStoreForUpload] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const dataSections = useMemo(() => [
    { id: 'users', title: 'प्रयोगकर्ताहरू (Users)', data: users, icon: <Users size={24} className="text-blue-600" />, desc: 'प्रणाली प्रयोगकर्ता र लगइन विवरण', color: 'bg-blue-50 border-blue-200' },
    { id: 'inventory', title: 'जिन्सी मौज्दात (Inventory)', data: inventoryItems, icon: <Database size={24} className="text-purple-600" />, desc: 'हालको जिन्सी सामानहरूको सूची', color: 'bg-purple-50 border-purple-200' },
    { id: 'mag_forms', title: 'माग फारमहरू (Mag Forms)', data: magForms, icon: <FileText size={24} className="text-orange-600" />, desc: 'सबै माग फारमहरूको विवरण', color: 'bg-orange-50 border-orange-200' },
    { id: 'purchase_orders', title: 'खरिद आदेश (Purchase Orders)', data: purchaseOrders, icon: <ShoppingCart size={24} className="text-green-600" />, desc: 'जारी गरिएका खरिद आदेशहरू', color: 'bg-green-50 border-green-200' },
    { id: 'issue_reports', title: 'निकासा प्रतिवेदन (Issue Reports)', data: issueReports, icon: <Archive size={24} className="text-teal-600" />, desc: 'सामान निकासा र खर्च विवरण', color: 'bg-teal-50 border-teal-200' },
    { id: 'rabies', title: 'रेबिज़ बिरामी (Rabies Patients)', data: rabiesPatients, icon: <Syringe size={24} className="text-red-600" />, desc: 'रेबिज़ खोप र बिरामीको रेकर्ड', color: 'bg-red-50 border-red-200' },
    { id: 'firms', title: 'दर्ता फर्महरू (Firms)', data: firms, icon: <ShieldCheck size={24} className="text-indigo-600" />, desc: 'सुचीकृत फर्म/सप्लायर्स', color: 'bg-indigo-50 border-indigo-200' },
    { id: 'stores', title: 'स्टोरहरू (Stores)', data: stores, icon: <HardDrive size={24} className="text-slate-600" />, desc: 'विभिन्न स्टोरहरूको विवरण', color: 'bg-slate-100 border-slate-200' }
  ], [users, inventoryItems, magForms, purchaseOrders, issueReports, rabiesPatients, firms, stores]);

  const storeOptions: Option[] = useMemo(() => {
    return stores.map(s => ({
      id: s.id,
      value: s.id,
      label: `${s.name} (${s.address || 'No Address'})`
    }));
  }, [stores]);

  const uploadOptions = useMemo(() => {
    return dataSections.map(section => ({
      id: section.id,
      value: section.id,
      label: section.title
    }));
  }, [dataSections]);

  if (currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 animate-in fade-in zoom-in-95">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <Lock size={48} className="text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-700 font-nepali mb-2">पहुँच अस्वीकृत (Access Denied)</h3>
        <p className="text-sm text-slate-500 max-w-md text-center">
          माफ गर्नुहोला, डाटाबेस व्यवस्थापनको सुविधा केवल <strong>Super Admin</strong> को लागि मात्र उपलब्ध छ।
        </p>
      </div>
    );
  }

  const downloadJSON = (data: any[], filename: string) => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const convertToCSV = (objArray: any[]) => {
    if (!objArray || objArray.length === 0) return '';
    const headers = Object.keys(objArray[0]);
    const csvRows = [headers.join(',')];
    for (const row of objArray) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (typeof val === 'object' ? JSON.stringify(val) : val)).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("डाउनलोड गर्नको लागि कुनै डाटा छैन");
      return;
    }
    const csvString = convertToCSV(data);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess(null);
    }
  };

  const handleUpload = () => {
    if (!uploadTarget || !selectedFile) return;
    if (uploadTarget === 'inventory' && !selectedStoreForUpload) {
      alert("कृपया मौज्दात अपलोडको लागि स्टोर छान्नुहोस्।");
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(`फाइल सफलतापूर्वक अपलोड भयो!`);
      setSelectedFile(null);
      setSelectedStoreForUpload('');
    }, 2000);
  };

  const handleDelete = (sectionId: string, title: string) => {
    if (window.confirm(`के तपाईं निश्चित हुनुहुन्छ कि तपाईं "${title}" को सम्पूर्ण डाटा मेटाउन चाहनुहुन्छ?`)) {
      if (onClearData) onClearData(sectionId);
    }
  };

  const fileFormatSpecs: Record<string, string> = {
    users: "username, password, role, fullName, designation, phoneNumber, organizationName",
    mag_forms: "fiscalYear, formNo, date, status",
    purchase_orders: "magFormNo, requestDate, status, vendorName",
    issue_reports: "magFormNo, issueDate, status, demandBy",
    rabies: "regNo, name, age, sex, address, phone, regimen",
    firms: "firmName, vatPan, address, contactNo",
    stores: "name, address, contactPerson, contactPhone",
    inventory: "itemName, itemType, unit, currentQuantity, rate, batchNo, expiryDateAd, uniqueCode, sanketNo"
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-nepali">डाटाबेस व्यवस्थापन (Database Management)</h2>
          <p className="text-sm text-slate-500">प्रणालीको डाटा ब्याकअप र आयात/निर्यात</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
        <button onClick={() => setActiveTab('download')} className={`pb-3 px-1 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === 'download' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
          <div className="flex items-center gap-2"><Download size={18} />डाटा डाउनलोड</div>
          {activeTab === 'download' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
        </button>
        <button onClick={() => setActiveTab('upload')} className={`pb-3 px-1 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === 'upload' ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'}`}>
          <div className="flex items-center gap-2"><Upload size={18} />डाटा अपलोड (Excel)</div>
          {activeTab === 'upload' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></div>}
        </button>
        <button onClick={() => setActiveTab('delete')} className={`pb-3 px-1 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === 'delete' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'}`}>
          <div className="flex items-center gap-2"><Trash2 size={18} />डाटा मेटाउनुहोस्</div>
          {activeTab === 'delete' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></div>}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'download' && (
          <div className="p-6 animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {dataSections.map((section) => (
                <div key={section.id} className={`p-5 rounded-xl border ${section.color} shadow-sm hover:shadow-md transition-all`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">{section.icon}</div>
                      <div>
                        <h4 className="font-bold text-slate-800 font-nepali text-sm">{section.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-white rounded-full border border-slate-200 text-slate-500">{section.data.length} Rows</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[2.5em]">{section.desc}</p>
                  <div className="flex gap-2">
                    <button onClick={() => downloadJSON(section.data, section.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 text-white py-2 rounded-lg text-xs font-medium hover:bg-slate-900 shadow-sm transition-colors"><FileJson size={14} /> JSON</button>
                    <button onClick={() => downloadCSV(section.data, section.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg text-xs font-medium hover:bg-slate-50 shadow-sm transition-colors"><FileSpreadsheet size={14} /> CSV</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="p-6 animate-in fade-in slide-in-from-right-2 duration-200">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
                <Upload className="text-green-600 mt-1" size={20} />
                <div>
                  <h4 className="font-bold text-green-800 font-nepali text-sm">डाटा अपलोड गर्नुहोस्</h4>
                  <p className="text-sm text-green-700 mt-1">एक्सेल फाइल मार्फत डाटाहरू प्रणालीमा प्रविष्ट गर्नुहोस्।</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
                <div className="space-y-4">
                  <Select 
                    label="१. डाटाको प्रकार छान्नुहोस् (Select Data Type)"
                    options={uploadOptions}
                    value={uploadTarget}
                    onChange={(e) => { 
                      setUploadTarget(e.target.value); 
                      if(e.target.value !== 'inventory') setSelectedStoreForUpload(''); 
                    }}
                    placeholder="-- छान्नुहोस् --"
                  />

                  {uploadTarget === 'inventory' && (
                    <div className="animate-in slide-in-from-top-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700 font-nepali">२. लक्ष्य स्टोर छान्नुहोस् (Target Store) *</label>
                        {stores.length === 0 && (
                          <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">नो स्टोर भेटियो!</span>
                        )}
                      </div>
                      
                      {stores.length > 0 ? (
                        <Select 
                          label=""
                          options={storeOptions}
                          value={selectedStoreForUpload}
                          onChange={(e) => setSelectedStoreForUpload(e.target.value)}
                          placeholder="-- स्टोर छान्नुहोस् --"
                          icon={<StoreIcon size={16} />}
                        />
                      ) : (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3 text-orange-800">
                          <AlertTriangle size={20} />
                          <p className="text-xs font-bold font-nepali">प्रणालीमा कुनै स्टोर भेटिएन। कृपया पहिले 'स्टोर सेटअप' मेनुमा गएर एउटा स्टोर बनाउनुहोस्।</p>
                        </div>
                      )}
                    </div>
                  )}

                  {uploadTarget && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <div className="flex items-center gap-2 text-indigo-700">
                          <TableIcon size={20} />
                          <h4 className="font-bold font-nepali text-sm">३. फाइलको कोलम विवरण (Headers)</h4>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-5 py-4 rounded-xl text-xs flex items-start gap-3">
                        <Info size={18} className="mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <span className="font-bold block mb-2 text-sm">कोलमको नामहरू (Headers):</span>
                          <div className="font-mono bg-white p-3 rounded-lg border border-blue-200 break-all leading-relaxed shadow-inner">
                            {fileFormatSpecs[uploadTarget]}
                          </div>
                          <p className="mt-3 text-[10px] text-blue-600 font-bold italic">* फाइलमा पहिलो लहर (Row 1) मा यी नामहरू ठ्याक्कै हुनुपर्छ।</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-700 font-nepali">४. फाइल छान्नुहोस् (Choose File)</label>
                    <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all relative group cursor-pointer ${selectedFile ? 'border-green-400 bg-green-50/20' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-primary-400'}`}>
                      <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="flex flex-col items-center gap-4 pointer-events-none group-hover:scale-105 transition-transform duration-300">
                        <div className={`p-4 bg-white rounded-2xl shadow-md border ${selectedFile ? 'text-green-600 border-green-200' : 'text-slate-400 border-slate-100'}`}>
                          <FileUp size={40} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-700">{selectedFile ? selectedFile.name : 'एक्सेल वा CSV फाइल यहाँ तान्नुहोस्'}</p>
                          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'Only .xlsx or .csv'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleUpload}
                    disabled={!selectedFile || !uploadTarget || (uploadTarget === 'inventory' && !selectedStoreForUpload) || isUploading}
                    className={`w-full py-4 rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-3 text-base ${(!selectedFile || !uploadTarget || (uploadTarget === 'inventory' && !selectedStoreForUpload) || isUploading) ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-green-200 active:scale-95'}`}
                  >
                    {isUploading ? <Loader2 size={24} className="animate-spin" /> : <FolderUp size={24}/>}
                    {isUploading ? 'डाटा सुरक्षित हुँदैछ...' : 'अपलोड गर्नुहोस्'}
                  </button>
                </div>
                {uploadSuccess && <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-2"><CheckCircle2 size={24} className="text-green-600" /><span className="font-bold text-sm">{uploadSuccess}</span></div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delete' && (
          <div className="p-6 animate-in fade-in slide-in-from-right-2 duration-200">
            <div className="mb-8 bg-red-50 border border-red-200 p-5 rounded-xl flex items-start gap-4">
              <AlertTriangle className="text-red-600 mt-1" size={24} />
              <div>
                <h4 className="font-black text-red-800 font-nepali text-base">खतरनाक क्षेत्र (Danger Zone)</h4>
                <p className="text-sm text-red-700 mt-1">डाटा मेटाउनु अघि ब्याकअप डाउनलोड गर्न सुझाव दिइन्छ। मेटिएको डाटा फिर्ता ल्याउन सकिँदैन।</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {dataSections.map((section) => (
                <div key={section.id} className="p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Trash2 size={80} className="text-red-600" /></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">{section.icon}</div>
                      <div>
                        <h4 className="font-bold text-slate-800 font-nepali text-sm">{section.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200 text-slate-500">{section.data.length} Rows</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(section.id, section.title)} disabled={section.data.length === 0} className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black transition-all relative z-10 ${section.data.length === 0 ? 'bg-slate-50 text-slate-300 cursor-not-allowed border-slate-200' : 'bg-white text-red-600 border-2 border-red-100 hover:bg-red-50 hover:border-red-200'}`}><Trash2 size={16} /> Delete All Records</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
