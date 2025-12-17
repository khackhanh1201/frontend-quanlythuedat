import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Login = () => {
    const navigate = useNavigate();
    
    // 1. State Đăng nhập
    const [credentials, setCredentials] = useState({
        username: '', // API yêu cầu key là 'username'
        password: ''  // API yêu cầu key là 'password'
    });

    // 2. State Quên mật khẩu
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotIdentifier, setForgotIdentifier] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- XỬ LÝ ĐĂNG NHẬP ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // API: POST /api/auth/login
            const res = await axiosClient.post('/auth/login', credentials);
            
            // Dữ liệu thô từ Backend trả về (theo JSON bạn cung cấp)
            const rawData = res.data;

            // [SỬA ĐỔI 1] Kiểm tra trạng thái hoạt động dựa trên trường 'trangThai'
            if (rawData.trangThai === false) {
                setError('Tài khoản này đã bị khóa. Vui lòng liên hệ Admin.');
                setLoading(false);
                return;
            }

            // [SỬA ĐỔI 2] Chuẩn hóa dữ liệu trước khi lưu vào localStorage
            // Việc này giúp UserDashboard (dùng user.cccd, user.id) không bị lỗi
            const userToSave = {
                id: rawData.maNguoiDung,        // Map maNguoiDung -> id
                tenDangNhap: rawData.tenDangNhap,
                hoTen: rawData.hoTen,
                vaiTro: rawData.vaiTro,
                cccd: rawData.soDinhDanh,       // Map soDinhDanh -> cccd (để Dashboard hiển thị đúng)
                diaChi: rawData.diaChi,
                sdt: rawData.sdt,
                email: rawData.email,
                hoatDong: rawData.trangThai
            };

            // Lưu vào localStorage
            localStorage.setItem('user', JSON.stringify(userToSave));

            // Điều hướng theo vai trò (vaiTro)
            // Backend trả về: "ADMIN", "CAN_BO", "CHU_DAT" (cần đảm bảo backend trả đúng string này)
            if (userToSave.vaiTro === 'ADMIN') navigate('/admin');
            else if (userToSave.vaiTro === 'CAN_BO') navigate('/can-bo');
            else navigate('/dashboard'); // Mặc định là CHU_DAT

        } catch (err) {
            console.error(err);
            setError('Sai tên đăng nhập hoặc mật khẩu!');
        } finally {
            setLoading(false);
        }
    };

    // --- XỬ LÝ QUÊN MẬT KHẨU ---
    const handleForgotPassword = async () => {
        if (!forgotIdentifier) return alert("Vui lòng nhập tên đăng nhập!");
        
        try {
            // API: POST /api/auth/forgot-password
            await axiosClient.post('/auth/forgot-password', { identifier: forgotIdentifier });
            alert("Yêu cầu đã được gửi! Vui lòng kiểm tra Email/SĐT để lấy lại mật khẩu.");
            setShowForgotModal(false);
            setForgotIdentifier('');
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không tìm thấy tài khoản này"));
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <div className="card shadow-lg border-0" style={{ maxWidth: '450px', width: '100%' }}>
                <div className="card-header bg-primary text-white text-center py-4">
                    <img 
                        src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg" 
                        alt="Logo" className="mb-3 rounded-circle shadow-sm bg-white p-1" style={{ height: '80px' }}
                    />
                    <h4 className="fw-bold mb-0 text-uppercase">Đăng Nhập Hệ Thống</h4>
                </div>
                <div className="card-body p-4">
                    {error && <div className="alert alert-danger text-center">{error}</div>}
                    
                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Tên đăng nhập</label>
                            <input 
                                type="text" className="form-control" 
                                value={credentials.username}
                                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                                required placeholder="Nhập username..."
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Mật khẩu</label>
                            <input 
                                type="password" className="form-control" 
                                value={credentials.password}
                                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                                required placeholder="Nhập password..."
                            />
                        </div>
                        
                        <div className="d-flex justify-content-between mb-3">
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="remember" />
                                <label className="form-check-label text-muted small" htmlFor="remember">Ghi nhớ</label>
                            </div>
                            <span 
                                className="text-primary text-decoration-none small" 
                                style={{cursor: 'pointer'}}
                                onClick={() => setShowForgotModal(true)}
                            >
                                Quên mật khẩu?
                            </span>
                        </div>

                        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
                        </button>
                    </form>
                </div>
                <div className="card-footer text-center py-3 bg-white">
                    <p className="mb-0 text-muted">Chưa có tài khoản?</p>
                    <Link to="/register" className="text-decoration-none fw-bold text-primary">Đăng ký Chủ Đất mới</Link>
                </div>
            </div>

            {/* MODAL QUÊN MẬT KHẨU */}
            {showForgotModal && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Khôi Phục Mật Khẩu</h5>
                                <button type="button" className="btn-close" onClick={() => setShowForgotModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Nhập tên đăng nhập hoặc mã định danh của bạn:</p>
                                <input 
                                    type="text" className="form-control" 
                                    placeholder="Username / CCCD..."
                                    value={forgotIdentifier}
                                    onChange={(e) => setForgotIdentifier(e.target.value)}
                                />
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowForgotModal(false)}>Hủy</button>
                                <button className="btn btn-primary" onClick={handleForgotPassword}>Gửi Yêu Cầu</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;