
import React, { useState, useMemo } from 'react';
import { Printer, Calendar, Save, Calculator, Filter, Package } from 'lucide-react';
import { Select } from './Select';
import { Input } from './Input';
import { FISCAL_YEARS } from '../constants';
import { RabiesPatient } from '../types';

interface RabiesReportProps {
  currentFiscalYear: string;
  currentUser: { organizationName: string; fullName: string; };
  patients: RabiesPatient[];
}

export const RabiesReport: React.FC<RabiesReportProps> = ({ currentFiscalYear, currentUser, patients }) => {
  const [selectedMonth, setSelectedMonth] = useState('08');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(currentFiscalYear);

  const nepaliMonthOptions = [
    { id: '01', value: '01', label: 'बैशाख (Baishakh)' },
    { id: '02', value: '02', label: 'जेठ (Jestha)' },
    { id: '03', value: '03', label: 'असार (Ashad)' },
    { id: '04', value: '04', label: 'साउन (Shrawan)' },
    { id: '05', value: '05', label: 'भदौ (Bhadra)' },
    { id: '06', value: '06', label: 'असोज (Ashwin)' },
    { id: '07', value: '07', label: 'कार्तिक (Kartik)' },
    { id: '08', value: '08', label: 'मंसिर (Mangsir)' },
    { id: '09', value: '09', label: 'पुष (Poush)' },
    { id: '10', value: '10', label: 'माघ (Magh)' },
    { id: '11', value: '11', label: 'फागुन (Falgun)' },
    { id: '12', value: '12', label: 'चैत्र (Chaitra)' },
  ];

  const animals = [
    'Dog bite', 'Monkey bite', 'Cat bite', 'Cattle bite', 'Rodent bite', 
    'Jackal bite', 'Tiger bite', 'Bear bite', 'Saliva contact', 'Other specify'
  ];

  const rowLabels = [
    'Male (15+Yr)',
    'Female (15+Yr)',
    'Male Child (<15 Yr)',
    'Female Child (<15 Yr)'
  ];

  const generatedMatrix = useMemo(() => {
    const mat = Array(4).fill(0).map(() => Array(10).fill(0));
    const filteredData = patients.filter(p => 
        p.fiscalYear === selectedFiscalYear && p.regMonth === selectedMonth
    );

    filteredData.forEach(p => {
        let rowIndex = -1;
        const ageNum = parseInt(p.age) || 0;
        if (p.sex === 'Male') rowIndex = ageNum < 15 ? 2 : 0;
        else if (p.sex === 'Female') rowIndex = ageNum < 15 ? 3 : 1;

        let colIndex = -1;
        switch(p.animalType) {
            case 'Dog bite': colIndex = 0; break;
            case 'Monkey bite': colIndex = 1; break;
            case 'Cat bite': colIndex = 2; break;
            case 'Cattle bite': colIndex = 3; break;
            case 'Rodent bite': colIndex = 4; break;
            case 'Jackal bite': colIndex = 5; break;
            case 'Tiger bite': colIndex = 6; break;
            case 'Bear bite': colIndex = 7; break;
            case 'Saliva contact': colIndex = 8; break;
            default: colIndex = 9;
        }

        if (rowIndex !== -1 && colIndex !== -1) mat[rowIndex][colIndex]++;
    });
    return mat;
  }, [patients, selectedFiscalYear, selectedMonth]);

  const [stockData, setStockData] = useState({ opening: 0, received: 0, expenditure: 0 });
  const getRowTotal = (rowIndex: number) => generatedMatrix[rowIndex].reduce((a, b) => a + b, 0);
  const getColTotal = (colIndex: number) => generatedMatrix.reduce((sum, row) => sum + row[colIndex], 0);
  const grandTotalCases = generatedMatrix.flat().reduce((a, b) => a + b, 0);
  const balanceDose = stockData.opening + stockData.received - stockData.expenditure;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 print:space-y-0 print:animate-none">
      {/* Filters Area - Hidden in Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
         <div className="flex items-end gap-4 w-full md:w-auto">
             <div className="w-48">
                <Select label="आर्थिक वर्ष" options={FISCAL_YEARS} value={selectedFiscalYear} onChange={(e) => setSelectedFiscalYear(e.target.value)} icon={<Calendar size={18} />} />
            </div>
            <div className="w-48">
                <Select label="महिना" options={nepaliMonthOptions} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} icon={<Filter size={18} />} />
            </div>
         </div>
         <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium shadow-sm"><Printer size={18} /> Print Report</button>
      </div>

      {/* Main Printable Area */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg overflow-x-auto min-w-[1000px] print:min-w-full print:shadow-none print:border-none print:p-0 print:overflow-visible print:mt-0">
        <div className="text-center space-y-1 mb-6 font-bold text-slate-900 print:mb-4">
            <h4 className="text-sm uppercase">NG/MOH</h4>
            <h3 className="text-base uppercase">EPIDEMIOLOGY AND DISEASE CONTROL DIVISION</h3>
            <h2 className="text-lg uppercase">MONTHLY RECORDS OF POST EXPOSURE TREATMENT OF RABIES IN HUMANS</h2>
            <div className="flex justify-between items-center mt-6 pt-4 px-4 text-sm print:mt-4 print:text-[10px]">
                <span>Institution: <span className="font-medium underline">{currentUser.organizationName}</span></span>
                <span>Month: <span className="font-medium underline">{nepaliMonthOptions.find(m => m.value === selectedMonth)?.label}</span></span>
                <span>Year: <span className="font-medium underline">{selectedFiscalYear}</span></span>
            </div>
        </div>

        <table className="w-full text-xs border-collapse border border-slate-800 text-center print:text-[9px]">
            <thead>
                <tr className="bg-slate-100 font-bold print:bg-transparent">
                    <th className="border border-slate-800 p-1" rowSpan={2}>Description</th>
                    <th className="border border-slate-800 p-1" colSpan={10}>Source of Exposure</th>
                    <th className="border border-slate-800 p-1" rowSpan={2}>Total</th>
                    <th className="border border-slate-800 p-1" rowSpan={2}>Prev Balance</th>
                    <th className="border border-slate-800 p-1" rowSpan={2}>Received</th>
                    <th className="border border-slate-800 p-1" rowSpan={2}>Doses Used</th>
                    <th className="border border-slate-800 p-1" rowSpan={2}>Remaining</th>
                </tr>
                <tr className="bg-slate-100 font-bold print:bg-transparent">
                    {animals.map((a, i) => <th key={i} className="border border-slate-800 p-1">{a}</th>)}
                </tr>
            </thead>
            <tbody>
                {rowLabels.map((label, rIndex) => (
                    <tr key={rIndex}>
                        <td className="border border-slate-800 p-1 text-left font-bold">{label}</td>
                        {generatedMatrix[rIndex].map((val, cIndex) => <td key={cIndex} className="border border-slate-800">{val || '-'}</td>)}
                        <td className="border border-slate-800 font-bold bg-slate-50 print:bg-transparent">{getRowTotal(rIndex)}</td>
                        <td className="border border-slate-800"></td>
                        <td className="border border-slate-800"></td>
                        <td className="border border-slate-800"></td>
                        <td className="border border-slate-800"></td>
                    </tr>
                ))}
                <tr className="font-bold bg-slate-100 print:bg-transparent">
                    <td className="border border-slate-800 p-1 text-left">TOTAL</td>
                    {animals.map((_, i) => <td key={i} className="border border-slate-800">{getColTotal(i)}</td>)}
                    <td className="border border-slate-800">{grandTotalCases}</td>
                    <td className="border border-slate-800">{stockData.opening}</td>
                    <td className="border border-slate-800">{stockData.received}</td>
                    <td className="border border-slate-800">{stockData.expenditure}</td>
                    <td className="border border-slate-800">{balanceDose}</td>
                </tr>
            </tbody>
        </table>

        <div className="mt-12 grid grid-cols-2 gap-20 print:mt-10 print:gap-10">
            <div className="text-center">
                <div className="border-t border-slate-800 pt-2 font-bold">Prepared By</div>
                <div className="text-xs print:text-[10px]">{currentUser.fullName}</div>
            </div>
            <div className="text-center">
                <div className="border-t border-slate-800 pt-2 font-bold">Approved By</div>
                <div className="text-xs print:text-[10px]">Medical Officer / In-Charge</div>
            </div>
        </div>
      </div>
    </div>
  );
};
