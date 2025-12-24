
import React, { useState, useEffect, useMemo } from 'react';
import { Save, RotateCcw, Activity, UserPlus, List, Phone, MapPin, Calendar, FileDigit, User, Stethoscope, Users, TrendingUp, FlaskConical, AlertCircle, X, ChevronRight, Microscope, CheckCircle2, Eye, Search, Pencil, Trash2 } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';
import { NepaliDatePicker } from './NepaliDatePicker';
import { Option, TBPatient, TBReport, User as UserType } from '../types';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

interface TBPatientRegistrationProps {
  currentFiscalYear: string;
  currentUser: UserType;
  patients: TBPatient[];
  onAddPatient: (patient: TBPatient) => void;
  onUpdatePatient: (patient: TBPatient) => void;
  onDeletePatient: (patientId: string) => void;
}

export const TBPatientRegistration: React.FC<TBPatientRegistrationProps> = ({ 
    currentFiscalYear, 
    currentUser, 
    patients = [], 
    onAddPatient, 
    onUpdatePatient, 
    onDeletePatient 
}) => {
  const [showSputumModal, setShowSputumModal] = useState(false);
  const [showReportListModal, setShowReportListModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for Lab Report Entry
  const [selectedPatient, setSelectedPatient] = useState<{patient: TBPatient, reason: string, scheduleMonth: number} | null>(null);
  const [labFormData, setLabFormData] = useState({
    testDate: new Date().toISOString().split('T')[0],
    testDateNepali: '',
    labNo: '',
    result: '',
    grading: ''
  });

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'APPROVAL';

  const generateId = () => {
    const fyClean = currentFiscalYear.replace('/', '');
    const currentFYPatients = patients.filter(p => p.fiscalYear === currentFiscalYear);
    const maxNum = currentFYPatients.reduce((max, p) => {
        const parts = p.patientId.split('-');
        const val = parts.length > 2 ? parseInt(parts[2]) : 0;
        return Math.max(max, val);
    }, 0);
    return `TB-${fyClean}-${String(maxNum + 1).padStart(4, '0')}`;
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<Omit<TBPatient, 'id' | 'reports' | 'completedSchedule' | 'newReportAvailable'>>({
    patientId: '',
    name: '',
    age: '',
    address: '',
    phone: '',
    regType: '',
    classification: '',
    registrationDate: getTodayDate(),
    fiscalYear: currentFiscalYear
  });

  // Effect to handle ID generation
  useEffect(() => {
    if (!editingPatientId) {
        setFormData(prev => ({ ...prev, patientId: generateId(), fiscalYear: currentFiscalYear }));
    }
  }, [currentFiscalYear, patients.length, editingPatientId]);

  const regTypes: Option[] = [
    { id: 'new', label: 'नयाँ (New)', value: 'New' },
    { id: 'relapse', label: 'दोहोरिएको (Relapse)', value: 'Relapse' },
    { id: 'transfer_in', label: 'सरुवा भई आएको (Transferred In)', value: 'Transferred In' },
    { id: 'failure', label: 'उपचार असफल (Treatment After Failure)', value: 'Treatment After Failure' },
    { id: 'lost', label: 'हराएको बिरामी (Lost to Follow-up)', value: 'Lost to Follow-up' },
    { id: 'other', label: 'अन्य (Other)', value: 'Other' },
  ];

  const classificationOptions: Option[] = [
    { id: 'pbc', label: 'PBC (Pulmonary Bacteriologically Confirmed)', value: 'PBC' },
    { id: 'pcd', label: 'PCD (Pulmonary Clinically Diagnosed)', value: 'PCD' },
    { id: 'ep', label: 'EP (Extrapulmonary)', value: 'EP' },
  ];

  const getSputumTestStatus = (p: TBPatient) => {
    const regDate = new Date(p.registrationDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - regDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isDone = (month: number) => (p.completedSchedule || []).includes(month);

    if (diffDays <= 30 && !isDone(0)) return { required: true, reason: 'सुरुवाती निदान (Baseline/Month 0)', scheduleMonth: 0 };
    if (diffDays >= 55 && diffDays <= 65 && !isDone(2)) {
        if (['PBC', 'PCD', 'EP'].includes(p.classification)) return { required: true, reason: 'दोस्रो महिना फलोअप (Month 2 Follow-up)', scheduleMonth: 2 };
    }
    if (diffDays >= 85 && diffDays <= 95 && !isDone(3)) {
        if (p.classification === 'PBC' && p.labResultMonth2Positive) return { required: true, reason: 'तेस्रो महिना फलोअप (Month 3 - M2 Pos)', scheduleMonth: 3 };
    }
    if (diffDays >= 145 && diffDays <= 155 && !isDone(5)) {
        if (p.classification === 'PBC') return { required: true, reason: 'पाँचौं महिना फलोअप (Month 5 Follow-up)', scheduleMonth: 5 };
    }
    if (diffDays >= 175 && diffDays <= 185 && !isDone(6)) {
        if (p.classification === 'PBC') return { required: true, reason: 'छैठौं महिना फलोअप (Month 6 End Tx)', scheduleMonth: 6 };
    }
    return { required: false, reason: '', scheduleMonth: -1 };
  };

  const patientsNeedingSputum = patients
    .map(p => ({ ...p, ...getSputumTestStatus(p) }))
    .filter(p => p.required);

  const patientsWithNewReports = patients.filter(p => p.newReportAvailable);
  const sputumRequestCount = patientsNeedingSputum.length;
  const newReportCount = patientsWithNewReports.length;
  const totalPatients = patients.length;
  const newCasesCount = patients.filter(p => p.regType === 'New').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
        if (editingPatientId) {
            const original = patients.find(p => p.id === editingPatientId);
            if (original) {
                await onUpdatePatient({
                    ...original,
                    ...formData,
                });
                alert('विवरण अद्यावधिक गरियो।');
            }
        } else {
            const newPatient: TBPatient = {
                id: Date.now().toString(),
                ...formData,
                completedSchedule: [],
                newReportAvailable: false,
                reports: []
            };
            await onAddPatient(newPatient);
            alert('बिरामी सफलतापूर्वक दर्ता भयो।');
        }
        handleReset();
    } catch (err) {
        alert('डाटा सुरक्षित गर्दा समस्या आयो।');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setEditingPatientId(null);
    setFormData({
      patientId: generateId(),
      name: '',
      age: '',
      address: '',
      phone: '',
      regType: '',
      classification: '',
      registrationDate: getTodayDate(),
      fiscalYear: currentFiscalYear
    });
  };

  const handleEditPatient = (p: TBPatient) => {
      setEditingPatientId(p.id);
      setFormData({
          patientId: p.patientId,
          name: p.name,
          age: p.age,
          address: p.address,
          phone: p.phone,
          regType: p.regType,
          classification: p.classification,
          registrationDate: p.registrationDate,
          fiscalYear: p.fiscalYear
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (p: TBPatient) => {
      if (window.confirm(`के तपाईं निश्चित हुनुहुन्छ? बिरामी "${p.name}" को सम्पूर्ण विवरण मेटिनेछ।`)) {
          onDeletePatient(p.id);
      }
  };

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm) ||
    p.address?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.id.localeCompare(a.id));

  const handlePatientClick = (p: typeof patientsNeedingSputum[0]) => {
    setSelectedPatient({ patient: p, reason: p.reason, scheduleMonth: p.scheduleMonth });
    setLabFormData({ testDate: getTodayDate(), testDateNepali: '', labNo: '', result: '', grading: '' });
  };

  const handleLabSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedPatient) return;
      if (!labFormData.labNo.trim()) { alert('कृपया ल्याब नं. भर्नुहोस्।'); return; }
      if (!labFormData.result) { alert('कृपया नतिजा छान्नुहोस्।'); return; }
      if (labFormData.result === 'Positive' && !labFormData.grading) { alert('कृपया ग्रेडिङ छान्नुहोस्।'); return; }

      const { patient, scheduleMonth } = selectedPatient;
      const updatedPatient: TBPatient = { ...patient };
      updatedPatient.completedSchedule = [...(patient.completedSchedule || []), scheduleMonth];
      if (scheduleMonth === 2 && labFormData.result === 'Positive') updatedPatient.labResultMonth2Positive = true;
      updatedPatient.newReportAvailable = true;
      updatedPatient.latestResult = labFormData.result === 'Positive' ? `Pos (${labFormData.grading})` : 'Negative';
      updatedPatient.latestReportMonth = scheduleMonth;
      const newReport: TBReport = {
          month: scheduleMonth,
          result: labFormData.result === 'Positive' ? `Pos (${labFormData.grading})` : 'Negative',
          labNo: labFormData.labNo,
          date: labFormData.testDate,
          dateNepali: labFormData.testDateNepali
      };
      updatedPatient.reports = [newReport, ...(patient.reports || [])];

      await onUpdatePatient(updatedPatient);
      setSelectedPatient(null);
  };

  const handleViewReport = (patientId: string) => {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
          onUpdatePatient({ ...patient, newReportAvailable: false });
      }
      setShowReportListModal(false);
      const tableElement = document.getElementById('recent-patients-table');
      if (tableElement) tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Activity size={24} /></div>
            <div>
                <h2 className="text-xl font-bold text-slate-800 font-nepali">क्षयरोग बिरामी दर्ता (TB Patient Registration)</h2>
                <p className="text-sm text-slate-500 font-nepali">{editingPatientId ? 'बिरामी विवरण सच्याउँदै' : 'नयाँ क्षयरोग बिरामीको विवरण प्रविष्ट गर्नुहोस्'}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white shadow-lg flex items-center justify-between">
            <div><p className="text-green-100 text-sm font-medium font-nepali mb-1">नयाँ बिरामी (New)</p><h3 className="text-3xl font-bold">{newCasesCount}</h3></div>
            <div className="bg-white/20 p-3 rounded-lg"><UserPlus size={24} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div><p className="text-slate-500 text-sm font-medium font-nepali mb-1">कुल दर्ता (Total)</p><h3 className="text-3xl font-bold text-slate-800">{totalPatients}</h3></div>
            <div className="bg-blue-50 p-3 rounded-lg"><Users size={24} className="text-blue-600" /></div>
        </div>
        <div 
            onClick={() => setShowSputumModal(true)}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:bg-orange-50/50 transition-all active:scale-95 group"
        >
            <div><p className="text-slate-500 text-sm font-medium font-nepali mb-1">खकार परीक्षण (Pending)</p><h3 className="text-3xl font-bold text-orange-600">{sputumRequestCount}</h3></div>
            <div className="bg-orange-50 p-3 rounded-lg relative"><FlaskConical size={24} className="text-orange-600" />{sputumRequestCount > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}</div>
        </div>
        <div 
            onClick={() => setShowReportListModal(true)}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:bg-teal-50/50 transition-all active:scale-95 group"
        >
            <div><p className="text-slate-500 text-sm font-medium font-nepali mb-1">नयाँ रिपोर्ट (Reports)</p><h3 className="text-3xl font-bold text-teal-600">{newReportCount}</h3></div>
            <div className="bg-teal-50 p-3 rounded-lg relative"><Microscope size={24} className="text-teal-600" />{newReportCount > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div><p className="text-slate-500 text-sm font-medium font-nepali mb-1">आजको दर्ता</p><h3 className="text-3xl font-bold text-slate-800">{patients.filter(p => p.registrationDate === getTodayDate()).length}</h3></div>
            <div className="bg-purple-50 p-3 rounded-lg"><TrendingUp size={24} className="text-purple-600" /></div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xl transition-all">
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3">
              <FileDigit className="text-blue-600" />
              <div className="flex-1"><label className="text-xs font-bold text-blue-600 uppercase block mb-1">बिरामी परिचय नं. (ID)</label><input type="text" value={formData.patientId} readOnly className="bg-transparent border-none text-xl font-bold text-slate-800 focus:ring-0 p-0 w-full font-mono" /></div>
              {editingPatientId && <button type="button" onClick={handleReset} className="px-3 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50">Cancel Edit</button>}
            </div>
            <Input label="बिरामीको नाम *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Full Name" icon={<User size={18} />} />
            <div className="grid grid-cols-2 gap-4">
               <Input label="उमेर *" type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required placeholder="Age" icon={<Calendar size={18} />} />
               <Input label="फोन नं. *" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="98XXXXXXXX" icon={<Phone size={18} />} />
            </div>
            <Input label="ठेगाना *" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required placeholder="Address" icon={<MapPin size={18} />} />
            <Input label="दर्ता मिति *" type="date" value={formData.registrationDate} onChange={e => setFormData({...formData, registrationDate: e.target.value})} required className="bg-slate-50" icon={<Calendar size={18} />} />
            <Select label="दर्ता प्रकार *" options={regTypes} value={formData.regType} onChange={e => setFormData({...formData, regType: e.target.value})} required icon={<List size={18} />} />
            <Select label="वर्गीकरण *" options={classificationOptions} value={formData.classification} onChange={e => setFormData({...formData, classification: e.target.value})} required icon={<Stethoscope size={18} />} />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={handleReset} className="px-6 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium">रिसेट (Reset)</button>
            <button type="submit" disabled={isProcessing} className={`flex items-center gap-2 px-8 py-2 rounded-lg shadow-lg text-white font-bold transition-all active:scale-95 ${editingPatientId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              <Save size={18} />
              <span>{editingPatientId ? 'अपडेट गर्नुहोस्' : 'दर्ता गर्नुहोस्'}</span>
            </button>
          </div>
        </form>
      </div>

      <div id="recent-patients-table" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3"><h3 className="font-bold text-slate-700 font-nepali">दर्ता भएका बिरामीहरू</h3><span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{filteredPatients.length}</span></div>
          <div className="relative w-full sm:w-72"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={16} /></div><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="खोज्नुहोस्..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm transition-all" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Name & Details</th>
                <th className="px-6 py-3">Classification</th>
                <th className="px-6 py-3">Results History</th>
                <th className="px-6 py-3">Date</th>
                {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-slate-400 italic">डाटा फेला परेन।</td></tr>
              ) : (
                filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-primary-600">{p.patientId}</td>
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <div className="text-[10px] text-slate-500">{p.age} Yrs | {p.phone} | {p.address}</div>
                        </td>
                        <td className="px-6 py-4"><span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-black border border-purple-100">{p.classification}</span></td>
                        <td className="px-6 py-4">
                            {p.reports && p.reports.length > 0 ? (
                                <div className="space-y-1">
                                    {p.reports.slice(0, 2).map((r, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px]"><span className="font-bold text-slate-400 w-10">M{r.month}</span><span className={`px-1 rounded font-bold ${r.result.includes('Pos') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{r.result}</span></div>
                                    ))}
                                </div>
                            ) : <span className="text-slate-300 text-[10px]">No tests yet</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-nepali text-xs">{p.registrationDate}</td>
                        {isAdmin && (
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEditPatient(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit"><Pencil size={16}/></button>
                                    <button onClick={() => handleDeleteClick(p)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        )}
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sputum Request LIST Modal */}
      {showSputumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSputumModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b bg-orange-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3"><div className="bg-orange-100 p-2 rounded-lg text-orange-600"><FlaskConical size={20} /></div><h3 className="font-bold text-slate-800 font-nepali">खकार परीक्षण आवश्यक सूची</h3></div>
                    <button onClick={() => setShowSputumModal(false)}><X size={20} className="text-slate-400"/></button>
                </div>
                <div className="overflow-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr><th className="px-6 py-3">ID</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3 text-right">Action</th></tr></thead><tbody className="divide-y">{patientsNeedingSputum.map(p => (<tr key={p.id} className="hover:bg-orange-50/30"><td className="px-6 py-4 font-mono font-bold text-primary-600">{p.patientId}</td><td className="px-6 py-4 font-bold">{p.name}</td><td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">{p.reason}</span></td><td className="px-6 py-4 text-right"><button onClick={() => handlePatientClick(p)} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold">Add Result</button></td></tr>))}</tbody></table></div>
            </div>
        </div>
      )}

      {/* Report LIST Modal */}
      {showReportListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowReportListModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b bg-teal-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3"><div className="bg-teal-100 p-2 rounded-lg text-teal-600"><Microscope size={20} /></div><h3 className="font-bold text-slate-800 font-nepali">भर्खरै प्राप्त रिपोर्टहरू</h3></div>
                    <button onClick={() => setShowReportListModal(false)}><X size={20} className="text-slate-400"/></button>
                </div>
                <div className="overflow-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr><th className="px-6 py-3">ID</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Month</th><th className="px-6 py-3">Result</th><th className="px-6 py-3 text-right">Action</th></tr></thead><tbody className="divide-y">{patientsWithNewReports.map(p => (<tr key={p.id} className="hover:bg-teal-50/30"><td className="px-6 py-4 font-mono font-bold text-primary-600">{p.patientId}</td><td className="px-6 py-4 font-bold">{p.name}</td><td className="px-6 py-4 text-xs">Month {p.latestReportMonth}</td><td className="px-6 py-4"><span className={`px-2 py-0.5 rounded font-bold text-xs ${p.latestResult?.includes('Pos') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{p.latestResult}</span></td><td className="px-6 py-4 text-right"><button onClick={() => handleViewReport(p.id)} className="bg-teal-600 text-white px-3 py-1 rounded-lg text-xs font-bold">Mark Viewed</button></td></tr>))}</tbody></table></div>
            </div>
        </div>
      )}

      {/* Lab Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedPatient(null)}></div>
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl relative animate-in zoom-in-95">
                <div className="p-6 border-b flex items-start gap-4"><div className="bg-primary-100 p-3 rounded-full text-primary-600"><Microscope size={24} /></div><div><h3 className="font-bold text-slate-800 text-lg font-nepali">प्रयोगशाला नतिजा</h3><p className="text-xs text-slate-600 mt-1"><span className="font-bold">{selectedPatient.patient.name}</span> | <span className="text-orange-600 font-bold">{selectedPatient.reason}</span></p></div><button onClick={() => setSelectedPatient(null)} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button></div>
                <form onSubmit={handleLabSubmit} className="p-6 space-y-4">
                    <Input label="ल्याब नं. *" value={labFormData.labNo} onChange={e => setLabFormData({...labFormData, labNo: e.target.value})} required placeholder="Lab Number" />
                    <div className="grid grid-cols-2 gap-4"><Input label="मिति (AD)" type="date" value={labFormData.testDate} onChange={e => setLabFormData({...labFormData, testDate: e.target.value})} required /><NepaliDatePicker label="मिति (BS)" value={labFormData.testDateNepali} onChange={val => setLabFormData({...labFormData, testDateNepali: val})} required /></div>
                    <div className="space-y-2"><label className="text-sm font-medium text-slate-700">नतिजा *</label><div className="grid grid-cols-2 gap-3"><label className={`border rounded-lg p-3 flex flex-col items-center gap-2 cursor-pointer ${labFormData.result === 'Negative' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200'}`}><input type="radio" name="result" value="Negative" checked={labFormData.result === 'Negative'} onChange={e => setLabFormData({...labFormData, result: e.target.value})} className="sr-only"/><CheckCircle2 size={24} className={labFormData.result === 'Negative' ? 'text-green-600' : 'text-slate-300'} /><span className="text-xs font-bold">Negative</span></label><label className={`border rounded-lg p-3 flex flex-col items-center gap-2 cursor-pointer ${labFormData.result === 'Positive' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200'}`}><input type="radio" name="result" value="Positive" checked={labFormData.result === 'Positive'} onChange={e => setLabFormData({...labFormData, result: e.target.value})} className="sr-only"/><FlaskConical size={24} className={labFormData.result === 'Positive' ? 'text-red-600' : 'text-slate-300'} /><span className="text-xs font-bold">Positive</span></label></div></div>
                    {labFormData.result === 'Positive' && <Select label="ग्रेडिङ *" value={labFormData.grading} onChange={e => setLabFormData({...labFormData, grading: e.target.value})} options={[{id: 's', value: 'Scanty', label: 'Scanty'}, {id: '1', value: '1+', label: '1+'}, {id: '2', value: '2+', label: '2+'}, {id: '3', value: '3+', label: '3+'}]} required />}
                    <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setSelectedPatient(null)} className="px-4 py-2 text-slate-500 text-sm font-bold">Cancel</button><button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-lg">Save Report</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
