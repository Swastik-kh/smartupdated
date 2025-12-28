
import React, { useState, useMemo } from 'react';
import { Printer, Calendar, Filter, PieChart } from 'lucide-react';
import { Select } from './Select';
import { FISCAL_YEARS } from '../constants';
import { InventoryItem, User, MagFormEntry, OrganizationSettings, Store, IssueReportEntry, DakhilaPratibedanEntry, ReturnEntry, StockEntryRequest, DakhilaItem, ReturnItem, MagItem } from '../types';

interface InventoryMonthlyReportProps {
  currentFiscalYear: string;
  currentUser: User;
  inventoryItems: InventoryItem[];
  stores: Store[];
  magForms: MagFormEntry[];
  onSaveMagForm: (form: MagFormEntry) => void;
  generalSettings: OrganizationSettings;
  issueReports: IssueReportEntry[];
  dakhilaReports: DakhilaPratibedanEntry[];
  returnEntries: ReturnEntry[];
  stockEntryRequests: StockEntryRequest[];
}

const nepaliMonths = [
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

export const InventoryMonthlyReport: React.FC<InventoryMonthlyReportProps> = ({ 
  currentFiscalYear, 
  inventoryItems, 
  generalSettings, 
  currentUser,
  issueReports = [],
  dakhilaReports = [],
  returnEntries = [],
  stockEntryRequests = []
}) => {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(currentFiscalYear);
  const [selectedMonth, setSelectedMonth] = useState('08'); // Default to Mangsir

  const reportData = useMemo(() => {
    // १. युनिक सामानहरूको नाम निकाल्ने (खर्च हुने मात्र)
    // Adding explicit string[] type to ensure loop variables are not inferred as unknown
    const uniqueItemNames: string[] = Array.from(new Set(
        inventoryItems
            .filter(i => i.itemType === 'Expendable')
            .map(i => i.itemName.trim())
    ));

    return uniqueItemNames.map((name: string) => {
        const itemTemplate = inventoryItems.find(i => i.itemName.trim() === name && i.itemType === 'Expendable');
        if (!itemTemplate) return null;

        // छानिएको महिनाको अन्तिम मिति सम्मको गणना गर्ने (BS Format: YYYY-MM-DD)
        const cutoffDate = `${selectedFiscalYear.split('/')[0]}-${selectedMonth}-32`; // Max possible date for comparison

        let calculatedStock = 0;
        const safeName = name.toLowerCase();

        // १. आम्दानी (Income): Approved Dakhila & Approved Stock Entry Requests
        // Adding explicit type annotations and checking for undefined to fix unknown type errors
        dakhilaReports.forEach((r: DakhilaPratibedanEntry) => {
            if (r.fiscalYear === selectedFiscalYear && r.date <= cutoffDate) {
                r.items.forEach((i: DakhilaItem) => {
                    if (i.name && i.name.trim().toLowerCase() === safeName) calculatedStock += (Number(i.quantity) || 0);
                });
            }
        });

        stockEntryRequests.forEach((req: StockEntryRequest) => {
            if (req.status === 'Approved' && req.fiscalYear === selectedFiscalYear && req.requestDateBs <= cutoffDate) {
                req.items.forEach((i: InventoryItem) => {
                    if (i.itemName && i.itemName.trim().toLowerCase() === safeName) calculatedStock += (Number(i.currentQuantity) || 0);
                });
            }
        });

        // २. फिर्ता (Return act as Income)
        returnEntries.forEach((e: ReturnEntry) => {
            if (e.status === 'Approved' && e.fiscalYear === selectedFiscalYear && e.date <= cutoffDate) {
                e.items.forEach((i: ReturnItem) => {
                    if (i.name && i.name.trim().toLowerCase() === safeName) calculatedStock += (Number(i.quantity) || 0);
                });
            }
        });

        // ३. खर्च (Expense): Issued Reports
        issueReports.forEach((r: IssueReportEntry) => {
            if (r.status === 'Issued' && r.fiscalYear === selectedFiscalYear && (r.issueDate || r.requestDate) <= cutoffDate) {
                r.items.forEach((i: MagItem) => {
                    if (i.name && i.name.trim().toLowerCase() === safeName) calculatedStock -= (Number(i.quantity) || 0);
                });
            }
        });

        return {
            id: itemTemplate.id,
            itemName: name,
            ledgerPageNo: itemTemplate.ledgerPageNo,
            unit: itemTemplate.unit,
            currentQuantity: calculatedStock,
            approvedStockLevel: itemTemplate.approvedStockLevel || 0,
            quantityToOrder: Math.max(0, (itemTemplate.approvedStockLevel || 0) - calculatedStock)
        };
    }).filter(Boolean);
  }, [inventoryItems, selectedFiscalYear, selectedMonth, issueReports, dakhilaReports, returnEntries, stockEntryRequests]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
                <Select label="आर्थिक वर्ष" options={FISCAL_YEARS} value={selectedFiscalYear} onChange={(e) => setSelectedFiscalYear(e.target.value)} icon={<Calendar size={18} />} />
            </div>
            <div className="w-48">
                <Select label="महिना (Month)" options={nepaliMonths} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} icon={<Filter size={18} />} />
            </div>
        </div>
        <button onClick={() => window.print()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Printer size={18} /> प्रिन्ट रिपोर्ट
        </button>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-xl shadow-xl max-w-[297mm] mx-auto min-h-[210mm] font-nepali text-sm print:shadow-none print:p-0 print:max-w-none border border-slate-200">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-red-600">{generalSettings.orgNameNepali}</h1>
            <h2 className="text-xl font-bold underline underline-offset-4 mt-2">जिन्सी मौज्दात तथा निकासा मासिक प्रतिवेदन</h2>
            <div className="flex justify-between mt-6 px-4 font-bold text-slate-600 border-b border-slate-100 pb-2">
                <span>महिना: {nepaliMonths.find(m => m.value === selectedMonth)?.label}</span>
                <span>आर्थिक वर्ष: {selectedFiscalYear}</span>
            </div>
        </div>

        <table className="w-full border-collapse border border-slate-900 text-xs">
            <thead>
                <tr className="bg-slate-50 font-bold">
                    <th className="border border-slate-900 p-2 w-12">क्र.सं.</th>
                    <th className="border border-slate-900 p-2 text-left">सामानको नाम (Expendable Items)</th>
                    <th className="border border-slate-900 p-2 w-28">जि.खा.पा.नं.</th>
                    <th className="border border-slate-900 p-2 w-20">एकाई</th>
                    <th className="border border-slate-900 p-2 w-28">महिना अन्तको मौज्दात</th>
                    <th className="border border-slate-900 p-2 w-28">स्वीकृत मौज्दात (ASL)</th>
                    <th className="border border-slate-900 p-2 w-32">माग गर्नुपर्ने परिमाण</th>
                </tr>
            </thead>
            <tbody>
                {reportData.length === 0 ? (
                    <tr><td colSpan={7} className="border border-slate-900 p-12 text-center text-slate-400 italic">यो महिनाको कुनै विवरण भेटिएन।</td></tr>
                ) : (
                    reportData.map((d: any, i) => (
                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td className="border border-slate-900 p-2 text-center">{i + 1}</td>
                            <td className="border border-slate-900 p-2 px-3 font-bold">{d.itemName}</td>
                            <td className="border border-slate-900 p-2 text-center font-mono">{d.ledgerPageNo || '-'}</td>
                            <td className="border border-slate-900 p-2 text-center">{d.unit}</td>
                            <td className="border border-slate-900 p-2 text-center font-black text-slate-800">{d.currentQuantity}</td>
                            <td className="border border-slate-900 p-2 text-center text-slate-500">{d.approvedStockLevel || '-'}</td>
                            <td className="border border-slate-900 p-2 text-center font-black text-blue-700 bg-blue-50/30">
                                {d.quantityToOrder > 0 ? d.quantityToOrder : '-'}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>

        <div className="grid grid-cols-3 gap-12 mt-20 text-center text-sm font-bold">
            <div>
                <div className="border-t border-slate-800 pt-2">तयार गर्ने (जिन्सी शाखा)</div>
                <div className="text-xs font-normal mt-1">{currentUser.fullName}</div>
            </div>
            <div>
                <div className="border-t border-slate-800 pt-2">शाखा प्रमुख</div>
            </div>
            <div>
                <div className="border-t border-slate-800 pt-2">स्वीकृत गर्ने (कार्यालय प्रमुख)</div>
            </div>
        </div>

        <div className="mt-20 text-[10px] text-slate-400 italic border-t border-slate-100 pt-4 flex justify-between px-2">
            <span>प्रणालीबाट उत्पन्न मिति: {new Date().toLocaleDateString()}</span>
            <span>Smart Inventory System</span>
        </div>
      </div>
    </div>
  );
};
