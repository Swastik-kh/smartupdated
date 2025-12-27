
import React, { useState, useEffect } from 'react';
import { User, UserManagementProps, UserRole, Option } from '../types';
import { Plus, Trash2, Shield, User as UserIcon, Building2, Save, X, Phone, Briefcase, IdCard, Users, Pencil, CheckSquare, Square, ChevronDown, ChevronRight, CornerDownRight, Store, AlertCircle } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';

const PERMISSION_STRUCTURE = [
    { 
        id: 'services', 
        label: 'सेवा (Services)',
        children: [
            { id: 'tb_leprosy', label: 'क्षयरोग/कुष्ठरोग (TB/Leprosy)' },
            { id: 'rabies', label: 'रेबिज खोप क्लिनिक (Rabies Vaccine)' }
        ]
    },
    { 
        id: 'inventory', 
        label: 'जिन्सी व्यवस्थापन (Inventory)',
        children: [
            { id: 'stock_entry_approval', label: 'स्टक प्रविष्टि अनुरोध (Stock Requests)' },
            { id: 'jinshi_maujdat', label: 'जिन्सी मौज्दात (Inventory Stock)' }, 
            { id: 'form_suchikaran', label: 'फर्म सुचीकरण (Firm Listing)' },
            { id: 'quotation', label: 'सामानको कोटेशन (Quotation)' },
            { id: 'mag_faram', label: 'माग फारम (Demand Form)' },
            { id: 'kharid_adesh', label: 'खरिद आदेश (Purchase Order)' },
            { id: 'nikasha_pratibedan', label: 'निकासा प्रतिवेदन (Issue Report)' },
            { id: 'sahayak_jinshi_khata', label: 'सहायक जिन्सी खाता (Sub. Ledger)' },
            { id: 'jinshi_khata', label: 'जिन्सी खाता (Inventory Ledger)' },
            { id: 'dakhila_pratibedan', label: 'दाखिला प्रतिवेदन (Entry Report)' },
            { id: 'jinshi_firta_khata', label: 'जिन्सी फिर्ता खाता (Return Ledger)' },
            { id: 'marmat_adesh', label: 'मर्मत आवेदन/आदेश (Maintenance)' },
            { id: 'dhuliyauna_faram', label: 'लिलाम / धुल्याउने (Disposal)' },
            { id: 'log_book', label: 'लग बुक (Log Book)' },
        ]
    },
    { 
        id: 'report', 
        label: 'रिपोर्ट (Report)',
        children: [
            { id: 'report_tb_leprosy', label: 'क्षयरोग/कुष्ठरोग रिपोर्ट (TB/Leprosy)' },
            { id: 'report_rabies', label: 'रेबिज रिपोर्ट (Rabies Report)' },
            { id: 'report_inventory_monthly', label: 'जिन्सी मासिक प्रतिवेदन (Monthly Report)' }
        ]
    },
    { 
        id: 'settings', 
        label: 'सेटिङ (Settings)',
        children: [
            { id: 'general_setting', label: 'सामान्य सेटिङ (General Setting)' },
            { id: 'store_setup', label: 'स्टोर सेटअप (Store Setup)' },
            { id: 'database_management', label: 'डाटाबेस व्यवस्थापन (Database Management)' },
        ]
    }
];

export const UserManagement: React.FC<UserManagementProps> = ({ 
  currentUser, 
  users, 
  onAddUser,
  onUpdateUser,
  onDeleteUser 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    username: string;
    password: string;
    fullName: string;
    designation: string;
    phoneNumber: string;
    organizationName: string;
    role: UserRole;
    allowedMenus: string[];
  }>({
    username: '',
    password: '',
    fullName: '',
    designation: '',
    phoneNumber: '',
    organizationName: currentUser.role === 'ADMIN' ? currentUser.organizationName : '',
    role: 'STAFF',
    allowedMenus: ['dashboard', 'change_password']
  });

  const availableRoles: Option[] = [
    { id: 'staff', value: 'STAFF', label: 'कर्मचारी (Staff)' },
    { id: 'storekeeper', value: 'STOREKEEPER', label: 'जिन्सी शाखा (Storekeeper)' },
    { id: 'account', value: 'ACCOUNT', label: 'लेखा शाखा (Account)' },
    { id: 'approval', value: 'APPROVAL', label: 'स्वीकृत गर्ने (Approval/Head)' },
  ];

  const canManageUsers = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const managedUsers = users.filter(u => {
    if (currentUser.role === 'SUPER_ADMIN') return u.role === 'ADMIN';
    if (currentUser.role === 'ADMIN') return ['STAFF', 'STOREKEEPER', 'ACCOUNT', 'APPROVAL'].includes(u.role) && u.organizationName === currentUser.organizationName;
    return false;
  });

  const handleAddNew = () => {
    setEditingId(null);
    setErrorMsg(null);
    setFormData({ 
      username: '', 
      password: '', 
      fullName: '', 
      designation: '', 
      phoneNumber: '',
      organizationName: currentUser.role === 'ADMIN' ? currentUser.organizationName : '',
      role: 'STAFF', 
      allowedMenus: ['dashboard', 'change_password']
    });
    setShowForm(true);
  };

  const handleEditClick = (user: User) => {
    setEditingId(user.id);
    setErrorMsg(null);
    setFormData({
      username: user.username, 
      password: user.password, 
      fullName: user.fullName, 
      designation: user.designation,
      phoneNumber: user.phoneNumber, 
      organizationName: user.organizationName, 
      role: user.role,
      allowedMenus: user.allowedMenus || ['dashboard', 'change_password']
    });
    setShowForm(true);
  };

  const togglePermission = (menuId: string) => {
    setFormData(prev => {
      const current = prev.allowedMenus;
      if (current.includes(menuId)) return { ...prev, allowedMenus: current.filter(id => id !== menuId) };
      return { ...prev, allowedMenus: [...current, menuId] };
    });
  };

  const toggleParentPermission = (parentId: string, childrenIds: string[]) => {
    const isParentChecked = formData.allowedMenus.includes(parentId);
    setFormData(prev => {
      let newMenus = [...prev.allowedMenus];
      if (isParentChecked) {
        newMenus = newMenus.filter(id => id !== parentId && !childrenIds.includes(id));
      } else {
        newMenus = Array.from(new Set([...newMenus, parentId, ...childrenIds]));
      }
      return { ...prev, allowedMenus: newMenus };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    setErrorMsg(null);

    const trimmedUsername = formData.username.trim().toLowerCase();

    // GLOBAL USERNAME VALIDATION:
    // Check if the username already exists in ANY organization
    const isDuplicate = users.some(u => 
        u.username.toLowerCase() === trimmedUsername && u.id !== editingId
    );

    if (isDuplicate) {
        setErrorMsg(`प्रयोगकर्ता नाम "${formData.username}" प्रणालीमा पहिले नै दर्ता छ। कृपया अर्को नाम छान्नुहोस्। (Username already exists in the system)`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // Ensure dashboard and change_password are always included
    const finalMenus = Array.from(new Set([...formData.allowedMenus, 'dashboard', 'change_password']));
    
    const userToSave: User = {
      id: editingId || Date.now().toString(),
      username: formData.username.trim(), 
      password: formData.password.trim(), 
      role: currentUser.role === 'SUPER_ADMIN' ? 'ADMIN' : formData.role,
      fullName: formData.fullName.trim(), 
      designation: formData.designation.trim(), 
      phoneNumber: formData.phoneNumber.trim(), 
      organizationName: formData.organizationName.trim(),
      allowedMenus: finalMenus
    };

    if (editingId) onUpdateUser(userToSave);
    else onAddUser(userToSave);
    
    setShowForm(false);
    alert('प्रयोगकर्ताको विवरण सफलतापूर्वक सुरक्षित गरियो।');
  };

  if (!canManageUsers) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-nepali">प्रयोगकर्ता व्यवस्थापन (User Management)</h2>
          <p className="text-sm text-slate-500">प्रणाली चलाउने कर्मचारी र तिनीहरूको पहुँच नियन्त्रण गर्नुहोस्</p>
        </div>
        {!showForm && (
          <button 
            onClick={handleAddNew} 
            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 font-bold"
          >
            <Plus size={20} />
            <span className="font-nepali">नयाँ प्रयोगकर्ता थप्नुहोस्</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-700 font-nepali flex items-center gap-2">
                <UserIcon className="text-primary-600" />
                {editingId ? 'प्रयोगकर्ता परिमार्जन (Edit User)' : 'नयाँ प्रयोगकर्ता दर्ता (New User Registration)'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-all"><X size={24} /></button>
          </div>

          {errorMsg && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 animate-pulse">
                  <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                  <div>
                      <h4 className="font-bold text-red-800 text-sm font-nepali">सुरक्षा सतर्कता (Warning)</h4>
                      <p className="text-red-700 text-sm font-nepali mt-1">{errorMsg}</p>
                  </div>
              </div>
          )}

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <Input label="पूरा नाम (Full Name)" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required icon={<IdCard size={18} />} />
            <Input label="पद (Designation)" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} required icon={<Briefcase size={18} />} />
            <Input label="फोन नं. (Phone Number)" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required icon={<Phone size={18} />} />
            <Input 
                label="संस्थाको नाम (Organization)" 
                value={formData.organizationName} 
                onChange={e => setFormData({...formData, organizationName: e.target.value})} 
                required 
                readOnly={currentUser.role === 'ADMIN'} 
                className={currentUser.role === 'ADMIN' ? 'bg-slate-50 font-bold' : ''} 
                icon={<Building2 size={18} />} 
            />
            {currentUser.role === 'ADMIN' && (
                <Select 
                    label="भूमिका (Role)" 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})} 
                    options={availableRoles} 
                    icon={<Users size={18} />} 
                />
            )}
            <div className="relative">
                <Input 
                    label="प्रयोगकर्ताको नाम (Username)" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                    required 
                    icon={<UserIcon size={18} />} 
                    error={errorMsg ? 'Invalid Username' : undefined}
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">Username must be unique across all institutions.</p>
            </div>
            <Input label="पासवर्ड (Password)" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required type="password" />
            
            <div className="md:col-span-2 mt-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Shield size={18} className="text-primary-600" /> पहुँच अनुमति (Menu Permissions)
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select accessible features</span>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                    {PERMISSION_STRUCTURE.map((group) => {
                        const childrenIds = group.children.map(c => c.id);
                        const checkedChildren = childrenIds.filter(id => formData.allowedMenus.includes(id));
                        const isAllChecked = checkedChildren.length === childrenIds.length;
                        const isIndeterminate = checkedChildren.length > 0 && checkedChildren.length < childrenIds.length;

                        return (
                            <div key={group.id} className="border rounded-xl bg-white shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 p-3 bg-slate-100/50 border-b border-slate-100">
                                    <button 
                                        type="button" 
                                        onClick={() => toggleParentPermission(group.id, childrenIds)} 
                                        className={isAllChecked ? 'text-primary-600' : isIndeterminate ? 'text-primary-400' : 'text-slate-300'}
                                    >
                                        {isAllChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </button>
                                    <span className="font-bold text-xs text-slate-700">{group.label}</span>
                                </div>
                                <div className="p-3 space-y-2">
                                    {group.children.map(child => (
                                        <div 
                                            key={child.id} 
                                            onClick={() => togglePermission(child.id)} 
                                            className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors group ${formData.allowedMenus.includes(child.id) ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className={formData.allowedMenus.includes(child.id) ? 'text-primary-600' : 'text-slate-300 group-hover:text-slate-400'}>
                                                {formData.allowedMenus.includes(child.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                            </div>
                                            <span className={`text-[11px] font-medium ${formData.allowedMenus.includes(child.id) ? 'text-primary-800' : 'text-slate-600'}`}>{child.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">रद्द (Cancel)</button>
              <button type="submit" className="bg-primary-600 text-white px-10 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all">
                <Save size={20} className="inline mr-2" /> 
                {editingId ? 'अपडेट गर्नुहोस्' : 'सुरक्षित गर्नुहोस्'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg shadow-slate-100">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 font-nepali">प्रयोगकर्ताहरूको सूची (Users List)</h3>
            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded-full">{managedUsers.length} Users</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                        <th className="px-8 py-4">कर्मचारी</th>
                        <th className="px-8 py-4">भूमिका</th>
                        <th className="px-8 py-4">संस्था</th>
                        <th className="px-8 py-4 text-right">कार्य</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {managedUsers.length === 0 ? (
                        <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">कुनै प्रयोगकर्ता भेटिएन।</td></tr>
                    ) : (
                        managedUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg">{user.fullName.charAt(0)}</div>
                                        <div>
                                            <div className="font-bold text-slate-800">{user.fullName}</div>
                                            <div className="text-xs text-slate-400">@{user.username} | {user.phoneNumber}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border tracking-wide ${
                                        user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        user.role === 'APPROVAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        user.role === 'STOREKEEPER' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                        {user.role}
                                    </span>
                                    <div className="text-[10px] text-slate-400 mt-1 font-medium italic">{user.designation}</div>
                                </td>
                                <td className="px-8 py-4 text-slate-600 font-medium">{user.organizationName}</td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEditClick(user)} className="text-primary-500 p-2 hover:bg-primary-50 rounded-lg transition-all" title="Edit"><Pencil size={18} /></button>
                                        <button onClick={() => onDeleteUser(user.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
