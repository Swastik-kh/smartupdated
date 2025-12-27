
import React from 'react';
import { Award, ShieldCheck, CheckCircle2, User, MapPin, Calendar, Activity, FileText } from 'lucide-react';
import { RabiesPatient, OrganizationSettings } from '../types';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

interface VaccineCertificateProps {
    patient: RabiesPatient;
    generalSettings: OrganizationSettings;
}

export const VaccineCertificate: React.FC<VaccineCertificateProps> = ({ patient, generalSettings }) => {
    const formatDateBs = (adDate: string) => {
        if (!adDate) return '-';
        try {
            const parts = adDate.split('-');
            const jsDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return new NepaliDate(jsDate).format('YYYY/MM/DD');
        } catch (e) { return adDate; }
    };

    return (
        <div className="bg-white p-10 w-[210mm] min-h-[297mm] shadow-2xl border-[1px] border-slate-200 relative overflow-hidden font-nepali text-slate-900 print:shadow-none print:border-none print:m-0 print:p-0">
            {/* Watermark for Print */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emblem_of_Nepal.svg/1200px-Emblem_of_Nepal.svg.png" 
                    alt="Watermark" 
                    className="w-[400px] h-[400px] object-contain"
                />
            </div>

            {/* Official Header (Matching Mag Faram Style) */}
            <div className="mb-8 relative z-10">
                <div className="flex items-start justify-between">
                    <div className="w-24 pt-1">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emblem_of_Nepal.svg/1200px-Emblem_of_Nepal.svg.png" 
                            alt="Emblem" 
                            className="h-20 w-20 object-contain"
                        />
                    </div>
                    <div className="flex-1 text-center">
                        <h1 className="text-lg font-bold">{generalSettings.orgNameNepali}</h1>
                        <h2 className="text-base font-bold">{generalSettings.subTitleNepali}</h2>
                        {generalSettings.subTitleNepali2 && <h3 className="text-sm font-bold">{generalSettings.subTitleNepali2}</h3>}
                        {generalSettings.subTitleNepali3 && <h3 className="text-base font-bold">{generalSettings.subTitleNepali3}</h3>}
                        <div className="text-[11px] mt-2 space-x-2 font-medium text-slate-700">
                            <span>{generalSettings.address}</span>
                            {generalSettings.phone && <span> | फोन: {generalSettings.phone}</span>}
                            {generalSettings.panNo && <span> | पान नं: {generalSettings.panNo}</span>}
                        </div>
                    </div>
                    <div className="w-24"></div> {/* Balance spacer */}
                </div>
                <div className="w-full h-0.5 bg-red-600 mt-4"></div>
            </div>

            {/* Certificate Title Area */}
            <div className="text-center mb-10 relative z-10">
                <div className="inline-block border-b-2 border-slate-800 pb-1 mb-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-800">रेबिज खोप प्रमाणपत्र</h2>
                </div>
                <p className="text-indigo-700 font-bold uppercase tracking-widest text-[10px]">Anti-Rabies Vaccination Certificate</p>
                
                <div className="mt-4 flex justify-center gap-6 text-[10px] font-bold text-slate-500 uppercase">
                    <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-600"/> Full Course Completed</div>
                    <div className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-600"/> Immunized</div>
                </div>
            </div>

            {/* Patient Info Card (More professional grid) */}
            <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-200 mb-10 relative z-10">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="border-b border-slate-200 pb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">बिरामीको नाम (Patient Name)</p>
                        <p className="text-lg font-black text-slate-800">{patient.name}</p>
                    </div>
                    <div className="border-b border-slate-200 pb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">दर्ता नम्बर (Registration No.)</p>
                        <p className="text-lg font-mono font-black text-red-600">#{patient.regNo}</p>
                    </div>
                    <div className="border-b border-slate-200 pb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">उमेर र लिङ्ग (Age / Sex)</p>
                        <p className="text-base font-bold text-slate-700">{patient.age} वर्ष / {patient.sex === 'Male' ? 'पुरुष' : 'महिला'}</p>
                    </div>
                    <div className="border-b border-slate-200 pb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">ठेगाना (Address)</p>
                        <p className="text-base font-bold text-slate-700">{patient.address}</p>
                    </div>
                </div>
            </div>

            {/* Vaccination Schedule Table (Matching Mag Faram Table Style) */}
            <div className="mb-12 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="text-primary-600" size={18} />
                    <h4 className="font-black text-slate-800 text-sm">खोपको पूर्ण विवरण (Vaccination Record)</h4>
                </div>
                
                <table className="w-full border-collapse border border-slate-800 text-center text-xs">
                    <thead>
                        <tr className="bg-slate-100 font-bold">
                            <th className="border border-slate-800 p-3 w-1/4">डोज (Dose)</th>
                            <th className="border border-slate-800 p-3 w-1/4">निर्धारित मिति (Target Date)</th>
                            <th className="border border-slate-800 p-3 w-1/4">लगाएको मिति (Actual Date)</th>
                            <th className="border border-slate-800 p-3 w-1/4">कैफियत (Remarks)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patient.schedule.map((dose, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="border border-slate-800 p-4 font-black text-slate-700 bg-slate-50/30 text-sm">Day {dose.day}</td>
                                <td className="border border-slate-800 p-4 font-bold text-slate-500 font-mono">{formatDateBs(dose.date)}</td>
                                <td className="border border-slate-800 p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="font-black text-green-600 text-lg font-mono">{formatDateBs(dose.givenDate || '')}</span>
                                        {dose.status === 'Given' && <CheckCircle2 size={18} className="text-green-500" />}
                                    </div>
                                </td>
                                <td className="border border-slate-800 p-4 text-[10px] text-slate-400 italic">
                                    {dose.status === 'Given' ? 'सफलतापूर्वक लगाइएको' : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <p className="text-emerald-800 font-bold text-xs">
                        प्रमाणित गरिन्छ कि माथि उल्लेखित बिरामीले रेबिज विरुद्धको खोपको पूर्ण कोर्स सफलतापूर्वक सम्पन्न गर्नुभएको छ।
                    </p>
                </div>
            </div>

            {/* Footer Signatures (Matching Form Style) */}
            <div className="grid grid-cols-2 gap-24 mt-24 relative z-10">
                <div className="text-center">
                    <div className="w-full border-t border-slate-800 pt-2">
                        <p className="font-bold text-sm text-slate-800">तयार गर्ने (Vaccinator)</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">दस्तखत र मिति</p>
                    </div>
                </div>
                <div className="text-center">
                    <div className="w-full border-t border-slate-800 pt-2">
                        <p className="font-bold text-sm text-slate-800">स्वीकृत गर्ने (Medical Officer)</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">कार्यालय प्रमुखको दस्तखत/छाप</p>
                    </div>
                </div>
            </div>

            {/* Bottom Stamp Area */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center opacity-30">
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[8px] font-black uppercase text-slate-400">Official Stamp</span>
                </div>
                <p className="text-[8px] font-medium text-slate-400">यो प्रमाणपत्र कम्प्युटर प्रणालीबाट स्वतः उत्पन्न गरिएको हो।</p>
            </div>
        </div>
    );
};
