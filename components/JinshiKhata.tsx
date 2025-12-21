
import React, { useState, useMemo } from 'react';
import { Calendar, Printer, Search, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import { Select } from './Select';
import { SearchableSelect } from './SearchableSelect';
import { InventoryItem, IssueReportEntry, DakhilaPratibedanEntry, ReturnEntry, OrganizationSettings, StockEntryRequest } from '../types';
import { FISCAL_YEARS } from '../constants';

interface JinshiKhataProps {
  currentFiscalYear: string;
  inventoryItems: InventoryItem[];
  issueReports: IssueReportEntry[];
  dakhilaReports: DakhilaPratibedanEntry[];
  returnEntries: ReturnEntry[];
  stockEntryRequests: StockEntryRequest[];
  generalSettings: OrganizationSettings;
}

interface LedgerRow {
  id: string;
  date: string;
  refNo: string;
  type: 'Opening' | 'Income' | 'Expense' | 'Return';
  qty: number;
  rate: number;
  total: number;
  balQty: number;
  balTotal: number;
  remarks: string;
  specification?: string;
  model?: string;
  serialNo?: string;
  source?: string;
}

export const JinshiKhata: React.FC<JinshiKhataProps> = ({
  currentFiscalYear,
  inventoryItems,
  issueReports,
  dakhilaReports,
  returnEntries,
  stockEntryRequests = [],
  generalSettings
}) => {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(currentFiscalYear);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [ledgerType, setLedgerType] = useState<'Expendable' | 'Non-Expendable'>('Expendable');

  const itemOptions = useMemo(() => {
    return inventoryItems
        .filter(item => item.itemType === ledgerType)
        .map(item => ({
            id: item.id,
            value: item.itemName, 
            label: `${item.itemName} (${item.unit})`
        })).sort((a, b) => a.label.localeCompare(b.label));
  }, [inventoryItems, ledgerType]);

  const selectedItemDetail = useMemo(() => {
    if (!selectedItemName) return null;
    return inventoryItems.find(i => i.itemName === selectedItemName && i.itemType === ledgerType);
  }, [inventoryItems, selectedItemName, ledgerType]);

  const tableData = useMemo(() => {
    if (!selectedItemName) return [];

    let transactions: any[] = [];
    const safeName = selectedItemName.trim().toLowerCase();
    const seenDakhilaRefs = new Set<string>();

    // १. दाखिला/ओपनिङ्ग (आम्दानी)
    dakhilaReports.forEach(report => {
        if (report.fiscalYear !== selectedFiscalYear) return;
        report.items.forEach(item => {
            if (item.name.trim().toLowerCase() === safeName) {
                const refKey = `INC-${report.dakhilaNo}`;
                if (!seenDakhilaRefs.has(refKey)) {
                    transactions.push({
                        id: `DAKHILA-${report.id}-${item.id}`,
                        date: report.date,
                        refNo: report.dakhilaNo, 
                        type: item.source === 'Opening' ? 'Opening' : 'Income',
                        qty: item.quantity,
                        rate: item.rate,
                        remarks: item.remarks || report.orderNo || '',
                        specification: item.specification,
                        source: item.source || 'Purchase'
                    });
                    seenDakhilaRefs.add(refKey);
                }
            }
        });
    });

    // २. स्टक अनुरोधबाट आम्दानी
    stockEntryRequests.forEach(req => {
        if (req.status === 'Approved' && req.fiscalYear === selectedFiscalYear) {
            req.items.forEach(item => {
                if (item.itemName.trim().toLowerCase() === safeName) {
                    const dNo = item.dakhilaNo || `REQ-${req.id.slice(-4)}`;
                    const refKey = `INC-${dNo}`;
                    if (!seenDakhilaRefs.has(refKey)) {
                        transactions.push({
                            id: `STKREQ-${req.id}-${item.id}`,
                            date: req.requestDateBs,
                            refNo: dNo,
                            type: req.mode === 'opening' ? 'Opening' : 'Income',
                            qty: item.currentQuantity,
                            rate: item.rate || 0,
                            remarks: item.remarks || req.receiptSource || '',
                            specification: item.specification,
                            source: req.receiptSource || 'Initial'
                        });
                        seenDakhilaRefs.add(refKey);
                    }
                }
            });
        }
    });

    // ३. फिर्ता फारम (Returns - acts as Income)
    returnEntries.forEach(entry => {
        if (entry.fiscalYear !== selectedFiscalYear) return;
        if (entry.status === 'Approved') {
            entry.items.forEach(item => {
                if (item.name.trim().toLowerCase() === safeName) {
                    transactions.push({
                        id: `RETURN-${entry.id}-${item.id}`,
                        date: entry.date,
                        refNo: entry.formNo,
                        type: 'Return', 
                        qty: item.quantity,
                        rate: item.rate,
                        remarks: `फिर्ता (By: ${entry.returnedBy.name})`,
                        specification: item.specification,
                        source: 'फिर्ता'
                    });
                }
            });
        }
    });

    // ४. निकासा (Expense/Kharcha)
    issueReports.forEach(report => {
        if (report.fiscalYear !== selectedFiscalYear) return;
        if (report.status === 'Issued') {
            report.items.forEach(item => {
                if (item.name.trim().toLowerCase() === safeName) {
                    transactions.push({
                        id: `ISSUE-${report.id}-${item.id}`,
                        date: report.issueDate || report.requestDate,
                        refNo: report.issueNo || report.magFormNo, 
                        type: 'Expense',
                        qty: parseFloat(item.quantity) || 0,
                        rate: item.rate || 0,
                        remarks: report.demandBy?.name || '',
                        specification: item.specification
                    });
                }
            });
        }
    });

    // मिति र प्रकार अनुसार क्रमवद्ध गर्ने (तपाईंले खोज्नुभएको ५ -> ४ -> ५ को नतिजाको लागि)
    transactions.sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date);
        if (dateComp !== 0) return dateComp;
        // Same day logic: Opening(0) -> Income(1) -> Expense(2) -> Return(3)
        // यसो गर्दा खर्च भएर घटेको मौज्दातमा फिर्ता भएको सामान जोडिएर अन्तिम बाँकी सही देखिन्छ।
        const orderMap: Record<string, number> = { 'Opening': 0, 'Income': 1, 'Expense': 2, 'Return': 3 };
        return orderMap[a.type] - orderMap[b.type];
    });

    // ५. बाँकी परिमाण गणना (Running Balance)
    let runningQty = 0;
    let runningVal = 0; 
    
    return transactions.map(txn => {
        const txnTotal = txn.qty * txn.rate;
        if (txn.type === 'Income' || txn.type === 'Opening' || txn.type === 'Return') {
            // आम्दानी र फिर्ता दुवैले मौज्दात बढाउँछन्
            runningQty += txn.qty;
            runningVal += txnTotal;
        } else {
            // खर्चले मौज्दात घटाउँछ
            runningQty -= txn.qty;
            runningVal -= txnTotal;
        }

        return {
            ...txn,
            total: txnTotal,
            balQty: runningQty,
            balTotal: runningVal,
            model: selectedItemDetail?.uniqueCode || '', 
            serialNo: selectedItemDetail?.sanketNo || ''
        };
    });
  }, [selectedItemName, selectedFiscalYear, dakhilaReports, stockEntryRequests, returnEntries, issueReports, selectedItemDetail, ledgerType]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="flex flex-col gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-nepali text-lg">
                    <BookOpen size={24} className="text-primary-600"/>
                    जिन्सी खाता (Inventory Ledger)
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => {setLedgerType('Expendable'); setSelectedItemName('');}} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${ledgerType === 'Expendable' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>खर्च हुने (407)</button>
                    <button onClick={() => {setLedgerType('Non-Expendable'); setSelectedItemName('');}} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${ledgerType === 'Non-Expendable' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>खर्च नहुने (408)</button>
                </div>
            </div>
            <div className="flex flex-wrap gap-4">
                <div className="w-48"><Select label="आर्थिक वर्ष" options={FISCAL_YEARS} value={selectedFiscalYear} onChange={(e) => setSelectedFiscalYear(e.target.value)} icon={<Calendar size={18} />} /></div>
                <div className="w-80"><SearchableSelect label="सामानको नाम" options={itemOptions} value={selectedItemName} onChange={setSelectedItemName} placeholder="Search item..." icon={<Search size={18} />} /></div>
            </div>
        </div>
        <button onClick={() => window.print()} disabled={!selectedItemName} className="px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium shadow-sm hover:bg-slate-900 transition-colors disabled:opacity-50"><Printer size={18} className="inline mr-2" /> प्रिन्ट</button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg w-full overflow-x-auto print:shadow-none print:p-0">
        <div className="text-right text-[10px] font-bold mb-2">म.ले.प.फारम नं: {ledgerType === 'Expendable' ? '४०७' : '४०८'}</div>
        <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-red-600">{generalSettings.orgNameNepali}</h1>
            <h2 className="text-lg font-bold underline underline-offset-4">
                जिन्सी मालसामान खाता ({ledgerType === 'Expendable' ? 'खर्च भएर जाने' : 'खर्च भएर नजाने'})
            </h2>
            <div className="flex justify-between mt-6 text-sm font-bold border-b border-slate-200 pb-2">
                <div className="text-left">
                    <p>सामान: <span className="text-primary-700 font-black">{selectedItemName || '................'}</span></p>
                    <p className="mt-1 font-normal text-slate-500">एकाई: {selectedItemDetail?.unit || '....'}</p>
                </div>
                <div className="text-right">
                    <p>आर्थिक वर्ष: {selectedFiscalYear}</p>
                    <p className="mt-1 font-normal text-slate-500">सङ्केत नं: {selectedItemDetail?.sanketNo || '-'}</p>
                </div>
            </div>
        </div>

        {ledgerType === 'Expendable' ? (
          /* --- EXPENDABLE TABLE (407) --- */
          <table className="w-full border-collapse border border-slate-900 text-center text-[11px]">
            <thead>
                <tr className="bg-slate-50">
                    <th className="border border-slate-900 p-1" rowSpan={2}>मिति</th>
                    <th className="border border-slate-900 p-1" rowSpan={2}>दाखिला/निकासा नं.</th>
                    <th className="border border-slate-900 p-1" colSpan={3}>आम्दानी (Income)</th>
                    <th className="border border-slate-900 p-1" colSpan={3}>खर्च (Expense)</th>
                    <th className="border border-slate-900 p-1" colSpan={2}>बाँकी (Balance)</th>
                    <th className="border border-slate-900 p-1" rowSpan={2}>कैफियत</th>
                </tr>
                <tr className="bg-slate-50">
                    <th className="border border-slate-900 p-1">परिमाण</th>
                    <th className="border border-slate-900 p-1">दर</th>
                    <th className="border border-slate-900 p-1">जम्मा</th>
                    <th className="border border-slate-900 p-1">परिमाण</th>
                    <th className="border border-slate-900 p-1">दर</th>
                    <th className="border border-slate-900 p-1">जम्मा</th>
                    <th className="border border-slate-900 p-1">परिमाण</th>
                    <th className="border border-slate-900 p-1">जम्मा मूल्य</th>
                </tr>
            </thead>
            <tbody>
                {tableData.length === 0 ? (
                    <tr><td colSpan={11} className="p-12 text-slate-400 italic text-sm">कुनै कारोबार विवरण भेटिएन।</td></tr>
                ) : (
                    tableData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                            <td className="border border-slate-900 p-1 font-nepali whitespace-nowrap">{row.date}</td>
                            <td className="border border-slate-900 p-1 font-mono">{row.refNo}</td>
                            <td className="border border-slate-900 p-1 font-bold text-green-700">{(row.type === 'Income' || row.type === 'Opening' || row.type === 'Return') ? row.qty : ''}</td>
                            <td className="border border-slate-900 p-1">{(row.type === 'Income' || row.type === 'Opening' || row.type === 'Return') ? row.rate : ''}</td>
                            <td className="border border-slate-900 p-1">{(row.type === 'Income' || row.type === 'Opening' || row.type === 'Return') ? row.total.toFixed(2) : ''}</td>
                            <td className="border border-slate-900 p-1 font-bold text-red-600">{row.type === 'Expense' ? row.qty : ''}</td>
                            <td className="border border-slate-900 p-1">{row.type === 'Expense' ? row.rate : ''}</td>
                            <td className="border border-slate-900 p-1">{row.type === 'Expense' ? row.total.toFixed(2) : ''}</td>
                            <td className="border border-slate-900 p-1 font-black bg-slate-50 text-base">{row.balQty}</td>
                            <td className="border border-slate-900 p-1 font-bold bg-slate-50">{row.balTotal.toFixed(2)}</td>
                            <td className="border border-slate-900 p-1 text-left px-1 italic text-[10px]">{row.remarks}</td>
                        </tr>
                    ))
                )}
            </tbody>
          </table>
        ) : (
          /* --- NON-EXPENDABLE TABLE (408) --- */
          <table className="w-full border-collapse border border-slate-900 text-center text-[11px]">
            <thead>
                <tr className="bg-slate-50">
                    <th className="border border-slate-900 p-1" rowSpan={2}>मिति</th>
                    <th className="border border-slate-900 p-1" rowSpan={2}>दाखिला/हस्तान्तरण नं.</th>
                    <th className="border border-slate-900 p-1" colSpan={6}>सामानको विवरण</th>
                    <th className="border border-slate-900 p-1" colSpan={3}>आम्दानी (Income)</th>
                    <th className="border border-slate-900 p-1" colSpan={3}>खर्च (Expense)</th>
                    <th className="border border-slate-900 p-1" colSpan={2}>बाँकी (Balance)</th>
                    <th className="border border-slate-900 p-1" rowSpan={2}>कैफियत</th>
                </tr>
                <tr className="bg-slate-50">
                    <th className="border border-slate-900 p-1">स्पेसिफिकेसन</th>
                    <th className="border border-slate-900 p-1">मोडल</th>
                    <th className="border border-slate-900 p-1">सङ्केत नं</th>
                    <th className="border border-slate-900 p-1">देश</th>
                    <th className="border border-slate-900 p-1">आयु</th>
                    <th className="border border-slate-900 p-1">स्रोत</th>
                    
                    <th className="border border-slate-900 p-1">परिमाण</th>
                    <th className="border border-slate-900 p-1">दर</th>
                    <th className="border border-slate-900 p-1">जम्मा</th>
                    
                    <th className="border border-slate-900 p-1">परिमाण</th>
                    <th className="border border-slate-900 p-1">दर</th>
                    <th className="border border-slate-900 p-1">जम्मा</th>
                    
                    <th className="border border-slate-900 p-1">परिमाण</th>
                    <th className="border border-slate-900 p-1">जम्मा मूल्य</th>
                </tr>
            </thead>
            <tbody>
                {tableData.length === 0 ? (
                    <tr><td colSpan={17} className="p-12 text-slate-400 italic text-sm">कुनै सम्पत्ति विवरण भेटिएन।</td></tr>
                ) : (
                    tableData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                            <td className="border border-slate-900 p-1 font-nepali whitespace-nowrap">{row.date}</td>
                            <td className="border border-slate-900 p-1 font-mono font-bold text-slate-700">{row.refNo}</td>
                            <td className="border border-slate-900 p-1 text-left px-1">{row.specification || '-'}</td>
                            <td className="border border-slate-900 p-1">{row.model || '-'}</td>
                            <td className="border border-slate-900 p-1 font-mono">{row.serialNo || '-'}</td>
                            <td className="border border-slate-900 p-1">-</td>
                            <td className="border border-slate-900 p-1">-</td>
                            <td className="border border-slate-900 p-1 font-medium">{row.source || '-'}</td>

                            {/* आम्दानी महलमा फिर्ता (Return) लाई पनि देखाइनेछ */}
                            <td className="border border-slate-900 p-1 font-bold text-green-700">{(row.type === 'Income' || row.type === 'Opening' || row.type === 'Return') ? row.qty : ''}</td>
                            <td className="border border-slate-900 p-1">{(row.type === 'Income' || row.type === 'Opening' || row.type === 'Return') ? row.rate : ''}</td>
                            <td className="border border-slate-900 p-1">{(row.type === 'Income' || row.type === 'Opening' || row.type === 'Return') ? row.total.toFixed(2) : ''}</td>

                            <td className="border border-slate-900 p-1 font-bold text-red-600">{row.type === 'Expense' ? row.qty : ''}</td>
                            <td className="border border-slate-900 p-1">{row.type === 'Expense' ? row.rate : ''}</td>
                            <td className="border border-slate-900 p-1">{row.type === 'Expense' ? row.total.toFixed(2) : ''}</td>

                            {/* बाँकी परिमाण (Running Balance) मा ५ -> ४ -> ५ को लजिक लागू हुन्छ */}
                            <td className="border border-slate-900 p-1 font-black bg-slate-50 text-base">{row.balQty}</td>
                            <td className="border border-slate-900 p-1 font-bold bg-slate-50">{row.balTotal.toFixed(2)}</td>
                            <td className="border border-slate-900 p-1 text-left px-1 italic text-[10px]">{row.remarks}</td>
                        </tr>
                    ))
                )}
            </tbody>
          </table>
        )}

        <div className="flex justify-between mt-16 text-sm font-medium">
            <div className="text-center w-48">
                <div className="border-t border-slate-400 pt-1 font-nepali">फाँटवालाको दस्तखत</div>
            </div>
            <div className="text-center w-48">
                <div className="border-t border-slate-400 pt-1 font-nepali">कार्यालय प्रमुखको दस्तखत</div>
            </div>
        </div>
      </div>
    </div>
  );
};
