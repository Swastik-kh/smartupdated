
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, User, Lock, LogIn, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';
import { FISCAL_YEARS } from '../constants';
import { LoginFormData, LoginFormProps } from '../types';

export const LoginForm: React.FC<LoginFormProps> = ({ users, onLoginSuccess, initialFiscalYear }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    fiscalYear: initialFiscalYear || '2081/082',
    username: '',
    password: '',
  });

  useEffect(() => {
    if (initialFiscalYear) {
        setFormData(prev => ({ ...prev, fiscalYear: initialFiscalYear }));
    }
  }, [initialFiscalYear]);

  const [errors, setErrors] = useState<Partial<LoginFormData & { form: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (errors.form) {
      setErrors(prev => ({ ...prev, form: undefined }));
    }
  };

  // Function to handle Enter key on username to focus password field
  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordInputRef.current?.focus();
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    if (!formData.fiscalYear) newErrors.fiscalYear = 'आर्थिक वर्ष छान्नुहोस्';
    if (!formData.username.trim()) newErrors.username = 'प्रयोगकर्ता नाम आवश्यक छ';
    if (!formData.password) newErrors.password = 'पासवर्ड आवश्यक छ';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const foundUser = users.find(
        u => u.username.toLowerCase() === formData.username.trim().toLowerCase() && u.password === formData.password
      );

      if (foundUser) {
          onLoginSuccess(foundUser, formData.fiscalYear);
      } else {
          setErrors(prev => ({ 
              ...prev, 
              form: 'प्रयोगकर्ता नाम वा पासवर्ड मिलेन' 
          }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, form: 'सिस्टममा समस्या आयो' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.form && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
            <ShieldAlert size={18} />
            <span className="font-medium font-nepali">{errors.form}</span>
        </div>
      )}

      <div className="space-y-4">
        <Select
          label="आर्थिक वर्ष (Fiscal Year)"
          name="fiscalYear"
          value={formData.fiscalYear}
          onChange={handleChange}
          options={FISCAL_YEARS}
          error={errors.fiscalYear}
          icon={<Calendar size={18} />}
          className="font-bold text-primary-700"
        />

        <Input
          ref={usernameInputRef}
          label="प्रयोगकर्ताको नाम (Username)"
          name="username"
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          onKeyDown={handleUsernameKeyDown}
          error={errors.username}
          icon={<User size={18} />}
          autoComplete="username"
        />

        <div className="relative">
          <Input
            ref={passwordInputRef} 
            label="पासवर्ड (Password)"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            icon={<Lock size={18} />}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-slate-400 hover:text-primary-600 p-1 rounded-full"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 font-nepali text-lg"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>प्रक्रियामा छ...</span>
          </>
        ) : (
          <>
            <LogIn size={20} />
            <span>लगइन गर्नुहोस्</span>
          </>
        )}
      </button>
      
      <p className="text-center text-xs text-slate-400 mt-4 italic font-nepali">
        Developed by Swastik Khatiwada
      </p>
    </form>
  );
};
