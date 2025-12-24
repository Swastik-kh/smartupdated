
import React, { useState, useEffect, useMemo } from 'react';
import { Save, RotateCcw, Syringe, Calendar, FileDigit, User, Phone, MapPin, CalendarRange, Clock, CheckCircle2, Search, X, AlertTriangle, Trash2, Info, Activity, Filter, List, Globe, RefreshCw } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';
import { NepaliDatePicker } from './NepaliDatePicker';
import { RabiesPatient, VaccinationDose, Option, User as UserType } from '../types';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

interface RabiesRegistrationProps {
  currentFiscalYear: string;
  patients: RabiesPatient[];
  onAddPatient: (patient: RabiesPatient) => void;
  onUpdatePatient: (patient: RabiesPatient) => void;
  onDeletePatient?: (patientId: string) => void; 
  currentUser: UserType; 
}

const nepaliMonthOptions = [
  { id: '01', value: '01', label: 'बैशाख (01)' },
  { id: '02', value: '02', label: 'जेठ (02)' },
  { id: '03', value: '03', label: 'असार (03)' },
  { id: '04', value: '04', label: 'साउन (04)' },
  { id: '05', value: '05', label: 'भदौ (05)' },
  { id: '06', value: '06', label: 'असोज (06)' },
  { id: '07', value: '07', label: 'कार्तिक (07)' },
  { id: '08', value: '08', label: 'मंसिर (08)' },
  { id: '09', value: '09', label: 'पुष (09)' },
  { id: '10', value: '10', label: 'माघ (10)' },
  { id: '11', value: '11', label: 'फागुन (11)' },
  { id: '12', value: '12', label: 'चैत्र (12)' },
];

const animalTypeOptions: Option[] = [
    { id: 'dog', value: 'Dog bite', label: 'कुकुरले टोकेको (Dog bite)' },
    { id: 'monkey', value: 'Monkey bite', label: 'बाँदरले टोकेको (Monkey bite)' },
    { id: 'cat', value: 'Cat bite', label: 'बिरालोले टोकेको (Cat bite)' },
    { id: 'cattle', value: 'Cattle bite', label: 'चौपायाले टोकेको (Cattle bite)' },
    { id: 'rodent', value: 'Rodent bite', label: 'मुसा/लोखर्के (Rodent bite)' },
    { id: 'jackal', value: 'Jackal bite', label: 'स्यालले टोकेको (Jackal bite)' },
    { id: 'tiger', value: 'Tiger bite', label: 'बाघले टोकेको (Tiger bite)' },
    { id: 'bear', value: 'Bear bite', label: 'भालुले टोकेको (Bear bite)' },
    { id: 'saliva', value: 'Saliva contact', label: 'र्‍याल लसपस (Saliva contact)' },
    { id: 'other', value: 'Other specify', label: 'अन्य (Other specify)' },
];

const whoCategoryOptions: Option[] = [
    { id: 'cat1', value: 'Category I', label: 'Category I (No skin break)' },
    { id: 'cat2', value: 'Category II', label: 'Category II (Minor scratches)' },
    { id: 'cat3', value: 'Category III', label: 'Category III (Transdermal bites)' },
];

const regimenOptions: Option[] = [
    { id: 'id', value: 'Intradermal', label: 'छाला भित्र (Intradermal - 0, 3, 7)' },
    { id: 'im', value: 'Intramuscular', label: 'मासु भित्र (Intramuscular - 0, 3, 7, 14, 28)' },
];

export const RabiesRegistration: React.FC<RabiesRegistrationProps> = ({ 
  currentFiscalYear, 
  patients = [], 
  onAddPatient, 
  onUpdatePatient,
  onDeletePatient,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'today'>('all');
  const [showAllYears, setShowAllYears] = useState(true); 
  const [modalDateBs, setModalDateBs] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [selectedDoseInfo, setSelectedDoseInfo] = useState<{
      patient: RabiesPatient;
      doseIndex: number;
      dose: VaccinationDose;
  } | null>(null);

  // Auto-fill modalDateBs when a dose is selected
  useEffect(() => {
    if (selectedDoseInfo) {
        try {
            const parts = selectedDoseInfo.dose.date.split('-');
            const adDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const nd = new NepaliDate(adDate);
            setModalDateBs(nd.format('YYYY-MM-DD'));
        } catch (e) {
            setModalDateBs('');
        }
    } else {
        setModalDateBs('');
    }
  }, [selectedDoseInfo]);

  const canDelete = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'APPROVAL';

  const generateRegNo = () => {
    const fyClean = currentFiscalYear.replace('/', '');
    const currentFYPatients = (patients || []).filter(p => p.fiscalYear === currentFiscalYear && p.regNo?.startsWith(`R-${fyClean}-`));
    
    if (currentFYPatients.length === 0) return `R-${fyClean}-001`;

    const maxNum = currentFYPatients
      .map(p => {
          const parts = (p.regNo || '').split('-');
          return parts.length > 2 ? parseInt(parts[2]) : 0;
      })
      .reduce((max, num) => Math.max(max, num), 0);
      
    return `R-${fyClean}-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const [formData, setFormData] = useState<RabiesPatient>({
    id: '',
    fiscalYear: currentFiscalYear,
    regNo: '',
    regMonth: '',
    regDateBs: '',
    regDateAd: '',
    name: '',
    age: '',
    sex: '',
    address: '',
    phone: '',
    animalType: '',
    exposureCategory: '',
    bodyPart: '',
    exposureDateBs: '',
    regimen: 'Intradermal',
    schedule: []
  });

  useEffect(() => {
    const today = new NepaliDate();
    const todayBs = today.format('YYYY-MM-DD');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const todayAd = new Date().toISOString().split('T')[0];
    
    setFormData(prev => ({
      ...prev,
      fiscalYear: currentFiscalYear,
      regNo: generateRegNo(),
      regDateBs: todayBs,
      regMonth: month,
      regDateAd: todayAd,
      exposureDateBs: todayBs,
      regimen: 'Intradermal'
    }));
  }, [currentFiscalYear]);

  useEffect(() => {
    if (!formData.name && !formData.phone) {
        setFormData(prev => ({ ...prev, regNo: generateRegNo() }));
    }
  }, [patients.length]);

  const calculateSchedule = (startDateAd: string, regimen: string): VaccinationDose[] => {
      if (!startDateAd || isNaN(new Date(startDateAd).getTime())) return [];
      const start = new Date(startDateAd);
      const schedule: VaccinationDose[] = [];
      const days = regimen === 'Intradermal' ? [0, 3, 7] : [0, 3, 7, 14, 28];
      
      days.forEach(dayOffset => {
          const doseDate = new Date(start);
          doseDate.setDate(start.getDate() + dayOffset);
          schedule.push({
              day: dayOffset,
              date: doseDate.toISOString().split('T')[0],
              status: 'Pending'
          });
      });
      return schedule;
  };

  const handleRegDateBsChange = (val: string) => {
    let month = formData.regMonth;
    let adDateStr = formData.regDateAd;
    if (val) {
        try {
            const parts = val.split(/[-/]/);
            if (parts.length === 3) {
                const [y, m, d] = parts.map(Number);
                month = String(m).padStart(2, '0');
                const nd = new NepaliDate(y, m - 1, d);
                adDateStr = nd.toJsDate().toISOString().split('T')[0];
            }
        } catch (e) {
            console.error("Date conversion error", e);
        }
    }
    setFormData(prev => ({
        ...prev,
        regDateBs: val,
        regMonth: month,
        regDateAd: adDateStr
    }));
  };

  const handleReset = () => {
    const today = new NepaliDate();
    setFormData({
        id: '',
        fiscalYear: currentFiscalYear,
        regNo: generateRegNo(),
        regMonth: String(today.getMonth() + 1).padStart(2, '0'),
        regDateBs: today.format('YYYY-MM-DD'),
        regDateAd: new Date().toISOString().split('T')[0],
        name: '', age: '', sex: '', address: '', phone: '',
        animalType: '', exposureCategory: '', bodyPart: '',
        exposureDateBs: today.format('YYYY-MM-DD'),
        regimen: 'Intradermal',
        schedule: []
    });
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg(null);

      if (!formData.name.trim()) { setErrorMsg("बिरामीको नाम अनिवार्य छ।"); return; }
      if (!formData.regDateBs) { setErrorMsg("दर्ता मिति अनिवार्य छ।"); return; }
      if (!formData.exposureCategory) { setErrorMsg("WHO Category अनिवार्य छ।"); return; }
      if (!formData.animalType) { setErrorMsg("टोक्ने जनावरको प्रकार अनिवार्य छ।"); return; }
      if (!formData.sex) { setErrorMsg("बिरामीको लिङ्ग छान्नुहोस्।"); return; }

      setIsProcessing(true);
      try {
          const finalSchedule = calculateSchedule(formData.regDateAd, formData.regimen);
          const newPatient: RabiesPatient = {
              ...formData,
              id: Date.now().toString(),
              schedule: finalSchedule
          };

          await onAddPatient(newPatient);
          handleReset();
          alert('बिरामी सफलतापूर्वक दर्ता भयो (Patient Registered Successfully)');
      } catch (err) {
          setErrorMsg("दर्ता गर्दा समस्या आयो। कृपया पुनः प्रयास गर्नुहोस्।");
      } finally {
          setIsProcessing(false);
      }
  };

  const confirmDoseUpdate = async () => {
      if (!selectedDoseInfo) return;
      if (!modalDateBs) { alert("कृपया खोप लगाएको मिति छान्नुहोस्"); return; }

      const { patient, doseIndex, dose } = selectedDoseInfo;
      let givenDateAd = '';
      try {
          const parts = modalDateBs.split(/[-/]/);
          const [y, m, d] = parts.map(Number);
          const nd = new NepaliDate(y, m - 1, d);
          const jsDate = nd.toJsDate();
          givenDateAd = jsDate.getFullYear() + '-' + 
                        String(jsDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(jsDate.getDate()).padStart(2, '0');
      } catch (e) {
          alert("मिति ढाँचा मिलेन");
          return;
      }

      // STRICT VALIDATION: Given date cannot be before scheduled date (EXCEPT for Day 0)
      if (dose.day !== 0 && givenDateAd < dose.date) {
          alert(`त्रुटि: खोप लगाएको मिति निर्धारित मिति (${dose.date}) भन्दा अगाडि हुन सक्दैन।`);
          return;
      }

      const updatedSchedule = [...(patient.schedule || [])];
      updatedSchedule[doseIndex] = {
          ...updatedSchedule[doseIndex],
          status: 'Given',
          givenDate: givenDateAd
      };

      await onUpdatePatient({ ...patient, schedule: updatedSchedule });
      setSelectedDoseInfo(null);
  };

  const handleDeleteClick = (patient: RabiesPatient) => {
      if (!onDeletePatient) return;
      const confirmDelete = window.confirm(`के तपाईं निश्चित हुनुहुन्छ? बिरामी "${patient.name}" को विवरण मेटिनेछ।`);
      if (confirmDelete) onDeletePatient(patient.id);
  };

  const filteredPatients = useMemo(() => {
      const todayAd = new Date().toISOString().split('T')[0];
      const patientList = Array.isArray(patients) ? patients : [];

      let result = patientList.filter(p => {
          if (!p) return false;
          const matchesFY = showAllYears || (p.fiscalYear === currentFiscalYear);
          if (!matchesFY) return false;
          const search = searchTerm.toLowerCase().trim();
          const matchesSearch = !search || 
                                p.name?.toLowerCase().includes(search) || 
                                p.regNo?.toLowerCase().includes(search) ||
                                p.phone?.includes(search);
          if (!matchesSearch) return false;
          if (filterType === 'today') {
              return (p.schedule || []).some(dose => dose.date === todayAd && dose.status === 'Pending');
          }
          return true;
      });
      return result.sort((a, b) => b.id.localeCompare(a.id));
  }, [patients, searchTerm, filterType, currentFiscalYear, showAllYears]);

  // Safe conversion for Min Date
  const scheduledDateBs = useMemo(() => {
    if (!selectedDoseInfo) return '';
    try {
        const parts = selectedDoseInfo.dose.date.split('-');
        const adDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const nd = new NepaliDate(adDate);
        return nd.format('YYYY-MM-DD');
    } catch (e) {
        return '';
    }
  }, [selectedDoseInfo]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
                <Syringe size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-800 font-nepali">रेबिज़ खोप क्लिनिक (Rabies Vaccine Clinic)</h2>
                <p className="text-sm text-slate-500 font-nepali">नयाँ बिरामी दर्ता र खोप तालिका व्यवस्थापन</p>
            </div>
        </div>
      </div>

      {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={20} />
              <p className="text-sm text-red-800 font-bold font-nepali">{errorMsg}</p>
          </div>
      )}

      {/* Registration Form */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden no-print">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
          <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
              <div className="grid md:grid-cols-4 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="md:col-span-1">
                      <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">दर्ता नम्बर (Reg No)</label>
                      <div className="bg-white border border-indigo-200 rounded-lg px-3 py-2 font-mono text-lg font-black text-indigo-700 shadow-inner">{formData.regNo}</div>
                  </div>
                  <NepaliDatePicker label="दर्ता मिति (BS) *" value={formData.regDateBs} onChange={handleRegDateBsChange} required />
                  <Select label="दर्ता महिना" value={formData.regMonth} onChange={e => setFormData({...formData, regMonth: e.target.value})} options={nepaliMonthOptions} icon={<CalendarRange size={16} />} />
                  <Input label="अंग्रेजी मिति (AD)" value={formData.regDateAd} readOnly className="bg-slate-100 text-slate-400 font-mono" icon={<Calendar size={16} />} />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                  <Input label="बिरामीको नाम *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Full Name" icon={<User size={18} />} />
                  <div className="grid grid-cols-2 gap-4">
                      <Input label="उमेर *" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required placeholder="Yr" type="number" />
                      <Select label="लिङ्ग *" value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} options={[{id: 'm', value: 'Male', label: 'पुरुष'}, {id: 'f', value: 'Female', label: 'महिला'}, {id: 'o', value: 'Other', label: 'अन्य'}]} required />
                  </div>
                  <Input label="सम्पर्क नं" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="98XXXXXXXX" icon={<Phone size={18} />} />
                  <Input label="ठेगाना *" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required placeholder="Municipality-Ward" icon={<MapPin size={18} />} />
                  <Select label="टोक्ने जनावर *" value={formData.animalType} onChange={e => setFormData({...formData, animalType: e.target.value})} options={animalTypeOptions} required />
                  <Select label="WHO Category *" value={formData.exposureCategory} onChange={e => setFormData({...formData, exposureCategory: e.target.value})} options={whoCategoryOptions} required icon={<AlertTriangle size={18} />} />
                  <div className="md:col-span-2"><Select label="खोप लगाउने तरिका (Regimen) *" value={formData.regimen} onChange={e => setFormData({...formData, regimen: e.target.value as any})} options={regimenOptions} required icon={<Activity size={18} />} /></div>
                  <Input label="टोकेको ठाउँ (Body Part)" value={formData.bodyPart} onChange={e => setFormData({...formData, bodyPart: e.target.value})} placeholder="e.g. Leg, Hand" />
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" disabled={isProcessing} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl flex items-center gap-2 font-bold" onClick={handleReset}><RotateCcw size={20} /> रिसेट</button>
                  <button type="submit" disabled={isProcessing} className="px-10 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-lg flex items-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50 font-nepali"><Save size={20} /> दर्ता गर्नुहोस्</button>
              </div>
          </form>
      </div>

      {/* Patients List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
          <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex flex-col">
                  <h3 className="font-bold text-slate-700 font-nepali text-lg">बिरामी खोप अभिलेख (Clinic Records)</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 w-fit px-3 py-1 rounded-full font-black uppercase">{filteredPatients.length} Records</span>
                  </div>
                </div>
                <div className="flex bg-slate-200/50 p-1 rounded-xl no-print">
                   <button onClick={() => setFilterType('all')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><List size={14} /> सबै</button>
                   <button onClick={() => setFilterType('today')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'today' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}><Clock size={14} /> आज</button>
                </div>
                <button onClick={() => setShowAllYears(!showAllYears)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all no-print ${showAllYears ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}><Globe size={14} /> {showAllYears ? 'सबै वर्ष' : 'यो वर्ष'}</button>
              </div>
              <div className="relative w-full lg:w-80 no-print">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="नाम, फोन वा दर्ता नं..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                      <th className="px-8 py-4">दर्ता नं / वर्ष</th>
                      <th className="px-8 py-4">बिरामी विवरण</th>
                      <th className="px-8 py-4">जनावर / Category</th>
                      <th className="px-8 py-4">खोप तालिका (Status)</th>
                      {canDelete && <th className="px-8 py-4 text-right no-print">कार्य</th>}
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {filteredPatients.length === 0 ? (
                      <tr><td colSpan={canDelete ? 5 : 4} className="px-8 py-20 text-center text-slate-400 font-nepali"><div className="flex flex-col items-center gap-3"><Search size={48} className="text-slate-200" /><p className="font-bold text-slate-500">कुनै बिरामी फेला परेन।</p></div></td></tr>
                  ) : (
                      filteredPatients.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-8 py-4"><div className="font-mono font-bold text-indigo-600">#{p.regNo}</div><div className="text-[9px] text-slate-400 font-bold">{p.fiscalYear}</div></td>
                              <td className="px-8 py-4"><div className="font-bold text-slate-800">{p.name}</div><div className="text-[10px] text-slate-400">{p.age} Yrs | {p.sex} | {p.phone}</div></td>
                              <td className="px-8 py-4"><div className="text-slate-700 font-medium">{p.animalType}</div><div className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border uppercase mt-1 ${p.exposureCategory === 'Category III' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{p.exposureCategory}</div></td>
                              <td className="px-8 py-4"><div className="flex items-center gap-2">{(p.schedule || []).map((dose, idx) => {
                                  const isToday = dose.date === new Date().toISOString().split('T')[0];
                                  return (
                                    <button key={idx} type="button" onClick={() => setSelectedDoseInfo({ patient: p, doseIndex: idx, dose })} className={`flex flex-col items-center justify-center w-12 h-14 rounded-xl border transition-all ${dose.status === 'Given' ? 'bg-green-50 border-green-200 text-green-700' : isToday ? 'bg-orange-50 border-orange-300 text-orange-700 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        <span className="text-[9px] font-black">D{dose.day}</span>
                                        {dose.status === 'Given' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                        <span className="text-[8px] mt-0.5 font-bold">{(dose.date || '').split('-').slice(1).join('/')}</span>
                                    </button>
                                  );
                              })}</div></td>
                              {canDelete && <td className="px-8 py-4 text-right no-print"><button onClick={() => handleDeleteClick(p)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18} /></button></td>}
                          </tr>
                      ))
                  )}
              </tbody>
            </table>
          </div>
      </div>

      {/* Dose Update Modal */}
      {selectedDoseInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedDoseInfo(null)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-slate-100">
                  <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
                      <div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Syringe size={20}/></div><h3 className="font-bold text-slate-800 font-nepali">खोप विवरण अपडेट</h3></div>
                      <button onClick={() => setSelectedDoseInfo(null)} className="p-2 hover:bg-white rounded-full text-slate-400"><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="text-center">
                          <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Patient Name</p>
                          <h4 className="text-xl font-black text-slate-800">{selectedDoseInfo.patient.name}</h4>
                          <div className="flex justify-center gap-2 mt-3">
                            <span className="text-[10px] font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600 uppercase">Day {selectedDoseInfo.dose.day}</span>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">{selectedDoseInfo.dose.date}</span>
                          </div>
                      </div>
                      {selectedDoseInfo.dose.status === 'Given' ? (
                          <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center font-nepali text-green-700"><CheckCircle2 size={24} className="mx-auto mb-2" /><p className="font-bold text-lg">खोप लगाइसकेको छ</p><p className="text-xs mt-1">मिति: {selectedDoseInfo.dose.givenDate}</p></div>
                      ) : (
                          <div className="space-y-4">
                              {/* If D0 (Day 0), allow any date. Otherwise, restrict to scheduled date or later. */}
                              <NepaliDatePicker 
                                label="खोप लगाएको मिति (BS) *" 
                                value={modalDateBs} 
                                onChange={setModalDateBs} 
                                minDate={selectedDoseInfo.dose.day === 0 ? undefined : scheduledDateBs} 
                              />
                              {selectedDoseInfo.dose.day !== 0 && (
                                <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 border border-blue-100">
                                    <Info size={14} className="text-blue-600 mt-0.5" />
                                    <p className="text-[10px] text-blue-700 font-medium">खोप लगाएको मिति निर्धारित मिति ({scheduledDateBs}) भन्दा अगाडि हुन सक्दैन।</p>
                                </div>
                              )}
                          </div>
                      )}
                  </div>
                  <div className="p-4 bg-slate-50 border-t flex gap-3">
                      <button onClick={() => setSelectedDoseInfo(null)} className="flex-1 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-sm">रद्द</button>
                      {selectedDoseInfo.dose.status !== 'Given' && <button onClick={confirmDoseUpdate} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 text-sm">सुरक्षित गर्नुहोस्</button>}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
