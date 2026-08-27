import { fetchApi } from './api';

export interface LoginParams {
  username?: string;
  email?: string;
  password?: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password?: string;
  fullName?: string;
}

export const authService = {
  async login(credentials: LoginParams) {
    const res = await fetchApi<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: credentials.username || credentials.email,
        password: credentials.password,
      }),
    });

    if (res && (res.accessToken || res.token)) {
      const accessToken = res.accessToken || res.token;
      const refreshToken = res.refreshToken;

      // Block administrative roles from client login
      const userRole = res.user?.role || res.role || '';
      if (userRole && userRole !== 'USER' && userRole !== 'CUSTOMER' && userRole !== 'Khách hàng' && userRole !== 'Người dùng') {
        throw new Error('Tài khoản này thuộc quyền quản trị, vui lòng đăng nhập trên RetailHub');
      }

      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      const userObj = {
        id: res.user?.id || res.id || '',
        name: res.name || res.user?.name || res.user?.fullName || credentials.username || 'Khách hàng',
        email: res.email || res.user?.email || credentials.email || '',
        phone: res.phone || res.user?.phone || '',
        avatar: res.user?.avatar || res.avatar || res.user?.avatarUrl || '',
        avatarUrl: res.user?.avatarUrl || res.avatarUrl || res.user?.avatar || '',
      };
      localStorage.setItem('user_info', JSON.stringify(userObj));
      return { accessToken, user: userObj };
    }

    throw new Error('Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
  },

  async register(data: RegisterParams) {
    const res = await fetchApi<any>('/auth/register-customer', {
      method: 'POST',
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      }),
    });

    if (res && (res.accessToken || res.token)) {
      const accessToken = res.accessToken || res.token;
      const refreshToken = res.refreshToken;

      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      const userObj = {
        id: res.user?.id || res.id || '',
        name: res.user?.name || res.user?.fullName || data.fullName || data.username,
        email: res.user?.email || data.email,
        phone: res.user?.phone || '',
      };
      localStorage.setItem('user_info', JSON.stringify(userObj));
      return { accessToken, user: userObj };
    }

    return res;
  },

  getCurrentUser() {
    const token = localStorage.getItem('access_token');
    if (!token || token === 'session_token') {
      return null;
    }
    const raw = localStorage.getItem('user_info');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  },

  async changePassword(oldPassword: string, newPassword: string, confirmPassword: string) {
    return await fetchApi<any>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword,
        newPassword,
        confirmPassword
      })
    });
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('active_chat_ticket_id');
    window.location.reload();
  }
};
