
import React, { useState, useCallback, useMemo } from 'react';
import { FileOutput, ChevronRight, ArrowLeft, Printer, CheckCircle2, ShieldCheck, X, Clock, Eye, Send, FileText, AlertCircle } from 'lucide-react';
import { IssueReportEntry, MagItem, User, OrganizationSettings, StockEntryRequest } from '../types';
import { NepaliDatePicker } from './NepaliDatePicker';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';

interface NikashaPratibedanProps {
    reports: IssueReportEntry[];
    onSave: (report: IssueReportEntry) => void;
    currentUser: User;
    currentFiscalYear: string;
    generalSettings: OrganizationSettings;
}

export const NikashaPratibedan: React.FC<NikashaPratibedanProps> = ({ reports, onSave, currentUser, currentFiscalYear, generalSettings }) => {
    const [selectedReport, setSelectedReport] = useState<IssueReportEntry | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<StockEntryRequest | null>(null);
    const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // State for Rejection Modal
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReasonInput, setRejectionReasonInput] = useState('');
    const [reportToRejectId, setReportToRejectId] = useState<string | null>(null);

    // Form State for display/editing
    const [reportDetails, setReportDetails] = useState({
        fiscalYear: '',
        magFormNo: '',
        requestDate: '', 
        issueNo: '',     
        issueDate: '',   
        preparedBy: { name: '', designation: '', date: '' },
        recommendedBy: { name: '', designation: '', date: '' },
        approvedBy: { name: '', designation: '', date: '' },
        rejectionReason: '' 
    });
    const [irItems, setIrItems] = useState<MagItem[]>([]);

    // Role helpers
    const isStoreKeeper = currentUser.role === 'STOREKEEPER';
    const isApprover = ['ADMIN', 'SUPER_ADMIN', 'APPROVAL'].includes(currentUser.role);

    // Calculate Today in Nepali for Restrictions
    const todayBS = useMemo(() => {
        try {
            return new NepaliDate().format('YYYY-MM-DD');
        } catch (e) {
            return '';
        }
    }, []);

    const handleLoadReport = (report: IssueReportEntry, viewOnly: boolean = false) => {
        setSelectedReport(report);
        setSelectedRequest(null);
        setIsViewOnlyMode(viewOnly);
        setIsProcessing(false);
        setSuccessMessage(null);
        setValidationError(null);
        
        const targetFiscalYear = report.fiscalYear || currentFiscalYear;
        const reportsInCurrentFY = reports.filter(r => r.fiscalYear === targetFiscalYear);
        
        // Issue Number Generation: 001-NI format
        const maxIssueNo = reportsInCurrentFY.reduce((max, r) => {
            if (!r.issueNo) return max;
            const parts = r.issueNo.split('-');
            const num = parseInt(parts[0]);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);

        const nextIssueNo = report.issueNo ? report.issueNo : `${String(maxIssueNo + 1).padStart(3, '0')}-NI`;
        const defaultIssueDate = report.issueDate || todayBS;
        
        setIrItems(report.items);

        setReportDetails({
            fiscalYear: targetFiscalYear,
            magFormNo: report.magFormNo,
            requestDate: report.requestDate,
            issueNo: nextIssueNo,
            issueDate: defaultIssueDate,

            preparedBy: report.preparedBy?.name ? {
                name: report.preparedBy.name,
                designation: report.preparedBy.designation || '',
                date: report.preparedBy.date || ''
            } : (
                (report.status === 'Pending' && isStoreKeeper && !viewOnly) 
                ? { name: currentUser.fullName, designation: currentUser.designation, date: todayBS }
                : { name: '', designation: '', date: '' }
            ),
            
            recommendedBy: report.recommendedBy ? {
                name: report.recommendedBy.name,
                designation: report.recommendedBy.designation || '',
                date: report.recommendedBy.date || ''
            } : { name: '', designation: '', date: '' },
            
            approvedBy: report.approvedBy?.name ? {
                name: report.approvedBy.name,
                designation: report.approvedBy.designation || '',
                date: report.approvedBy.date || ''
            } : (
                (report.status === 'Pending Approval' && isApprover && !viewOnly) 
                ? { name: currentUser.fullName, designation: currentUser.designation, date: todayBS }
                : { name: '', designation: '', date: '' }
            ),
            rejectionReason: report.rejectionReason || ''
        });
    };

    const handleBack = () => {
        setSelectedReport(null);
        setSelectedRequest(null);
        setIsViewOnlyMode(false);
        setIsProcessing(false);
        setSuccessMessage(null);
        setValidationError(null);
    };

    const handleIssueDateChange = (val: string) => {
        setReportDetails(prev => ({
            ...prev,
            issueDate: val,
            // If storekeeper is preparing, set their signature date
            preparedBy: (selectedReport?.status === 'Pending' && isStoreKeeper) 
                ? { ...prev.preparedBy, date: val } 
                : prev.preparedBy,
            // If admin is approving, set their signature date
            approvedBy: (selectedReport?.status === 'Pending Approval' && isApprover)
                ? { ...prev.approvedBy, date: val }
                : prev.approvedBy
        }));
    };

    const handleSaveReport = () => {
        if (!selectedReport || isViewOnlyMode) return;
        setValidationError(null);

        if (!reportDetails.issueDate) {
            setValidationError('निकासा मिति अनिवार्य छ (Issue Date is required)।');
            return;
        }

        setIsProcessing(true);

        let nextStatus = selectedReport.status;
        let successMsg = "विवरण सुरक्षित भयो!";

        if (isStoreKeeper && selectedReport.status === 'Pending') {
            nextStatus = 'Pending Approval';
            successMsg = "निकासा प्रतिवेदन तयार भयो र स्वीकृतिको लागि पठाइयो (Forwarded for Approval)";
        } else if (isApprover && selectedReport.status === 'Pending Approval') {
            nextStatus = 'Issued';
            successMsg = "निकासा प्रतिवेदन स्वीकृत र जारी गरियो (Approved & Issued)";
        }

        const updatedReport: IssueReportEntry = {
            ...selectedReport,
            status: nextStatus,
            issueNo: reportDetails.issueNo,
            issueDate: reportDetails.issueDate,
            preparedBy: reportDetails.preparedBy,
            recommendedBy: reportDetails.recommendedBy,
            approvedBy: reportDetails.approvedBy,
            rejectionReason: "" 
        };

        onSave(updatedReport);
        setSuccessMessage(successMsg);
        
        setTimeout(() => {
            handleBack();
        }, 1500);
    };

    const handleRejectModalOpen = (reportId: string) => {
        setReportToRejectId(reportId);
        setRejectionReasonInput('');
        setValidationError(null);
        setShowRejectModal(true);
    };

    const handleRejectSubmit = () => {
        if (!reportToRejectId || !rejectionReasonInput.trim()) {
            setValidationError('अस्वीकृतिको कारण लेख्नुहोस्।');
            return;
        }

        const existingReport = reports.find(r => r.id === reportToRejectId);
        if (!existingReport) return;

        setIsProcessing(true);

        const rejectedReport: IssueReportEntry = {
            ...existingReport,
            status: 'Rejected',
            rejectionReason: rejectionReasonInput.trim(),
            approvedBy: { name: currentUser.fullName, designation: currentUser.designation, date: todayBS }, 
        };

        onSave(rejectedReport);
        setSuccessMessage("अनुरोध अस्वीकृत गरियो (Request Rejected)!");

        setTimeout(() => {
            setShowRejectModal(false);
            handleBack(); 
        }, 1500);
    };

    const actionableReports = reports.filter(report => {
        if (isStoreKeeper) return report.status === 'Pending'; 
        if (isApprover) return report.status === 'Pending Approval'; 
        return false;
    }).sort((a, b) => parseInt(b.magFormNo) - parseInt(a.magFormNo));

    const historyReports = reports.filter(report => {
        if (isStoreKeeper) {
            return ['Pending Approval', 'Issued', 'Rejected'].includes(report.status);
        }
        return ['Issued', 'Rejected'].includes(report.status);
    }).sort((a, b) => parseInt(b.magFormNo) - parseInt(a.magFormNo));

    const renderDetailView = () => {
        const data = selectedReport || selectedRequest;
        if (!data) return null;

        const isReq = !!selectedRequest;
        const isNonExpendable = isReq ? (data as any).itemType === 'Non-Expendable' : (data as IssueReportEntry).itemType === 'Non-Expendable';
        const headerText = isNonExpendable 
            ? 'खर्च नहुने जिन्सी मालसामानको निकासा गरिएको' 
            : 'खर्च भएर जाने जिन्सी मालसामानको निकासा गरिएको';

        const detailIssueNo = isReq ? 'PENDING' : (data as IssueReportEntry).issueNo;
        const detailIssueDate = isReq ? 'PENDING' : (data as IssueReportEntry).issueDate;
        const detailMagFormNo = isReq ? (data as any).magFormNo : (data as IssueReportEntry).magFormNo;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="font-bold text-slate-700 font-nepali text-lg">
                                खर्च निकासा फाराम (Issue Report Form)
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded border font-bold ${
                                    (data as IssueReportEntry).status === 'Issued' ? 'bg-green-50 text-green-700 border-green-200' :
                                    (data as IssueReportEntry).status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    (data as IssueReportEntry).status === 'Pending Approval' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                    Status: {(data as IssueReportEntry).status}
                                </span>
                                {isViewOnlyMode && <span className="text-xs font-bold text-slate-400">PREVIEW</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-medium shadow-sm transition-colors">
                            <Printer size={18} /> Print
                        </button>
                        {!isViewOnlyMode && (
                            <>
                                {isApprover && (data as IssueReportEntry).status === 'Pending Approval' && (
                                    <button onClick={() => handleRejectModalOpen((data as IssueReportEntry).id)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors border border-red-200">
                                        <X size={18} /> Reject
                                    </button>
                                )}
                                <button onClick={handleSaveReport} disabled={isProcessing} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50">
                                    {isProcessing ? 'Processing...' : (
                                        <>
                                            {isStoreKeeper ? <Send size={18} /> : <ShieldCheck size={18} />}
                                            {isStoreKeeper ? 'पेश गर्नुहोस् (Forward)' : 'स्वीकृत गर्नुहोस् (Approve & Issue)'}
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div id="nikasha-form-container" className="bg-white p-8 md:p-12 rounded-xl shadow-lg max-w-[210mm] mx-auto min-h-[297mm] text-slate-900 font-nepali text-sm print:shadow-none print:p-0 print:max-w-none">
                    <div className="text-right text-xs font-bold mb-4">म.ले.प.फारम नं: ४०४</div>
                    <div className="mb-8">
                        <div className="flex items-start justify-between">
                            <div className="w-24 pt-2"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emblem_of_Nepal.svg/1200px-Emblem_of_Nepal.svg.png" alt="Emblem" className="h-24 w-24 object-contain"/></div>
                            <div className="flex-1 text-center space-y-1">
                                <h1 className="text-xl font-bold text-red-600">{generalSettings.orgNameNepali}</h1>
                                {generalSettings.subTitleNepali && <h2 className="text-lg font-bold">{generalSettings.subTitleNepali}</h2>}
                                {generalSettings.subTitleNepali2 && <h3 className="text-base font-bold">{generalSettings.subTitleNepali2}</h3>}
                                {generalSettings.subTitleNepali3 && <h3 className="text-lg font-bold">{generalSettings.subTitleNepali3}</h3>}
                                <div className="text-xs mt-2 space-x-3 font-medium text-slate-600">
                                    {generalSettings.address && <span>{generalSettings.address}</span>}
                                    {generalSettings.phone && <span>| फोन: {generalSettings.phone}</span>}
                                    {generalSettings.email && <span>| ईमेल: {generalSettings.email}</span>}
                                    {generalSettings.panNo && <span>| पान नं: {generalSettings.panNo}</span>}
                                </div>
                            </div>
                            <div className="w-24"></div> 
                        </div>
                        <div className="text-center pt-6 pb-2">
                            <h2 className="text-xl font-bold underline underline-offset-4">खर्च निकासा फाराम</h2>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-6 text-sm font-medium">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span>आ.व. :</span>
                                <input value={reportDetails.fiscalYear} readOnly className="border-b border-dotted border-slate-800 w-24 text-center bg-transparent font-bold cursor-default"/>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>माग फारम नं.:</span>
                                <input value={detailMagFormNo} readOnly className="border-b border-dotted border-slate-800 w-20 text-center bg-transparent font-bold cursor-default"/>
                            </div>
                        </div>
                        <div className="space-y-1 text-right">
                            <div className="flex items-center gap-2 justify-end">
                                <span>निकासा नं. :</span>
                                <input value={detailIssueNo} readOnly className="border-b border-dotted border-slate-800 w-20 text-center bg-transparent font-bold text-red-600 cursor-default"/>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                                <span>मिति :</span>
                                {isViewOnlyMode ? (
                                    <span className="border-b border-dotted border-slate-800 w-32 text-center inline-block font-bold">{reportDetails.issueDate}</span>
                                ) : (
                                    <NepaliDatePicker 
                                        value={reportDetails.issueDate} 
                                        onChange={handleIssueDateChange}
                                        format="YYYY/MM/DD"
                                        label=""
                                        hideIcon={true}
                                        inputClassName={`border-b border-dotted border-slate-800 w-32 text-center bg-transparent font-bold placeholder:text-slate-400 placeholder:font-normal rounded-none px-0 py-0 h-auto outline-none focus:ring-0 focus:border-slate-800 ${validationError ? 'text-red-600' : ''}`}
                                        wrapperClassName="w-32"
                                        disabled={isViewOnlyMode}
                                        popupAlign="right"
                                        minDate={todayBS}
                                        maxDate={todayBS}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <table className="w-full border-collapse border border-slate-900 text-sm text-center">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="border border-slate-900 p-2 w-12" rowSpan={2}>क्र.सं.</th>
                                    <th className="border border-slate-900 p-2" colSpan={3}>{headerText}</th>
                                    <th className="border border-slate-900 p-2 w-16" rowSpan={2}>एकाई</th>
                                    <th className="border border-slate-900 p-2 w-16" rowSpan={2}>परिमाण</th>
                                    <th className="border border-slate-900 p-2 w-20" rowSpan={2}>दर</th>
                                    <th className="border border-slate-900 p-2 w-24" rowSpan={2}>जम्मा रकम</th>
                                    <th className="border border-slate-900 p-2 w-24" rowSpan={2}>कैफियत</th>
                                </tr>
                                <tr className="bg-slate-50">
                                    <th className="border border-slate-900 p-1">नाम</th>
                                    <th className="border border-slate-900 p-1 w-20">सङ्केत नं.</th>
                                    <th className="border border-slate-900 p-1">स्पेसिफिकेसन</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.items || []).map((item: any, index: number) => {
                                    const itemName = isReq ? item.itemName : item.name;
                                    const codeNo = isReq ? (item.sanketNo || item.uniqueCode) : item.codeNo;
                                    const qty = isReq ? item.currentQuantity : item.quantity;
                                    const total = isReq ? item.totalAmount : item.totalAmount;
                                    return (
                                        <tr key={index}>
                                            <td className="border border-slate-900 p-2">{index + 1}</td>
                                            <td className="border border-slate-900 p-1 text-left px-2">{itemName}</td>
                                            <td className="border border-slate-900 p-1">{codeNo || '-'}</td>
                                            <td className="border border-slate-900 p-1 text-left px-2">{item.specification}</td>
                                            <td className="border border-slate-900 p-1">{item.unit}</td>
                                            <td className="border border-slate-900 p-1 font-bold">{qty}</td>
                                            <td className="border border-slate-900 p-1 text-right">{item.rate || '-'}</td>
                                            <td className="border border-slate-900 p-1 text-right font-bold">{total ? total.toFixed(2) : '-'}</td>
                                            <td className="border border-slate-900 p-1 text-left px-1 italic">{item.remarks}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-3 gap-8 text-sm pt-8">
                        <div>
                            <h4 className="font-bold mb-4">तयार गर्ने (जिन्सी शाखा):</h4>
                            <div className="space-y-1">
                                <div className="flex gap-2"><span>नाम :</span><input value={reportDetails.preparedBy.name} readOnly className="border-b border-dotted border-slate-400 outline-none flex-1 bg-transparent" /></div>
                                <div className="flex gap-2"><span>पद :</span><input value={reportDetails.preparedBy.designation} readOnly className="border-b border-dotted border-slate-400 outline-none flex-1 bg-transparent" /></div>
                                <div className="flex gap-2"><span>मिति :</span><input value={reportDetails.preparedBy.date} readOnly className="border-b border-dotted border-slate-400 outline-none flex-1 bg-transparent text-xs" /></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">सिफारिस गर्ने:</h4>
                            <div className="space-y-1">
                                <div className="flex gap-2"><span>नाम :</span><input value={reportDetails.recommendedBy.name} readOnly className="border-b border-dotted border-slate-400 outline-none flex-1 bg-transparent" /></div>
                                <div className="flex gap-2"><span>पद :</span><input value={reportDetails.recommendedBy.designation} readOnly className="border-b border-dotted border-slate-400 outline-none flex-1 bg-transparent" /></div>
                                <div className="flex gap-2"><span>मिति :</span><input value={reportDetails.recommendedBy.date} readOnly className="border-b border-dotted border-slate-400 outline-none flex-1 bg-transparent text-xs" /></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">स्वीकृत गर्ने (कार्यालय प्रमुख):</h4>
                            <div className="space-y-1">
                                <div className="flex gap-2"><span>नाम :</span><input value={reportDetails.approvedBy.name} readOnly className="border-b border-dotted border-slate-400 outline-none flex-1 bg-transparent" /></div>
                                <div className="flex gap-2"><span>पद :</span><input value={reportDetails.approvedBy.designation} readOnly className="border-b border-dotted border-slate-400 outline-none flex-1 bg-transparent" /></div>
                                <div className="flex gap-2"><span>मिति :</span><input value={reportDetails.approvedBy.date} readOnly className="border-b border-dotted border-slate-400 outline-none flex-1 bg-transparent text-xs" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (selectedReport || selectedRequest) {
        return renderDetailView();
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg text-green-600">
                        <FileOutput size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 font-nepali">निकासा प्रतिवेदन (Issue Report)</h2>
                        <p className="text-sm text-slate-500">जिन्सी मालसामानको निकासा विवरण</p>
                    </div>
                </div>
            </div>

            {actionableReports.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-slate-100 bg-orange-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-orange-600"/>
                            <h3 className="font-semibold text-orange-800 font-nepali">
                                {isStoreKeeper ? 'तयारीको लागि अनुरोधहरू' : 'स्वीकृतिको लागि अनुरोधहरू'}
                            </h3>
                        </div>
                        <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">{actionableReports.length}</span>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                <th className="px-6 py-3">Mag Form No</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {actionableReports.map(report => (
                                <tr key={report.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono font-medium text-slate-700">#{report.magFormNo}</td>
                                    <td className="px-6 py-4 font-nepali">{report.requestDate}</td>
                                    <td className="px-6 py-4 text-slate-600">{report.items.length} items</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleLoadReport(report, false)}
                                            className="text-primary-600 hover:text-primary-800 font-medium text-xs flex items-center justify-end gap-1 bg-primary-50 px-3 py-1.5 rounded-md hover:bg-primary-100 transition-colors"
                                        >
                                            {isStoreKeeper ? 'Prepare' : 'Review & Approve'} <ChevronRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-slate-500"/>
                        <h3 className="font-semibold text-slate-700 font-nepali">निकासा इतिहास / सूची</h3>
                    </div>
                </div>
                {historyReports.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 italic">कुनै रिपोर्ट फेला परेन</div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                <th className="px-6 py-3">Issue No</th>
                                <th className="px-6 py-3">Mag Form No</th>
                                <th className="px-6 py-3">Issue Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {historyReports.map(report => (
                                <tr key={report.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono font-medium text-slate-700">#{report.issueNo}</td>
                                    <td className="px-6 py-4 font-mono text-slate-600">#{report.magFormNo}</td>
                                    <td className="px-6 py-4 font-nepali">{report.issueDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                                            report.status === 'Issued' ? 'bg-green-100 text-green-700 border-green-200' :
                                            report.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-blue-100 text-blue-700 border-blue-200'
                                        }`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleLoadReport(report, true)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md text-xs font-bold transition-colors border border-slate-300"
                                        >
                                            <Eye size={14} /> Preview
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowRejectModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
                            <h3 className="font-bold text-slate-800 text-lg font-nepali">अस्वीकृत गर्नुहोस् (Reject)</h3>
                            <button onClick={() => setShowRejectModal(false)}><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <label className="block text-sm font-medium text-slate-700">कारण (Reason)</label>
                            <textarea
                                value={rejectionReasonInput}
                                onChange={(e) => setRejectionReasonInput(e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-red-500 outline-none"
                                required
                            ></textarea>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                            <button onClick={handleRejectSubmit} className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm shadow-sm">Confirm Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
