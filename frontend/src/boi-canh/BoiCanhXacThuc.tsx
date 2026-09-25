import { createContext, useContext, useState, type ReactNode, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Account } from '../kieu';
import { accounts as seedAccounts } from '../du-lieu/duLieuMau';

interface AuthContextType {
  account: Account | null;
  login: (username: string, pass: string) => string | null;
  logout: () => void;
  register: (name: string, phone: string, email: string, pass: string) => string | null;
  switchRoleDemo: (role: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadAccount(): Account | null {
  try {
    const raw = localStorage.getItem('thuekho_account');
    if (!raw) return null;
    return JSON.parse(raw) as Account;
  } catch {
    return null;
  }
}

function loadAllAccounts(): Account[] {
  try {
    const raw = localStorage.getItem('mock_accounts');
    if (raw) return JSON.parse(raw);
  } catch {}
  return seedAccounts;
}

export function NhaCungCapXacThuc({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(() => loadAccount());
  const [allAccounts, setAllAccounts] = useState<Account[]>(() => loadAllAccounts());
  const navigate = useNavigate();

  useEffect(() => {
    if (account) {
      localStorage.setItem('thuekho_account', JSON.stringify(account));
    } else {
      localStorage.removeItem('thuekho_account');
    }
  }, [account]);

  useEffect(() => {
    localStorage.setItem('mock_accounts', JSON.stringify(allAccounts));
  }, [allAccounts]);

  function login(username: string, pass: string) {
    const found = allAccounts.find((a) => 
      (a.username === username || a.name === username || a.phone === username || a.email === username) 
      && a.passwordHash === pass
    );
    if (found) {
      setAccount(found);
      return null;
    }
    return 'Sai thông tin đăng nhập hoặc mật khẩu';
  }

  function register(name: string, phone: string, email: string, pass: string) {
    if (allAccounts.some((a) => a.username === phone)) return 'Số điện thoại đã được đăng ký';
    const newAccount: Account = {
      id: `a${Date.now()}`,
      username: phone,
      passwordHash: pass,
      name,
      role: 'customer',
      phone,
      email,
      status: 'ACTIVE',
    };
    setAllAccounts(prev => [...prev, newAccount]);
    return null;
  }

  function logout() {
    setAccount(null);
    navigate('/login', { replace: true });
  }

  function switchRoleDemo(username: string) {
    const found = allAccounts.find((a) => a.username === username);
    if (found) setAccount(found);
  }

  const enhancedAccount = useMemo(() => {
    if (!account || account.role !== 'customer') return account;
    try {
      const saved = localStorage.getItem('mock_customers');
      const customers = saved ? JSON.parse(saved) : [];
      
      // Nếu đã có customerId, kiểm tra xem khách này còn tồn tại không
      if (account.customerId) {
         const exists = customers.find((c: any) => c.id === account.customerId);
         if (exists) return account;
      }

      // Nếu chưa có, hoặc customerId cũ bị xóa mất, tìm theo số điện thoại/email
      const normalize = (s: string | undefined) => (s || '').trim().toLowerCase();
      const match = customers.find((c: any) => {
        const phoneMatch = c.phone && account.phone && normalize(c.phone) === normalize(account.phone);
        const emailMatch = c.email && account.email && normalize(c.email) === normalize(account.email);
        const nameMatch = c.name && account.name && normalize(c.name) === normalize(account.name);
        return phoneMatch || emailMatch || nameMatch;
      });
      
      if (match) {
        return { ...account, customerId: match.id };
      }
    } catch {}
    
    // Nếu vẫn không tìm thấy, xóa customerId rác đi để tránh lỗi
    return { ...account, customerId: undefined };
  }, [account]);

  return (
    <AuthContext.Provider
      value={{
        account: enhancedAccount,
        login,
        logout,
        register,
        switchRoleDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function dungXacThuc() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('dungXacThuc phải nằm trong NhaCungCapXacThuc');
  return ctx;
}
