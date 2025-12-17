import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AdminDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // --- STATE 1: DASHBOARD THỐNG KÊ ---
    const [stats, setStats] = useState({
        tongSoHoSo: 0, tongThuThue: 0, tongNoThue: 0,
        soHoSoChoDuyet: 0, soHoSoDaDuyet: 0, soHoSoGianLan: 0
    });
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    // --- STATE 2: QUẢN LÝ NGƯỜI DÙNG ---
    const [users, setUsers] = useState([]);
    const [userKeyword, setUserKeyword] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState(''); 
    
    // Modal tạo nhân viên
    const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
    const [newStaff, setNewStaff] = useState({ 
        hoTen: '', tenDangNhap: '', matKhau: '', maVaiTro: 2, soDinhDanh: '' 
    });

    // --- STATE 3: QUẢN LÝ ĐẤT ĐAI ---
    const [landPrice, setLandPrice] = useState({ 
        maKhuVuc: 1, maLoaiDat: 1, donGiaM2: '', trangThai: 'Hiệu lực',
        // 3 trường mới
        ngayBanHanh: '',       
        ngayHetHieuLuc: '',    
        soCongVanQuyDinh: ''   
    });
    const [importFile, setImportFile] = useState(null);
    
    // [MỚI] State danh sách đất và ID xóa nhanh
    const [lands, setLands] = useState([]);
    const [quickDeleteId, setQuickDeleteId] = useState('');

    // HELPER FORMAT
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    // =================================================
    // 1. API THỐNG KÊ
    // =================================================
    const fetchStats = async () => {
        try {
            const res = await axiosClient.get('/admin/thong-ke', { params: { nam: filterYear } });
            setStats(res.data);
        } catch (err) { console.error("Lỗi lấy thống kê:", err); }
    };

    // =================================================
    // 2. API NGƯỜI DÙNG
    // =================================================
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (userKeyword) params.keyword = userKeyword;
            if (userRoleFilter) params.vaiTro = userRoleFilter;
            const res = await axiosClient.get('/admin/nguoi-dung', { params });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            showMessage('Lỗi tải danh sách người dùng', 'danger');
        } finally { setLoading(false); }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newStaff, maVaiTro: parseInt(newStaff.maVaiTro) };
            await axiosClient.post('/admin/tao-nhan-vien', payload);
            showMessage('Tạo nhân viên thành công!', 'success');
            setShowCreateStaffModal(false);
            setNewStaff({ hoTen: '', tenDangNhap: '', matKhau: '', maVaiTro: 2, soDinhDanh: '' });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data || "Lỗi tạo nhân viên");
        }
    };

    const handleUserAction = async (maNguoiDung, action) => {
        if (!window.confirm(`Bạn có chắc chắn muốn thực hiện thao tác này?`)) return;
        try {
            let textAction = '';
            if (action === 'APPROVE') {
                await axiosClient.put(`/admin/nguoi-dung/${maNguoiDung}/phe-duyet`);
                setUsers(prev => prev.map(u => u.maNguoiDung === maNguoiDung ? { ...u, trangThai: true } : u));
                textAction = 'Phê duyệt';
            }
            if (action === 'LOCK') {
                await axiosClient.put(`/admin/nguoi-dung/${maNguoiDung}/khoa`);
                setUsers(prev => prev.map(u => u.maNguoiDung === maNguoiDung ? { ...u, trangThai: false } : u));
                textAction = 'Khóa tài khoản';
            }
            if (action === 'DELETE') {
                await axiosClient.delete(`/admin/nguoi-dung/${maNguoiDung}`);
                setUsers(prev => prev.filter(u => u.maNguoiDung !== maNguoiDung));
                textAction = 'Xóa';
            }
            showMessage(`Thao tác ${textAction} thành công!`, 'success');
        } catch (err) {
            showMessage(err.response?.data?.message || "Có lỗi xảy ra!", 'danger');
        }
    };

    // =================================================
    // 3. API QUẢN LÝ ĐẤT ĐAI
    // =================================================
    
    // [MỚI] Lấy danh sách thửa đất
    const fetchLands = async () => {
        try {
            // Giả định API Backend là GET /thua-dat
            const res = await axiosClient.get('/thua-dat'); 
            setLands(res.data);
        } catch (err) {
            console.error("Lỗi tải danh sách đất:", err);
        }
    };

    // [MỚI] Xóa thửa đất theo ID (Backend: @DeleteMapping("/thua-dat/{id}"))
    const handleDeleteLand = async (id) => {
        if (!id) return alert("Vui lòng nhập ID thửa đất!");
        if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa thửa đất ID: ${id}?\nDữ liệu không thể khôi phục!`)) return;

        try {
            await axiosClient.delete(`/thua-dat/${id}`);
            
            showMessage(`Đã xóa thành công thửa đất ID ${id}`, "success");
            
            // Cập nhật lại giao diện (Xóa khỏi danh sách và clear ô nhập nhanh)
            setLands(prev => prev.filter(item => item.maThuaDat != id));
            setQuickDeleteId(''); 
        } catch (err) {
            // Hiển thị lỗi từ backend (ví dụ: ràng buộc khóa ngoại)
            alert(err.response?.data || "Không thể xóa thửa đất (Có thể đang có hồ sơ liên quan).");
        }
    };

    const handleUpdateLandPrice = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                maKhuVuc: parseInt(landPrice.maKhuVuc),
                maLoaiDat: parseInt(landPrice.maLoaiDat),
                donGiaM2: parseFloat(landPrice.donGiaM2),
                trangThai: landPrice.trangThai,
                ngayBanHanh: landPrice.ngayBanHanh,
                ngayHetHieuLuc: landPrice.ngayHetHieuLuc || null,
                soCongVanQuyDinh: landPrice.soCongVanQuyDinh
            };
            await axiosClient.post('/admin/banggia', payload);
            showMessage('Cập nhật giá đất thành công!', 'success');
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi cập nhật giá");
        }
    };

    const handleImportExcel = async (e) => {
        e.preventDefault();
        if (!importFile) return alert("Vui lòng chọn file Excel!");
        try {
            const formData = new FormData();
            formData.append("file", importFile);
            const res = await axiosClient.post('/admin/import-dat-dai', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showMessage(res.data || "Import dữ liệu thành công!", 'success');
            setImportFile(null);
            fetchLands(); // Tải lại danh sách sau khi import
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi import file");
        }
    };

    // =================================================
    // EFFECT & RENDER
    // =================================================
    useEffect(() => {
        if (activeTab === 'dashboard') fetchStats();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'land') fetchLands(); // [MỚI] Tải danh sách đất khi vào tab này
    }, [activeTab, filterYear]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <div className="min-vh-100 bg-light">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
                <div className="container-fluid px-4">
                    <span className="navbar-brand fw-bold text-uppercase d-flex align-items-center">
                        <img src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg" alt="Logo" className="me-2 rounded" style={{ height: '45px' }} />
                        HỆ THỐNG QUẢN TRỊ
                    </span>
                    <div className="d-flex align-items-center text-white gap-3">
                        <span className="text-warning fw-bold">ADMIN: {user.hoTen}</span>
                        <button onClick={handleLogout} className="btn btn-outline-light btn-sm">Thoát</button>
                    </div>
                </div>
            </nav>

            <div className="d-flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
                {/* Sidebar */}
                <div className="bg-white border-end" style={{ width: '250px', minWidth: '250px' }}>
                    <div className="list-group list-group-flush mt-3">
                        <button className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'dashboard' ? 'active bg-dark' : ''}`} onClick={() => setActiveTab('dashboard')}>
                            <i className="bi bi-speedometer2 me-2"></i> Tổng Quan
                        </button>
                        <button className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'users' ? 'active bg-dark' : ''}`} onClick={() => setActiveTab('users')}>
                            <i className="bi bi-people me-2"></i> Quản Lý Người Dùng
                        </button>
                        <button className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'land' ? 'active bg-dark' : ''}`} onClick={() => setActiveTab('land')}>
                            <i className="bi bi-map me-2"></i> Dữ Liệu Đất Đai
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow-1 p-4">
                    {message.text && (
                        <div className={`alert alert-${message.type} alert-dismissible fade show shadow`} 
                            role="alert" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '300px' }}>
                            <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                            <strong>{message.text}</strong>
                            <button type="button" className="btn-close" onClick={() => setMessage({ text: '', type: '' })}></button>
                        </div>
                    )}

                    {/* --- TAB 1: DASHBOARD --- */}
                    {activeTab === 'dashboard' && (
                        <div>
                             <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold text-dark">Thống Kê Tổng Quan</h4>
                                <select className="form-select w-auto" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                                    <option value="2024">Năm 2024</option>
                                    <option value="2025">Năm 2025</option>
                                </select>
                            </div>
                            <div className="row g-4 mb-4">
                                <div className="col-md-4">
                                    <div className="card text-white bg-success h-100 shadow-sm">
                                        <div className="card-body">
                                            <h6 className="card-title text-uppercase opacity-75">Tổng Thu Thuế</h6>
                                            <h3 className="fw-bold">{formatCurrency(stats.tongThuThue)}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card text-white bg-danger h-100 shadow-sm">
                                        <div className="card-body">
                                            <h6 className="card-title text-uppercase opacity-75">Nợ Thuế</h6>
                                            <h3 className="fw-bold">{formatCurrency(stats.tongNoThue)}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card text-white bg-primary h-100 shadow-sm">
                                        <div className="card-body">
                                            <h6 className="card-title text-uppercase opacity-75">Tổng Hồ Sơ</h6>
                                            <h3 className="fw-bold">{stats.tongSoHoSo}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="card shadow-sm border-0 h-100">
                                        <div className="card-header bg-white fw-bold">Trạng Thái Hồ Sơ</div>
                                        <div className="card-body">
                                            <ul className="list-group list-group-flush">
                                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                                    Chờ duyệt <span className="badge bg-warning text-dark rounded-pill">{stats.soHoSoChoDuyet}</span>
                                                </li>
                                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                                    Đã duyệt <span className="badge bg-success rounded-pill">{stats.soHoSoDaDuyet}</span>
                                                </li>
                                                <li className="list-group-item d-flex justify-content-between align-items-center text-danger fw-bold">
                                                    Phát hiện gian lận <span className="badge bg-danger rounded-pill">{stats.soHoSoGianLan}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 2: QUẢN LÝ USER --- */}
                    {activeTab === 'users' && (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="fw-bold">Danh Sách Người Dùng</h4>
                                <button className="btn btn-primary" onClick={() => setShowCreateStaffModal(true)}>
                                    <i className="bi bi-person-plus-fill me-2"></i> Thêm Cán Bộ
                                </button>
                            </div>
                            <div className="row g-2 mb-3">
                                <div className="col-md-3">
                                    <select className="form-select" value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                                        <option value="">-- Tất cả vai trò --</option>
                                        <option value="CHU_DAT">Chủ đất (Dân)</option>
                                        <option value="CAN_BO">Cán bộ thuế</option>
                                    </select>
                                </div>
                                <div className="col-md-7">
                                    <input type="text" className="form-control" placeholder="Tìm tên hoặc số định danh..." 
                                        value={userKeyword} onChange={(e) => setUserKeyword(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-2">
                                    <button className="btn btn-outline-secondary w-100" onClick={fetchUsers}>Tìm Kiếm</button>
                                </div>
                            </div>
                            <div className="card shadow-sm border-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Thông Tin</th>
                                                <th>CCCD</th>
                                                <th>Vai Trò</th>
                                                <th>Trạng Thái</th>
                                                <th className="text-end">Hành Động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.maNguoiDung}>
                                                    <td>#{u.maNguoiDung}</td>
                                                    <td>
                                                        <div className="fw-bold">{u.hoTen}</div>
                                                        <small className="text-muted">{u.tenDangNhap}</small>
                                                    </td>
                                                    <td>{u.soDinhDanh}</td>
                                                    <td><span className="badge bg-info text-dark">{u.getVaiTro || u.vaiTro}</span></td>
                                                    <td>{u.trangThai ? <span className="badge bg-success">Hoạt động</span> : <span className="badge bg-warning text-dark">Chờ duyệt / Khóa</span>}</td>
                                                    <td className="text-end">
                                                        {!u.trangThai && <button className="btn btn-sm btn-success me-1" onClick={() => handleUserAction(u.maNguoiDung, 'APPROVE')} title="Phê duyệt"><i className="bi bi-check-lg"></i></button>}
                                                        {u.trangThai && <button className="btn btn-sm btn-warning me-1" onClick={() => handleUserAction(u.maNguoiDung, 'LOCK')} title="Khóa tài khoản"><i className="bi bi-lock-fill"></i></button>}
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleUserAction(u.maNguoiDung, 'DELETE')} title="Xóa người dùng"><i className="bi bi-trash-fill"></i></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 3: DỮ LIỆU ĐẤT ĐAI --- */}
                    {activeTab === 'land' && (
                        <div>
                            <h4 className="fw-bold mb-4">Cấu Hình & Dữ Liệu Đất Đai</h4>
                            
                            {/* [MỚI] PHẦN XÓA NHANH BẰNG ID */}
                            <div className="card shadow-sm border-0 mb-4 bg-danger bg-opacity-10">
                                <div className="card-body d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 className="fw-bold text-danger mb-1"><i className="bi bi-trash"></i> Xóa Nhanh Thửa Đất</h6>
                                        <small className="text-muted">Nhập ID thửa đất để xóa trực tiếp (Hành động này không thể hoàn tác)</small>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            placeholder="Nhập ID (VD: 10)" 
                                            value={quickDeleteId}
                                            onChange={(e) => setQuickDeleteId(e.target.value)}
                                            style={{width: '200px'}}
                                        />
                                        <button 
                                            className="btn btn-danger text-nowrap"
                                            onClick={() => handleDeleteLand(quickDeleteId)}
                                        >
                                            Xóa Ngay
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* [GIỮ NGUYÊN] KHU VỰC CẤU HÌNH & IMPORT */}
                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <div className="card shadow-sm border-0 h-100">
                                        <div className="card-header bg-primary text-white"><h5 className="mb-0">1. Cập Nhật Bảng Giá Đất</h5></div>
                                        <div className="card-body">
                                            <form onSubmit={handleUpdateLandPrice}>
                                                <div className="row">
                                                    <div className="col-6 mb-3"><label className="form-label">Khu Vực (ID)</label><input type="number" className="form-control" value={landPrice.maKhuVuc} onChange={(e) => setLandPrice({...landPrice, maKhuVuc: e.target.value})} required /></div>
                                                    <div className="col-6 mb-3"><label className="form-label">Loại Đất (ID)</label><input type="number" className="form-control" value={landPrice.maLoaiDat} onChange={(e) => setLandPrice({...landPrice, maLoaiDat: e.target.value})} required /></div>
                                                </div>
                                                <div className="mb-3"><label className="form-label">Đơn Giá (VNĐ/m²)</label><input type="number" className="form-control" value={landPrice.donGiaM2} onChange={(e) => setLandPrice({...landPrice, donGiaM2: e.target.value})} required /></div>
                                                <div className="mb-3"><label className="form-label">Số Công Văn Quy Định</label><input type="text" className="form-control" value={landPrice.soCongVanQuyDinh} onChange={(e) => setLandPrice({...landPrice, soCongVanQuyDinh: e.target.value})} placeholder="VD: 123/QD-UBND" required /></div>
                                                <div className="row mb-3">
                                                    <div className="col-6"><label className="form-label">Ngày Ban Hành</label><input type="date" className="form-control" value={landPrice.ngayBanHanh} onChange={(e) => setLandPrice({...landPrice, ngayBanHanh: e.target.value})} required /></div>
                                                    <div className="col-6"><label className="form-label">Ngày Hết Hiệu Lực</label><input type="date" className="form-control" value={landPrice.ngayHetHieuLuc} onChange={(e) => setLandPrice({...landPrice, ngayHetHieuLuc: e.target.value})} /></div>
                                                </div>
                                                <button type="submit" className="btn btn-primary w-100">Lưu Cấu Hình</button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card shadow-sm border-0 h-100">
                                        <div className="card-header bg-success text-white"><h5 className="mb-0">2. Import Dữ Liệu Đất (Excel)</h5></div>
                                        <div className="card-body">
                                            <div className="alert alert-info small"><i className="bi bi-info-circle me-2"></i> Hệ thống hỗ trợ file .xlsx</div>
                                            <form onSubmit={handleImportExcel}>
                                                <div className="mb-3">
                                                    <label className="form-label">Chọn File Excel</label>
                                                    <input type="file" className="form-control" accept=".xlsx, .xls" onChange={(e) => setImportFile(e.target.files[0])} required />
                                                </div>
                                                <button type="submit" className="btn btn-success w-100"><i className="bi bi-upload me-2"></i> Tải Lên & Xử Lý</button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* [MỚI] MỤC 3: DANH SÁCH THỬA ĐẤT */}
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 text-primary fw-bold"><i className="bi bi-list-ul"></i> 3. Danh Sách Thửa Đất Hiện Có</h5>
                                    <button className="btn btn-sm btn-outline-primary" onClick={fetchLands}><i className="bi bi-arrow-clockwise"></i> Tải lại</button>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Số Tờ / Số Thửa</th>
                                                <th>Diện Tích</th>
                                                <th>Địa Chỉ</th>
                                                <th>Chủ Sở Hữu</th>
                                                <th className="text-end">Hành Động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lands.length > 0 ? lands.map(item => (
                                                <tr key={item.maThuaDat}>
                                                    <td>#{item.maThuaDat}</td>
                                                    <td className="fw-bold text-primary">Tờ {item.soTo} / Thửa {item.soThua}</td>
                                                    <td>{item.dienTich} m²</td>
                                                    <td>{item.diaChi}</td>
                                                    <td>{item.maChuSoHuu ? `ID: ${item.maChuSoHuu}` : <span className="text-muted fst-italic">--</span>}</td>
                                                    <td className="text-end">
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger" 
                                                            title="Xóa thửa đất này"
                                                            onClick={() => handleDeleteLand(item.maThuaDat)}
                                                        >
                                                            <i className="bi bi-trash-fill me-1"></i> Xóa
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-4 text-muted">Chưa có dữ liệu thửa đất.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: TẠO NHÂN VIÊN */}
            {showCreateStaffModal && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Tạo Tài Khoản Cán Bộ</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateStaffModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form id="createStaffForm" onSubmit={handleCreateStaff}>
                                    <div className="mb-2"><label className="form-label">Họ Tên</label><input type="text" className="form-control" required value={newStaff.hoTen} onChange={(e) => setNewStaff({...newStaff, hoTen: e.target.value})} /></div>
                                    <div className="mb-2"><label className="form-label">Tên Đăng Nhập</label><input type="text" className="form-control" required value={newStaff.tenDangNhap} onChange={(e) => setNewStaff({...newStaff, tenDangNhap: e.target.value})} /></div>
                                    <div className="mb-2"><label className="form-label">Số Định Danh (CCCD)</label><input type="text" className="form-control" required value={newStaff.soDinhDanh} onChange={(e) => setNewStaff({...newStaff, soDinhDanh: e.target.value})} /></div>
                                    <div className="mb-2"><label className="form-label">Mật Khẩu</label><input type="password" className="form-control" required value={newStaff.matKhau} onChange={(e) => setNewStaff({...newStaff, matKhau: e.target.value})} /></div>
                                    <div className="mb-3">
                                        <label className="form-label">Vai Trò</label>
                                        <select className="form-select" value={newStaff.maVaiTro} onChange={(e) => setNewStaff({...newStaff, maVaiTro: e.target.value})}>
                                            <option value="2">Cán Bộ Thuế (Mã 2)</option>
                                            <option value="3">QL Đất Đai (Mã 3)</option>
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateStaffModal(false)}>Hủy</button>
                                <button type="submit" form="createStaffForm" className="btn btn-primary">Tạo Mới</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;