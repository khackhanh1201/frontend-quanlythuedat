import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const TaxOfficerDashboard = () => {
    const navigate = useNavigate();
    
    // Lấy thông tin User đang đăng nhập từ LocalStorage
    const user = JSON.parse(localStorage.getItem('user')) || {};

    // State quản lý Tab
    const [activeTab, setActiveTab] = useState('stats');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // --- STATE DỮ LIỆU ---
    const [stats, setStats] = useState({
        tongSoHoSo: 0, tongTienThueDuKien: 0,
        soHoSoChoDuyet: 0, soHoSoDaDuyet: 0,
        soHoSoBiTuChoi: 0, soHoSoGianLan: 0
    });

    const [hoSoList, setHoSoList] = useState([]);

    // --- STATE MODAL ---
    const [actionData, setActionData] = useState({ id: null, type: null }); 
    const [reason, setReason] = useState('');

    // Helper: Format tiền tệ
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    // Helper: Thông báo
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    // Hàm Đăng xuất
    const handleLogout = () => {
        if(window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    // --- API CALLS ---
    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/thongke/baocao');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/hoso/danh-sach');
            setHoSoList(res.data);
        } catch (err) {
            showMessage('Lỗi tải danh sách hồ sơ', 'danger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'stats') fetchStats();
        if (activeTab === 'records') fetchRecords();
    }, [activeTab]);

    // --- XỬ LÝ DUYỆT / TỪ CHỐI ---
    const handleSubmitDecision = async () => {
        if (!actionData.id) return;
        const isApprove = actionData.type === 'approve';

        try {
            await axiosClient.post('/hoso/duyet', null, {
                params: {
                    id: actionData.id,
                    dongY: isApprove,
                    lyDo: reason
                }
            });
            showMessage(`Đã ${isApprove ? 'duyệt' : 'từ chối'} hồ sơ thành công!`);
            setActionData({ id: null, type: null }); 
            setReason('');
            // Load lại dữ liệu để cập nhật UI
            if (activeTab === 'records') fetchRecords();
            fetchStats(); 
        } catch (err) {
            showMessage(err.response?.data || 'Có lỗi xảy ra', 'danger');
        }
    };

    const openModal = (id, type) => {
        setActionData({ id, type });
        setReason(type === 'approve' ? 'Hồ sơ đầy đủ, hợp lệ.' : '');
    };

    // Helper: Render Badge trạng thái
    const renderStatus = (status) => {
        const map = {
            'CHO_DUYET': { text: 'Chờ duyệt', cls: 'bg-warning text-dark' },
            'DA_DUYET': { text: 'Đã duyệt', cls: 'bg-success' },
            'BI_TU_CHOI': { text: 'Từ chối', cls: 'bg-danger' },
            'GIAN_LAN': { text: 'Gian lận', cls: 'bg-dark' }
        };
        const s = map[status] || { text: status, cls: 'bg-secondary' };
        return <span className={`badge ${s.cls}`}>{s.text}</span>;
    };

    return (
        <div className="container-fluid bg-light min-vh-100 py-3">
            <div className="container">
                {/* Header: Hiển thị thông tin User & Nút Logout */}
                <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 shadow-sm rounded">
                    <div>
                        <h4 className="text-primary fw-bold mb-0 d-flex align-items-center">
                            <img 
                                src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg" 
                                alt="Logo" 
                                className="me-3 rounded" 
                                style={{ height: '55px' }} // To hơn một chút cho nổi bật
                            />
                            <span>Hệ Thống Quản Lý Thuế - Phân Hệ Cán Bộ</span>
                        </h4>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end">
                            <div className="fw-bold">{user.hoTen || 'Cán bộ'}</div>
                            <small className="text-muted">ID: {user.tenDangNhap}</small>
                        </div>
                        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                            <i className="bi bi-box-arrow-right me-1"></i> Đăng xuất
                        </button>
                    </div>
                </div>

                {/* Tabs & Navigation */}
                <div className="mb-4">
                    <div className="btn-group shadow-sm">
                        <button 
                            className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-white bg-white text-dark'}`}
                            onClick={() => setActiveTab('stats')}
                        >
                            <i className="bi bi-graph-up me-2"></i> Tổng Quan Thống Kê
                        </button>
                        <button 
                            className={`btn ${activeTab === 'records' ? 'btn-primary' : 'btn-white bg-white text-dark'}`}
                            onClick={() => setActiveTab('records')}
                        >
                            <i className="bi bi-list-task me-2"></i> Danh Sách Hồ Sơ
                        </button>
                    </div>
                </div>

                {/* Thông báo */}
                {message.text && (
                    <div className={`alert alert-${message.type} shadow-sm alert-dismissible fade show`}>
                        {message.text}
                    </div>
                )}

                {/* --- TAB 1: THỐNG KÊ (STATS) --- */}
                {activeTab === 'stats' && (
                    <div className="row g-3 fade-in">
                        <div className="col-md-3">
                            <div className="card text-white bg-primary h-100 shadow-sm border-0">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h6 className="card-title opacity-75 text-uppercase">Tổng Hồ Sơ</h6>
                                            <h2 className="fw-bold mb-0">{stats.tongSoHoSo}</h2>
                                        </div>
                                        <i className="bi bi-folder2-open fs-1 opacity-50"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card text-white bg-success h-100 shadow-sm border-0">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h6 className="card-title opacity-75 text-uppercase">Thuế Dự Kiến</h6>
                                            <h4 className="fw-bold mb-0">{formatCurrency(stats.tongTienThueDuKien)}</h4>
                                        </div>
                                        <i className="bi bi-cash-stack fs-1 opacity-50"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card text-dark bg-warning h-100 shadow-sm border-0" style={{backgroundColor: '#ffc107'}}>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h6 className="card-title opacity-75 text-uppercase">Chờ Duyệt</h6>
                                            <h2 className="fw-bold mb-0">{stats.soHoSoChoDuyet}</h2>
                                        </div>
                                        <i className="bi bi-hourglass-split fs-1 opacity-50"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card text-white bg-danger h-100 shadow-sm border-0">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h6 className="card-title opacity-75 text-uppercase">Từ chối / Gian lận</h6>
                                            <h2 className="fw-bold mb-0">{stats.soHoSoGianLan + stats.soHoSoBiTuChoi}</h2>
                                        </div>
                                        <i className="bi bi-exclamation-triangle fs-1 opacity-50"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: DANH SÁCH HỒ SƠ --- */}
                {activeTab === 'records' && (
                    <div className="card shadow-sm border-0 fade-in">
                        <div className="card-header bg-white py-3">
                            <h5 className="mb-0 text-secondary">Danh sách hồ sơ khai thuế cần xử lý</h5>
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light text-secondary">
                                            <tr>
                                                <th className="ps-3">Mã HS</th>
                                                <th>Người Nộp / CCCD</th>
                                                <th>Thông Tin Đất</th>
                                                <th>Thuế (VNĐ)</th>
                                                <th>Trạng Thái</th>
                                                <th className="text-end pe-4">Hành Động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hoSoList.length > 0 ? hoSoList.map(item => (
                                                <tr key={item.id}>
                                                    <td className="ps-3 fw-bold text-primary">#{item.id}</td>
                                                    <td>
                                                        <div className="fw-bold">{item.nguoiNop?.hoTen || 'N/A'}</div>
                                                        <small className="text-muted"><i className="bi bi-person-vcard"></i> {item.cccd}</small>
                                                    </td>
                                                    <td>
                                                        <div><span className="badge bg-light text-dark border">{item.loaiDat}</span></div>
                                                        <small className="text-muted">Diện tích: {item.dienTich} m²</small>
                                                    </td>
                                                    <td className="fw-bold text-success">
                                                        {formatCurrency(item.tongTienThue)}
                                                    </td>
                                                    <td>{renderStatus(item.trangThai)}</td>
                                                    <td className="text-end pe-4">
                                                        {item.trangThai === 'CHO_DUYET' ? (
                                                            <div className="btn-group" role="group">
                                                                <button 
                                                                    className="btn btn-sm btn-success"
                                                                    onClick={() => openModal(item.id, 'approve')}
                                                                    data-bs-toggle="modal" data-bs-target="#decisionModal"
                                                                    title="Chấp thuận hồ sơ"
                                                                >
                                                                    <i className="bi bi-check-lg"></i> Duyệt
                                                                </button>
                                                                <button 
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => openModal(item.id, 'reject')}
                                                                    data-bs-toggle="modal" data-bs-target="#decisionModal"
                                                                    title="Từ chối hồ sơ"
                                                                >
                                                                    <i className="bi bi-x-lg"></i> Từ chối
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted fst-italic small">Đã hoàn tất</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="6" className="text-center py-5 text-muted">Không có dữ liệu hiển thị.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL XỬ LÝ --- */}
            <div className="modal fade" id="decisionModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className={`modal-header text-white ${actionData.type === 'approve' ? 'bg-success' : 'bg-danger'}`}>
                            <h5 className="modal-title">
                                {actionData.type === 'approve' ? <><i className="bi bi-check-circle"></i> XÁC NHẬN DUYỆT</> : <><i className="bi bi-exclamation-circle"></i> XÁC NHẬN TỪ CHỐI</>}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <p>Bạn đang thao tác với hồ sơ mã số: <strong>#{actionData.id}</strong></p>
                            <div className="mb-3">
                                <label className="form-label fw-bold">
                                    {actionData.type === 'approve' ? 'Ghi chú phê duyệt (Tùy chọn):' : 'Lý do từ chối (Bắt buộc):'}
                                </label>
                                <textarea 
                                    className="form-control" 
                                    rows="3" 
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={actionData.type === 'approve' ? "Nhập ghi chú..." : "VD: Sai thông tin diện tích, thiếu giấy tờ..."}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy bỏ</button>
                            <button 
                                type="button" 
                                className={`btn ${actionData.type === 'approve' ? 'btn-success' : 'btn-danger'}`}
                                onClick={handleSubmitDecision}
                                data-bs-dismiss="modal"
                                disabled={actionData.type === 'reject' && !reason.trim()} // Bắt buộc nhập lý do nếu từ chối
                            >
                                Xác nhận {actionData.type === 'approve' ? 'Duyệt' : 'Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxOfficerDashboard;