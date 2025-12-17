import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Register = () => {
    const navigate = useNavigate();
    
    // State khớp với NguoiDungEntity
    const [formData, setFormData] = useState({
        hoTen: '',
        soDinhDanh: '',  
        sdt: '',
        email: '',       
        diaChi: '',
        quocTich: 'Việt Nam',
        tenDangNhap: '',
        matKhau: ''
    });

    const [file, setFile] = useState(null); // File ảnh (Optional)
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Xử lý thay đổi input text
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Xử lý chọn file ảnh
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // [CẬP NHẬT] Đã bỏ đoạn kiểm tra if (!file) {...}
        // Giờ đây file là tùy chọn.

        setLoading(true);

        try {
            // --- CHUẨN BỊ FORMDATA ---
            const submitData = new FormData();
            
            // 1. Convert object user thành JSON Blob
            // Để đảm bảo Content-Type của phần này là application/json
            const jsonBlob = new Blob([JSON.stringify(formData)], { type: "application/json" });
            submitData.append("user", jsonBlob);
            
            // 2. Chỉ append file nếu người dùng có chọn
            if (file) {
                submitData.append("file", file);
            }

            // Gọi API
            await axiosClient.post('/auth/register', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            alert('Đăng ký thành công! Vui lòng chờ quản trị viên phê duyệt.');
            navigate('/login');

        } catch (err) {
            console.error("Lỗi đăng ký:", err);
            const msg = err.response?.data?.error || err.response?.data || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
            setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light py-5">
            <div className="card shadow-lg border-0" style={{ maxWidth: '700px', width: '100%' }}>
                <div className="card-header bg-success text-white text-center py-4">
                    <img 
                        src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg" 
                        alt="Logo" className="mb-3 rounded-circle shadow-sm bg-white p-1" style={{ height: '70px' }}
                    />
                    <h4 className="fw-bold mb-0 text-uppercase">ĐĂNG KÝ TÀI KHOẢN CÔNG DÂN</h4>
                    <p className="mb-0 small opacity-75">Hệ thống Quản lý Thuế Đất Quốc Gia</p>
                </div>
                
                <div className="card-body p-4 p-md-5">
                    {error && (
                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            <div>{error}</div>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <h6 className="text-primary fw-bold mb-3 border-bottom pb-2"><i className="bi bi-person-vcard me-2"></i>Thông tin cá nhân</h6>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Họ và Tên <span className="text-danger">*</span></label>
                                <input type="text" name="hoTen" className="form-control" onChange={handleChange} required placeholder="Ví dụ: Nguyễn Văn A" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Số Định Danh (CCCD) <span className="text-danger">*</span></label>
                                <input type="text" name="soDinhDanh" className="form-control" onChange={handleChange} required placeholder="Ví dụ: 001090..." />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">Số điện thoại <span className="text-danger">*</span></label>
                                <input type="tel" name="sdt" className="form-control" onChange={handleChange} required placeholder="09xxxxxxx" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Email</label>
                                <input type="email" name="email" className="form-control" onChange={handleChange} placeholder="email@example.com" />
                            </div>

                            <div className="col-md-12">
                                <label className="form-label fw-bold">Địa chỉ thường trú <span className="text-danger">*</span></label>
                                <input type="text" name="diaChi" className="form-control" onChange={handleChange} required placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
                            </div>
                            
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Quốc tịch</label>
                                <select name="quocTich" className="form-select" onChange={handleChange} value={formData.quocTich}>
                                    <option value="Việt Nam">Việt Nam</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>

                            {/* [CẬP NHẬT] Phần này đã bỏ dấu * đỏ và thêm ghi chú (Tùy chọn) */}
                            <div className="col-md-12">
                                <label className="form-label fw-bold text-secondary">
                                    <i className="bi bi-cloud-upload me-1"></i> Ảnh chụp mặt trước CCCD (Tùy chọn)
                                </label>
                                <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
                                <div className="form-text">Bạn có thể bổ sung ảnh sau để xác thực danh tính nhanh hơn.</div>
                            </div>
                        </div>

                        <h6 className="text-primary fw-bold mt-4 mb-3 border-bottom pb-2"><i className="bi bi-shield-lock me-2"></i>Thông tin đăng nhập</h6>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Tên đăng nhập <span className="text-danger">*</span></label>
                                <input type="text" name="tenDangNhap" className="form-control bg-light" onChange={handleChange} required placeholder="Viết liền không dấu" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Mật khẩu <span className="text-danger">*</span></label>
                                <input type="password" name="matKhau" className="form-control bg-light" onChange={handleChange} required placeholder="******" />
                            </div>
                        </div>
                        
                        <div className="d-grid gap-2 mt-5">
                            <button type="submit" className="btn btn-success py-2 fw-bold shadow-sm" disabled={loading}>
                                {loading ? (
                                    <span><span className="spinner-border spinner-border-sm me-2"></span>Đang xử lý...</span>
                                ) : (
                                    <span><i className="bi bi-check-circle-fill me-2"></i>XÁC NHẬN ĐĂNG KÝ</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                <div className="card-footer text-center bg-white py-3">
                    <span className="text-muted me-2">Đã có tài khoản?</span>
                    <Link to="/login" className="text-decoration-none fw-bold text-success">
                        Đăng nhập ngay <i className="bi bi-arrow-right"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;