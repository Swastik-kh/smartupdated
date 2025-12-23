
import React, { useState } from 'react';
import { User, UserManagementProps, UserRole, Option } from '../types';
import { Plus, Trash2, Shield, User as UserIcon, Building2, Save, X, Phone, Briefcase, IdCard, Users, Pencil, CheckSquare, Square, ChevronDown, ChevronRight, CornerDownRight, Store } from 'lucide-react';
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
            { id: 'form_suchikaran', label: 'फर्म सुचीकरण (Firm Listing)' },
            { id: 'quotation', label: 'सामानको कोटेशन (Quotation)' },
            { id: 'mag_faram', label: 'माग फारम (Demand Form)' },
            { id: 'kharid_adesh', label: 'खरिद आदेश (Purchase Order)' },
            { id: 'nikasha_pratibedan', label: 'निकासा प्रतिवेदन (Issue Report)' },
            { id: 'jinshi_maujdat', label: 'जिन्सी मौज्दात (Inventory Stock)' }, 
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
            { id: 'user_management', label: 'प्रयोगकर्ता सेटअप (User Setup)' },
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
  const [expandedPermissions, setExpandedPermissions] = useState<string[]>(['services', 'inventory', 'report']);

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
    organizationName: '',
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

  const resetForm = () => {
      setFormData({ 
        username: '', password: '', fullName: '', designation: '', phoneNumber: '',
        organizationName: currentUser.role === 'ADMIN' ? currentUser.organizationName : '',
        role: 'STAFF', allowedMenus: ['dashboard', 'change_password']
      });
      setEditingId(null);
  };

  const handleEditClick = (user: User) => {
      setEditingId(user.id);
      setFormData({
          username: user.username, password: user.password, fullName: user.fullName, designation: user.designation,
          phoneNumber: user.phoneNumber, organizationName: user.organizationName, role: user.role,
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
          if (isParentChecked) newMenus = newMenus.filter(id => id !== parentId && !childrenIds.includes(id));
          else {
              newMenus = newMenus.filter(id => id !== parentId && !childrenIds.includes(id));
              newMenus.push(parentId, ...childrenIds);
          }
          return { ...prev, allowedMenus: newMenus };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    const finalMenus = Array.from(new Set([...formData.allowedMenus, 'dashboard', 'change_password']));
    const userToSave: User = {
        id: editingId || Date.now().toString(),
        username: formData.username, password: formData.password, 
        role: currentUser.role === 'SUPER_ADMIN' ? 'ADMIN' : formData.role,
        fullName: formData.fullName, designation: formData.designation, 
        phoneNumber: formData.phoneNumber, organizationName: formData.organizationName,
        allowedMenus: finalMenus
    };
    if (editingId) onUpdateUser(userToSave);
    else onAddUser(userToSave);
    setShowForm(false);
    resetForm();
  };

  if (!canManageUsers) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-slate-800 font-nepali">प्रयोगकर्ता व्यवस्थापन</h2></div>
        {!showForm && (<button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"><Plus size={18} /><span className="font-nepali">नयाँ प्रयोगकर्ता</span></button>)}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <Input label="पूरा नाम" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required icon={<IdCard size={16} />} />
            <Input label="पद" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} required icon={<Briefcase size={16} />} />
            <Input label="फोन नं." value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required icon={<Phone size={16} />} />
            <Input label="संस्थाको नाम" value={formData.organizationName} onChange={e => setFormData({...formData, organizationName: e.target.value})} required readOnly={currentUser.role === 'ADMIN'} className={currentUser.role === 'ADMIN' ? 'bg-slate-50' : ''} icon={<Building2 size={16} />} />
            {currentUser.role === 'ADMIN' && (<Select label="भूमिका (Role)" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} options={availableRoles} icon={<Users size={16} />} />)}
            <Input label="प्रयोगकर्ताको नाम" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required icon={<UserIcon size={16} />} />
            <Input label="पासवर्ड" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required type="password" />
            
            <div className="md:col-span-2 mt-4 bg-slate-50 p-4 rounded-lg border">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Shield size={16} /> मेनु अनुमति (Menu Permissions)</h4>
                <div className="space-y-2">
                    {PERMISSION_STRUCTURE.map((group) => {
                        const childrenIds = group.children.map(c => c.id);
                        const allChecked = childrenIds.every(id => formData.allowedMenus.includes(id));
                        return (
                            <div key={group.id} className="border rounded bg-white">
                                <div className="flex items-center gap-3 p-2 bg-slate-50/50">
                                    <button type="button" onClick={() => toggleParentPermission(group.id, childrenIds)} className={allChecked ? 'text-primary-600' : 'text-slate-300'}>{allChecked ? <CheckSquare size={18} /> : <Square size={18} />}</button>
                                    <span className="font-bold text-xs">{group.label}</span>
                                </div>
                                <div className="p-2 grid grid-cols-2 gap-2">
                                    {group.children.map(child => (
                                        <div key={child.id} onClick={() => togglePermission(child.id)} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50">
                                            <div className={formData.allowedMenus.includes(child.id) ? 'text-primary-600' : 'text-slate-300'}>{formData.allowedMenus.includes(child.id) ? <CheckSquare size={14} /> : <Square size={14} />}</div>
                                            <span className="text-[11px]">{child.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600">रद्द</button>
              <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold">सुरक्षित गर्नुहोस्</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4">प्रयोगकर्ता</th>
              <th className="px-6 py-4">भूमिका</th>
              <th className="px-6 py-4">संस्था</th>
              <th className="px-6 py-4 text-right">कार्य</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {managedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{user.fullName} (@{user.username})</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700">{user.role}</span></td>
                  <td className="px-6 py-4 text-slate-600">{user.organizationName}</td>
                  <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEditClick(user)} className="text-primary-400 p-1"><Pencil size={16} /></button><button onClick={() => onDeleteUser(user.id)} className="text-red-400 p-1"><Trash2 size={16} /></button></div></td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
