import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import UserMenu from '../components/UserMenu';

const Profile = () => {
  const { user, logout, updateUser } = useAuth(); // Thêm updateUser từ AuthContext
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // State để toggle hiển thị/ẩn mật khẩu cho 2 input
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    uName: '',
    uEmail: '',
    uPhone: '',
    uAddress: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Đồng bộ dữ liệu từ AuthContext vào Form và xử lý lỗi null
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        uName: user.uName || '',
        uEmail: user.uEmail || '',
        uPhone: user.uPhone || '',
        uAddress: user.uAddress || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      setLoading(false);
      return;
    }

    try {
      // Gọi API thực tế
      const response = await authService.updateProfile({
        uName: formData.uName,
        uPhone: formData.uPhone,
        uAddress: formData.uAddress,
        uPassword: formData.newPassword || undefined
      });

      // Cập nhật AuthContext với thông tin user mới từ response
      // Backend trả về: { status: 'success', data: { user: {...} } }
      const updatedUser = response?.data?.user || response?.data?.data?.user;
      
      if (updatedUser) {
        // Cập nhật AuthContext để các component khác cũng nhận được thông tin mới
        updateUser(updatedUser);
        
        // Cập nhật formData với thông tin mới để hiển thị ngay
        setFormData(prev => ({
          ...prev,
          uName: updatedUser.uName || prev.uName,
          uPhone: updatedUser.uPhone || prev.uPhone,
          uAddress: updatedUser.uAddress || prev.uAddress,
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        // Fallback: Nếu response không có user, reload từ localStorage
        const userFromStorage = authService.getCurrentUser();
        if (userFromStorage) {
          updateUser(userFromStorage);
          setFormData(prev => ({
            ...prev,
            uName: userFromStorage.uName || prev.uName,
            uPhone: userFromStorage.uPhone || prev.uPhone,
            uAddress: userFromStorage.uAddress || prev.uAddress,
            newPassword: '',
            confirmPassword: ''
          }));
        }
      }

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Lỗi kết nối máy chủ';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header tối ưu: Luôn hiện thông tin người dùng */}
      <header className="glass sticky top-0 z-50 shadow-lg border-b border-white/20 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/tasks')}
                className="p-2 hover:bg-indigo-50 rounded-xl transition-all text-indigo-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Hồ Sơ Cá Nhân
              </h1>
            </div>

            <div className="flex items-center gap-4 pl-3 border-l border-gray-200">
              <div className="text-right hidden xs:block">
                <p className="text-sm font-bold text-gray-800 leading-none">{user?.uName || 'User'}</p>
                <p className="text-[10px] font-semibold text-indigo-500 uppercase mt-1 tracking-wider">
                  {user?.uRole || 'Member'}
                </p>
              </div>
              <UserMenu user={user} onLogout={logout} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 animate-slide-up">
        <div className="glass rounded-3xl shadow-2xl overflow-hidden border border-white/20 md:flex">
          {/* Sidebar cá nhân */}
          <div className="md:w-1/3 gradient-primary p-8 text-white flex flex-col items-center justify-center text-center">
            <div className="relative mb-4">
              <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30 shadow-glow">
                {(user?.uName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <h2 className="text-xl font-bold truncate w-full">{user?.uName || 'Đang tải...'}</h2>
            <p className="text-indigo-100 text-sm opacity-80 mb-6">{user?.uEmail}</p>

            <div className="w-full pt-6 border-t border-white/20 space-y-2 text-xs">
              <div className="flex justify-between"><span className="opacity-70">Quyền:</span><span className="font-bold">{user?.uRole}</span></div>
            </div>
          </div>

          {/* Form chỉnh sửa */}
          <div className="md:w-2/3 p-4 sm:p-6 md:p-8 bg-white/40">
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                <span className="font-medium text-sm">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Họ và tên</label>
                  <input
                    type="text"
                    name="uName"
                    required
                    value={formData.uName || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/80 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Số điện thoại</label>
                  <input
                    type="text"
                    name="uPhone"
                    value={formData.uPhone || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/80 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Địa chỉ</label>
                <input
                  type="text"
                  name="uAddress"
                  value={formData.uAddress || ''}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ của bạn"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/80 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1">Email (Cố định)</label>
                <input
                  type="email"
                  value={formData.uEmail || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-400 cursor-not-allowed outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Đổi mật khẩu</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Input mật khẩu mới */}
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="Mật khẩu mới"
                      value={formData.newPassword || ''}
                      onChange={handleChange}
                      className="w-full px-4 pr-12 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/80"
                    />
                    {/* Icon eye để toggle hiển thị/ẩn mật khẩu mới */}
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {/* Input xác nhận mật khẩu */}
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Xác nhận mật khẩu"
                      value={formData.confirmPassword || ''}
                      onChange={handleChange}
                      className="w-full px-4 pr-12 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/80"
                    />
                    {/* Icon eye để toggle hiển thị/ẩn mật khẩu xác nhận */}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 gradient-primary text-white rounded-xl font-bold shadow-glow hover:shadow-glow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Lưu thay đổi'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;