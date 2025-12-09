import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const AdminDashboard = () => {
    const navigate = useNavigate();
    
    // Lấy thông tin Admin đang đăng nhập
    const user = JSON.parse(localStorage.getItem('user')) || {};

    // State quản lý Tab hiển thị
    const [activeTab, setActiveTab] = useState('banggia'); // 'banggia' | 'canbo' | 'import' | 'system'
    const [message, setMessage] = useState({ text: '', type: '' });

    // --- STATE 1: BẢNG GIÁ ĐẤT ---
    const [giaDat, setGiaDat] = useState({ 
        loaiDat: 'ODT', 
        donGiaM2: 0, 
        thueSuat: 0.0005,
        khuVuc: 'KV1', // Giả sử có thêm trường khu vực, nếu không có bạn có thể bỏ
        namApDung: new Date().getFullYear()
    });

    // --- STATE 2: TẠO CÁN BỘ ---
    const [canBo, setCanBo] = useState({ tenDangNhap: '', hoTen: '', cccd: '' });

    // --- STATE 3: QUẢN LÝ ID (Xóa/Khóa) ---
    const [targetId, setTargetId] = useState('');

    // --- HÀM CHUNG ---
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const handleLogout = () => {
        if(window.confirm('Bạn muốn đăng xuất khỏi trang quản trị?')) {
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    // --- XỬ LÝ: CẬP NHẬT GIÁ ĐẤT ---
    const handleUpdateGiaDat = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/admin/banggia', giaDat);
            showMessage('Cập nhật bảng giá đất thành công!');
        } catch (err) {
            showMessage(err.response?.data || 'Lỗi cập nhật giá đất', 'danger');
        }
    };

    // --- XỬ LÝ: TẠO CÁN BỘ ---
    const handleCreateCanBo = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/admin/tao-can-bo', canBo);
            showMessage('Tạo tài khoản cán bộ thành công! Mật khẩu mặc định: 123456');
            setCanBo({ tenDangNhap: '', hoTen: '', cccd: '' }); // Reset form
        } catch (err) {
            showMessage(err.response?.data || 'Lỗi tạo cán bộ', 'danger');
        }
    };

    // --- XỬ LÝ: IMPORT EXCEL ---
    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axiosClient.post('/admin/import-dat-dai', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showMessage(res.data);
            e.target.value = null; // Reset input file
        } catch (err) {
            showMessage(err.response?.data || 'Lỗi import file', 'danger');
        }
    };

    // --- XỬ LÝ: KHÓA / XÓA ---
    const handleSystemAction = async (action) => {
        if (!targetId) return showMessage('Vui lòng nhập ID đối tượng', 'warning');
        
        // Confirm trước khi xóa
        if (action.includes('delete') && !window.confirm('Hành động này không thể hoàn tác. Bạn chắc chắn chứ?')) {
            return;
        }

        try {
            let res;
            if (action === 'deleteUser') {
                res = await axiosClient.delete(`/admin/nguoi-dung/${targetId}`);
            } else if (action === 'deleteLand') {
                res = await axiosClient.delete(`/admin/thua-dat/${targetId}`);
            } else if (action === 'lockUser') {
                res = await axiosClient.put(`/admin/nguoi-dung/${targetId}/khoa`);
            }
            showMessage(res.data);
            setTargetId('');
        } catch (err) {
            showMessage(err.response?.data || 'Thao tác thất bại', 'danger');
        }
    };

    return (
        <div className="container-fluid bg-light min-vh-100 py-3">
            <div className="container">
                {/* Header Admin */}
                <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 shadow-sm rounded">
                    <div>
                        <h4 className="text-danger fw-bold mb-0 d-flex align-items-center">
                            <img 
                                src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg" 
                                alt="Logo" 
                                className="me-3 rounded"
                                style={{ height: '55px' }}
                            />
                            <span>Trang Quản Trị Hệ Thống (Admin)</span>
                        </h4>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end">
                            <div className="fw-bold">{user.hoTen || 'Administrator'}</div>
                            <small className="text-muted">Role: {user.vaiTro}</small>
                        </div>
                        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                            <i className="bi bi-box-arrow-right"></i>
                        </button>
                    </div>
                </div>

                {/* Thông báo Global */}
                {message.text && (
                    <div className={`alert alert-${message.type} alert-dismissible fade show shadow-sm`} role="alert">
                        {message.text}
                        <button type="button" className="btn-close" onClick={() => setMessage({ text: '', type: '' })}></button>
                    </div>
                )}

                <div className="row">
                    {/* MENU BÊN TRÁI */}
                    <div className="col-md-3 mb-3">
                        <div className="list-group shadow-sm">
                            <button 
                                className={`list-group-item list-group-item-action py-3 ${activeTab === 'banggia' ? 'active' : ''}`}
                                onClick={() => setActiveTab('banggia')}
                            >
                                <i className="bi bi-currency-dollar me-2"></i> Cấu Hình Giá Đất
                            </button>
                            <button 
                                className={`list-group-item list-group-item-action py-3 ${activeTab === 'canbo' ? 'active' : ''}`}
                                onClick={() => setActiveTab('canbo')}
                            >
                                <i className="bi bi-person-plus-fill me-2"></i> Tạo Cán Bộ Mới
                            </button>
                            <button 
                                className={`list-group-item list-group-item-action py-3 ${activeTab === 'import' ? 'active' : ''}`}
                                onClick={() => setActiveTab('import')}
                            >
                                <i className="bi bi-file-earmark-spreadsheet me-2"></i> Import Dữ Liệu
                            </button>
                            <button 
                                className={`list-group-item list-group-item-action py-3 ${activeTab === 'system' ? 'active' : ''}`}
                                onClick={() => setActiveTab('system')}
                            >
                                <i className="bi bi-shield-lock me-2"></i> Quản Lý Tài Khoản
                            </button>
                        </div>
                    </div>

                    {/* NỘI DUNG BÊN PHẢI */}
                    <div className="col-md-9">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body p-4">
                                
                                {/* TAB 1: BẢNG GIÁ ĐẤT */}
                                {activeTab === 'banggia' && (
                                    <form onSubmit={handleUpdateGiaDat}>
                                        <h5 className="text-primary border-bottom pb-2 mb-3">Cập Nhật Bảng Giá Đất</h5>
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Loại Đất</label>
                                                <select className="form-select" value={giaDat.loaiDat} onChange={(e) => setGiaDat({...giaDat, loaiDat: e.target.value})}>
                                                    <option value="ODT">ODT - Đất ở đô thị</option>
                                                    <option value="ONT">ONT - Đất ở nông thôn</option>
                                                    <option value="CLN">CLN - Cây lâu năm</option>
                                                    <option value="LUA">LUA - Đất lúa</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Năm áp dụng</label>
                                                <input type="number" className="form-control" value={giaDat.namApDung} onChange={(e) => setGiaDat({...giaDat, namApDung: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Đơn giá quy định (VNĐ/m²)</label>
                                            <input type="number" className="form-control" value={giaDat.donGiaM2} onChange={(e) => setGiaDat({...giaDat, donGiaM2: e.target.value})} required />
                                            <div className="form-text">Giá này sẽ được dùng để tính thuế cho toàn bộ hệ thống.</div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Thuế suất (Dạng số thập phân)</label>
                                            <input type="number" step="0.0001" className="form-control" value={giaDat.thueSuat} onChange={(e) => setGiaDat({...giaDat, thueSuat: e.target.value})} required />
                                            <div className="form-text">Ví dụ: 0.05% nhập là 0.0005</div>
                                        </div>
                                        <button type="submit" className="btn btn-primary"><i className="bi bi-save me-2"></i>Cập nhật</button>
                                    </form>
                                )}

                                {/* TAB 2: TẠO CÁN BỘ */}
                                {activeTab === 'canbo' && (
                                    <form onSubmit={handleCreateCanBo}>
                                        <h5 className="text-primary border-bottom pb-2 mb-3">Cấp Tài Khoản Cán Bộ Thuế</h5>
                                        <div className="alert alert-info py-2">
                                            <small><i className="bi bi-info-circle me-1"></i> Mật khẩu mặc định sẽ là <b>123456</b></small>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Tên đăng nhập (Username)</label>
                                            <input type="text" className="form-control" value={canBo.tenDangNhap} onChange={(e) => setCanBo({...canBo, tenDangNhap: e.target.value})} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Họ và Tên Cán Bộ</label>
                                            <input type="text" className="form-control" value={canBo.hoTen} onChange={(e) => setCanBo({...canBo, hoTen: e.target.value})} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Số CCCD / Mã định danh</label>
                                            <input type="text" className="form-control" value={canBo.cccd} onChange={(e) => setCanBo({...canBo, cccd: e.target.value})} required />
                                        </div>
                                        <button type="submit" className="btn btn-success"><i className="bi bi-person-plus me-2"></i>Tạo tài khoản</button>
                                    </form>
                                )}

                                {/* TAB 3: IMPORT EXCEL */}
                                {activeTab === 'import' && (
                                    <div>
                                        <h5 className="text-primary border-bottom pb-2 mb-3">Import Dữ Liệu Đất Đai</h5>
                                        <div className="mb-4 text-center py-4 border rounded bg-light">
                                            <i className="bi bi-file-earmark-excel text-success display-4"></i>
                                            <p className="mt-2 text-muted">Chọn file Excel (.xlsx, .xls) chứa danh sách thửa đất</p>
                                            <input type="file" className="form-control w-50 mx-auto" accept=".xlsx, .xls" onChange={handleImportExcel} />
                                        </div>
                                        <div className="alert alert-warning">
                                            <strong>Lưu ý:</strong> File Excel cần đúng định dạng mẫu (Số tờ, Số thửa, Diện tích, Chủ sở hữu...).
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: QUẢN LÝ HỆ THỐNG */}
                                {activeTab === 'system' && (
                                    <div>
                                        <h5 className="text-danger border-bottom pb-2 mb-3">Vùng Nguy Hiểm (Admin Zone)</h5>
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">Nhập ID đối tượng (User ID hoặc Land ID):</label>
                                            <input type="number" className="form-control form-control-lg" placeholder="Nhập ID..." value={targetId} onChange={(e) => setTargetId(e.target.value)} />
                                        </div>
                                        
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <button className="btn btn-warning w-100 py-3" onClick={() => handleSystemAction('lockUser')}>
                                                    <div className="fs-4"><i className="bi bi-lock-fill"></i></div>
                                                    <div>Khóa Tài Khoản</div>
                                                </button>
                                            </div>
                                            <div className="col-md-4">
                                                <button className="btn btn-danger w-100 py-3" onClick={() => handleSystemAction('deleteUser')}>
                                                    <div className="fs-4"><i className="bi bi-person-x-fill"></i></div>
                                                    <div>Xóa Người Dùng</div>
                                                </button>
                                            </div>
                                            <div className="col-md-4">
                                                <button className="btn btn-outline-danger w-100 py-3" onClick={() => handleSystemAction('deleteLand')}>
                                                    <div className="fs-4"><i className="bi bi-house-x-fill"></i></div>
                                                    <div>Xóa Thửa Đất</div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;