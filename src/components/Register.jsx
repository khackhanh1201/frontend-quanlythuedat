import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        tenDangNhap: '',
        matKhau: '',
        hoTen: '',
        cccd: '',
        // Có thể thêm sdt, email, diaChi nếu backend cần, hiện tại backend entity có nhưng DTO đăng ký bạn gửi chỉ có 4 trường này là chính
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // API: POST /api/auth/register
            await axiosClient.post('/auth/register', formData);
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (err) {
            // Backend sẽ trả về lỗi: "Trùng tên đăng nhập" hoặc "Trùng CCCD"
            setError(err.response?.data || "Đăng ký thất bại");
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <div className="card shadow border-0" style={{ maxWidth: '500px', width: '100%' }}>
                <div className="card-header bg-success text-white text-center py-4">
                    <img 
                        src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg" 
                        alt="Logo" 
                        className="mb-3 rounded-circle shadow-sm bg-white p-1"
                        style={{ height: '70px', width: '70px' }}
                    />
                    <h5 className="fw-bold mb-0 text-uppercase">ĐĂNG KÝ TÀI KHOẢN CÔNG DÂN</h5>
                </div>
                <div className="card-body p-4">
                    {error && <div className="alert alert-danger">{error}</div>}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Họ và Tên</label>
                            <input type="text" name="hoTen" className="form-control" onChange={handleChange} required placeholder="Nguyễn Văn A" />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Số CCCD (Định danh)</label>
                            <input type="text" name="cccd" className="form-control" onChange={handleChange} required placeholder="001..." />
                            <div className="form-text">Số CCCD sẽ được dùng để xác thực quyền sở hữu đất.</div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Tên đăng nhập</label>
                            <input type="text" name="tenDangNhap" className="form-control" onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Mật khẩu</label>
                            <input type="password" name="matKhau" className="form-control" onChange={handleChange} required />
                        </div>
                        
                        <button type="submit" className="btn btn-success w-100 mt-2">Xác Nhận Đăng Ký</button>
                    </form>
                </div>
                <div className="card-footer text-center bg-white">
                    <Link to="/login" className="text-decoration-none">Quay lại Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;