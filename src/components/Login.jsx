import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Login = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Gọi API đăng nhập
            const res = await axiosClient.post('/auth/login', formData);
            const user = res.data;

            // 2. Lưu thông tin user vào localStorage để dùng cho toàn bộ app
            localStorage.setItem('user', JSON.stringify(user));

            // 3. LOGIC ĐIỀU HƯỚNG DỰA TRÊN ROLE (QUAN TRỌNG)
            if (user.vaiTro === 'ADMIN') {
                navigate('/admin'); // Chuyển đến Dashboard Admin
            } 
            else if (user.vaiTro === 'CAN_BO') {
                navigate('/can-bo'); // Chuyển đến Dashboard Cán bộ thuế
            } 
            else if (user.vaiTro === 'CHU_DAT') {
                navigate('/dashboard'); // Chuyển đến Dashboard Chủ đất (Người dân)
            } 
            else {
                // Trường hợp role lạ hoặc chưa phân quyền
                setError('Tài khoản không có quyền truy cập hợp lệ.');
                localStorage.removeItem('user');
            }

        } catch (err) {
            // Xử lý lỗi đăng nhập
            let errorMessage = "Đăng nhập thất bại.";
            if (err.response && err.response.data) {
                if (typeof err.response.data === 'object') {
                    errorMessage = err.response.data.message || JSON.stringify(err.response.data);
                } else {
                    errorMessage = err.response.data;
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <div className="card shadow-lg border-0" style={{ maxWidth: '450px', width: '100%' }}>
                <div className="card-header bg-primary text-white text-center py-4">
                    <img 
                        src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg" 
                        alt="Logo" 
                        className="mb-3 rounded-circle shadow-sm bg-white p-1" // Thêm viền trắng và bóng cho nổi trên nền xanh
                        style={{ height: '80px', width: '80px' }} // To hơn để làm điểm nhấn
                    />
                    <h4 className="fw-bold mb-0 text-uppercase">Cổng Dịch Vụ Công</h4>
                    <small>Đăng nhập hệ thống quản lý đất đai</small>
                </div>
                <div className="card-body p-4">
                    {error && <div className="alert alert-danger text-center">{error}</div>}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Tên đăng nhập</label>
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-person-fill"></i></span>
                                <input
                                    type="text"
                                    name="username"
                                    className="form-control"
                                    placeholder="Nhập tên đăng nhập..."
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold">Mật khẩu</label>
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-control"
                                    placeholder="Nhập mật khẩu..."
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}>
                            {loading ? 'Đang kiểm tra...' : 'ĐĂNG NHẬP'}
                        </button>
                    </form>
                </div>
                <div className="card-footer text-center py-3 bg-white">
                    <p className="mb-0 text-muted">Công dân chưa có tài khoản?</p>
                    <Link to="/register" className="text-decoration-none fw-bold">Đăng ký Chủ Đất mới</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;