import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const UserDashboard = () => {
    // Lấy thông tin người dùng đăng nhập
    const user = JSON.parse(localStorage.getItem('user')) || {};

    const [activeTab, setActiveTab] = useState('home'); // 'home' | 'nop-to-khai' | 'lich-su'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // --- STATE CHO FORM NỘP TỜ KHAI ---
    const [toKhai, setToKhai] = useState({
        cccd: user.cccd || '', // Tự điền CCCD của người đăng nhập
        hoTen: user.hoTen || '',
        diaChi: user.diaChi || '',
        loaiDat: 'ODT',
        dienTich: '',
        khuVuc: 'KV1' // Mặc định
    });

    // --- STATE CHO DANH SÁCH LỊCH SỬ ---
    const [myRecords, setMyRecords] = useState([]);

    // Helper: Format tiền
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    // Helper: Thông báo
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    // --- API: NỘP TỜ KHAI ---
    const handleSubmitToKhai = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // API: POST /api/hoso/nop-to-khai
            // Lưu ý: Cấu trúc Body phải khớp với HoSoInputDTO trong Java
            const payload = {
                ...toKhai,
                nguoiNopId: user.id // Gửi kèm ID người dùng
            };

            await axiosClient.post('/hoso/nop-to-khai', payload);
            
            showMessage('Nộp tờ khai thành công! Vui lòng chờ cán bộ duyệt.');
            // Reset form (trừ các thông tin cá nhân)
            setToKhai({ ...toKhai, dienTich: '', loaiDat: 'ODT' });
            setActiveTab('lich-su'); // Chuyển sang tab lịch sử để xem kết quả
        } catch (err) {
            showMessage(err.response?.data || 'Lỗi nộp hồ sơ', 'danger');
        } finally {
            setLoading(false);
        }
    };

    // --- API: LẤY LỊCH SỬ HỒ SƠ ---
    // Lưu ý: Bạn cần tạo API backend để lấy hồ sơ theo ID người dùng (VD: /api/hoso/canhan/{id})
    // Ở đây tôi giả lập việc lấy danh sách và filter phía client (nếu chưa có API riêng)
    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Tạm thời gọi API lấy danh sách chung (thực tế nên có API riêng cho user)
            const res = await axiosClient.get('/hoso/danh-sach');
            
            // Lọc ra hồ sơ của chính user này (Dựa vào CCCD hoặc ID)
            const myData = res.data.filter(item => item.cccd === user.cccd);
            setMyRecords(myData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Load lịch sử khi chuyển qua tab Lịch sử
    useEffect(() => {
        if (activeTab === 'lich-su') {
            fetchHistory();
        }
    }, [activeTab]);

    // Render Badge trạng thái
    const renderStatus = (status) => {
        switch (status) {
            case 'CHO_DUYET': return <span className="badge bg-warning text-dark"><i className="bi bi-hourglass-split"></i> Chờ xử lý</span>;
            case 'DA_DUYET': return <span className="badge bg-success"><i className="bi bi-check-circle"></i> Đã duyệt (Chờ đóng thuế)</span>;
            case 'BI_TU_CHOI': return <span className="badge bg-danger"><i className="bi bi-x-circle"></i> Bị từ chối</span>;
            default: return <span className="badge bg-secondary">{status}</span>;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="min-vh-100 bg-light">
            {/* --- HEADER --- */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
                <div className="container">
                    <span className="navbar-brand fw-bold text-uppercase d-flex align-items-center">
                        <img 
                            src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg" 
                            alt="Logo" 
                            className="me-2 rounded" 
                            style={{ height: '45px' }} // Chiều cao vừa phải cho navbar
                        />
                        Cổng Dịch Vụ Công
                    </span>
                    <div className="d-flex align-items-center text-white gap-3">
                        <div className="text-end d-none d-md-block">
                            <div className="fw-bold">{user.hoTen}</div>
                            <small style={{fontSize: '0.8rem'}}>Công dân (Chủ đất)</small>
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
                            <i className="bi bi-box-arrow-right"></i> Thoát
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container py-4">
                {/* Thông báo */}
                {message.text && (
                    <div className={`alert alert-${message.type} alert-dismissible fade show shadow-sm`}>
                        {message.text}
                        <button type="button" className="btn-close" onClick={() => setMessage({ text: '', type: '' })}></button>
                    </div>
                )}

                <div className="row">
                    {/* --- SIDEBAR MENU --- */}
                    <div className="col-lg-3 mb-4">
                        <div className="card shadow-sm border-0">
                            <div className="card-body p-2">
                                <div className="list-group list-group-flush">
                                    <button 
                                        className={`list-group-item list-group-item-action py-3 ${activeTab === 'home' ? 'active fw-bold' : ''}`}
                                        onClick={() => setActiveTab('home')}
                                    >
                                        <i className="bi bi-house-door me-2"></i> Trang Chủ
                                    </button>
                                    <button 
                                        className={`list-group-item list-group-item-action py-3 ${activeTab === 'nop-to-khai' ? 'active fw-bold' : ''}`}
                                        onClick={() => setActiveTab('nop-to-khai')}
                                    >
                                        <i className="bi bi-file-earmark-plus me-2"></i> Nộp Tờ Khai Mới
                                    </button>
                                    <button 
                                        className={`list-group-item list-group-item-action py-3 ${activeTab === 'lich-su' ? 'active fw-bold' : ''}`}
                                        onClick={() => setActiveTab('lich-su')}
                                    >
                                        <i className="bi bi-clock-history me-2"></i> Tra Cứu Hồ Sơ
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Card thông tin nhanh */}
                        <div className="card shadow-sm border-0 mt-3 bg-white">
                            <div className="card-body">
                                <h6 className="text-muted text-uppercase mb-3" style={{fontSize: '0.8rem'}}>Thông tin định danh</h6>
                                <p className="mb-1"><strong>Họ tên:</strong> {user.hoTen}</p>
                                <p className="mb-1"><strong>CCCD:</strong> {user.cccd}</p>
                                <p className="mb-0"><strong>Trạng thái:</strong> <span className="text-success">Đã xác thực</span></p>
                            </div>
                        </div>
                    </div>

                    {/* --- MAIN CONTENT --- */}
                    <div className="col-lg-9">
                        
                        {/* TAB 1: TRANG CHỦ */}
                        {activeTab === 'home' && (
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body text-center py-5">
                                    <img src="https://cdn-icons-png.flaticon.com/512/2666/2666505.png" alt="Welcome" width="100" className="mb-3 opacity-75" />
                                    <h3 className="text-primary">Xin chào, {user.hoTen}!</h3>
                                    <p className="text-muted mb-4">Chào mừng bạn đến với hệ thống quản lý thuế đất điện tử.</p>
                                    
                                    <div className="row justify-content-center g-3">
                                        <div className="col-md-5">
                                            <button className="btn btn-primary w-100 py-3 shadow-sm" onClick={() => setActiveTab('nop-to-khai')}>
                                                <i className="bi bi-file-earmark-arrow-up display-6 d-block mb-2"></i>
                                                Khai Báo Thuế Đất
                                            </button>
                                        </div>
                                        <div className="col-md-5">
                                            <button className="btn btn-outline-primary w-100 py-3 shadow-sm" onClick={() => setActiveTab('lich-su')}>
                                                <i className="bi bi-search display-6 d-block mb-2"></i>
                                                Tra Cứu Kết Quả
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: NỘP TỜ KHAI */}
                        {activeTab === 'nop-to-khai' && (
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white py-3 border-bottom">
                                    <h5 className="mb-0 text-primary"><i className="bi bi-pencil-square me-2"></i>Khai Báo Thông Tin Thửa Đất</h5>
                                </div>
                                <div className="card-body p-4">
                                    <form onSubmit={handleSubmitToKhai}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Họ và Tên chủ sở hữu</label>
                                                <input type="text" className="form-control bg-light" value={toKhai.hoTen} readOnly />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Số CCCD / Định danh</label>
                                                <input type="text" className="form-control bg-light" value={toKhai.cccd} readOnly />
                                            </div>
                                            
                                            <div className="col-12">
                                                <label className="form-label">Địa chỉ thửa đất <span className="text-danger">*</span></label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    placeholder="Số nhà, đường, phường/xã..." 
                                                    value={toKhai.diaChi}
                                                    onChange={(e) => setToKhai({...toKhai, diaChi: e.target.value})}
                                                    required 
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Loại đất <span className="text-danger">*</span></label>
                                                <select 
                                                    className="form-select" 
                                                    value={toKhai.loaiDat}
                                                    onChange={(e) => setToKhai({...toKhai, loaiDat: e.target.value})}
                                                >
                                                    <option value="ODT">ODT - Đất ở đô thị</option>
                                                    <option value="ONT">ONT - Đất ở nông thôn</option>
                                                    <option value="CLN">CLN - Cây lâu năm</option>
                                                    <option value="LUA">LUA - Đất trồng lúa</option>
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Diện tích (m²) <span className="text-danger">*</span></label>
                                                <input 
                                                    type="number" 
                                                    className="form-control" 
                                                    placeholder="VD: 100" 
                                                    value={toKhai.dienTich}
                                                    onChange={(e) => setToKhai({...toKhai, dienTich: e.target.value})}
                                                    required 
                                                    min="1"
                                                />
                                            </div>

                                            <div className="col-12 mt-4">
                                                <div className="alert alert-warning py-2 small">
                                                    <i className="bi bi-info-circle me-1"></i> 
                                                    Tôi cam kết thông tin kê khai là đúng sự thật và chịu trách nhiệm trước pháp luật.
                                                </div>
                                                <button type="submit" className="btn btn-success px-4" disabled={loading}>
                                                    {loading ? 'Đang gửi...' : <><i className="bi bi-send me-2"></i>Gửi Tờ Khai</>}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: LỊCH SỬ */}
                        {activeTab === 'lich-su' && (
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 text-primary"><i className="bi bi-clock-history me-2"></i>Lịch Sử Hồ Sơ Của Tôi</h5>
                                    <button className="btn btn-sm btn-outline-secondary" onClick={fetchHistory}><i className="bi bi-arrow-clockwise"></i> Làm mới</button>
                                </div>
                                <div className="card-body p-0">
                                    {loading ? (
                                        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="bg-light text-secondary">
                                                    <tr>
                                                        <th className="ps-3">Mã Hồ Sơ</th>
                                                        <th>Địa Chỉ Đất</th>
                                                        <th>Chi Tiết</th>
                                                        <th>Thuế Dự Kiến</th>
                                                        <th>Trạng Thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {myRecords.length > 0 ? myRecords.map(item => (
                                                        <tr key={item.id}>
                                                            <td className="ps-3 fw-bold">#{item.id}</td>
                                                            <td>{item.diaChi || 'Chưa cập nhật'}</td>
                                                            <td>
                                                                <span className="badge bg-light text-dark border me-1">{item.loaiDat}</span>
                                                                <small>{item.dienTich} m²</small>
                                                            </td>
                                                            <td className="fw-bold text-success">
                                                                {item.tongTienThue > 0 ? formatCurrency(item.tongTienThue) : 'Đang tính...'}
                                                            </td>
                                                            <td>
                                                                {renderStatus(item.trangThai)}
                                                                {item.trangThai === 'BI_TU_CHOI' && (
                                                                    <div className="small text-danger fst-italic mt-1">
                                                                        Lý do: {item.lyDoTuChoi || 'Thông tin chưa chính xác'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr><td colSpan="5" className="text-center py-5 text-muted">Bạn chưa nộp hồ sơ nào.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;