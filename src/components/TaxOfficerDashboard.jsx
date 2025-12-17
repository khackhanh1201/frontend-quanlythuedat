import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const TaxOfficerDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    
    // --- STATE QUẢN LÝ ---
    const [hoSoList, setHoSoList] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // State Modal Duyệt/Từ chối
    const [decisionModal, setDecisionModal] = useState({ 
        show: false, 
        id: null, 
        type: null // 'approve' | 'reject'
    });
    const [reason, setReason] = useState('');

    // State Modal Lịch sử
    const [logModal, setLogModal] = useState({ show: false, logs: [] });

    // Format tiền & ngày
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleString('vi-VN') : '---';

    // ---------------------------------------------
    // 1. TẢI DANH SÁCH (API 2.2)
    // Endpoint: /api/hoso/danh-sach
    // ---------------------------------------------
    const fetchRecords = async () => {
        setLoading(true);
        try {
            // SỬA: Bỏ /api ở đầu
            const res = await axiosClient.get('/hoso/danh-sach');
            setHoSoList(res.data);
        } catch (err) {
            console.error("Lỗi tải danh sách:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    // ---------------------------------------------
    // 2. DUYỆT / TỪ CHỐI HỒ SƠ (API 2.4)
    // Endpoint: /api/hoso/duyet?id=...&dongY=...&lyDo=...
    // ---------------------------------------------
    const handleSubmitDecision = async () => {
        if (!decisionModal.id) return;
        const isApprove = decisionModal.type === 'approve';

        // Nếu từ chối mà không có lý do -> Bắt buộc nhập
        if (!isApprove && !reason.trim()) {
            alert("Vui lòng nhập lý do từ chối!");
            return;
        }

        try {
            // SỬA: Bỏ /api ở đầu. Body để null, gửi params qua query string
            await axiosClient.post('/hoso/duyet', null, {
                params: {
                    id: decisionModal.id,
                    dongY: isApprove,
                    lyDo: reason
                }
            });

            alert(`Đã ${isApprove ? 'duyệt' : 'từ chối'} hồ sơ thành công!`);
            
            // Reset và reload
            setDecisionModal({ show: false, id: null, type: null });
            setReason('');
            fetchRecords(); 

        } catch (err) {
            alert(err.response?.data?.error || err.response?.data || "Có lỗi xảy ra khi xử lý.");
        }
    };

    // ---------------------------------------------
    // 3. XUẤT EXCEL (API 2.7)
    // Endpoint: /api/hoso/xuat-excel
    // ---------------------------------------------
    const handleExportExcel = async () => {
        try {
            // SỬA: Bỏ /api ở đầu. responseType 'blob' để nhận file
            const response = await axiosClient.get('/hoso/xuat-excel', {
                responseType: 'blob',
            });

            // Tạo link ảo để download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `baocao_thue_${new Date().getTime()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert("Lỗi xuất file Excel!");
            console.error(err);
        }
    };

    // ---------------------------------------------
    // 4. XEM LỊCH SỬ XỬ LÝ (API 2.6)
    // Endpoint: /api/hoso/{id}/lich-su-xu-ly
    // ---------------------------------------------
    const handleViewLog = async (id) => {
        try {
            // SỬA: Bỏ /api ở đầu
            const res = await axiosClient.get(`/hoso/${id}/lich-su-xu-ly`);
            setLogModal({ show: true, logs: res.data });
        } catch (err) {
            alert("Không tải được lịch sử.");
        }
    };

    // Helper render trạng thái (Badge)
    const renderStatus = (status) => {
        const map = {
            'CHO_DUYET': { text: 'Chờ duyệt', cls: 'bg-warning text-dark' },
            'DA_DUYET': { text: 'Đã duyệt', cls: 'bg-success' },
            'DA_NOP_TIEN': { text: 'Hoàn thành', cls: 'bg-primary' },
            'BI_TU_CHOI': { text: 'Bị từ chối', cls: 'bg-danger' },
            'CANH_BAO_GIAN_LAN': { text: 'Cảnh báo gian lận', cls: 'bg-dark text-warning border border-warning' }
        };
        const s = map[status] || { text: status, cls: 'bg-secondary' };
        
        return (
            <div className="d-flex align-items-center">
                <span className={`badge ${s.cls} me-2`}>{s.text}</span>
                {status === 'CANH_BAO_GIAN_LAN' && <i className="bi bi-exclamation-triangle-fill text-danger animate-blink" title="Cần kiểm tra kỹ!"></i>}
            </div>
        );
    };

    return (
        <div className="min-vh-100 bg-light">
            {/* Header */}
            <div className="bg-white shadow-sm p-3 mb-4 border-bottom">
                <div className="container d-flex justify-content-between align-items-center">
                    <h4 className="text-primary mb-0 d-flex align-items-center">
                        <i className="bi bi-person-badge-fill me-2 fs-3"></i>
                        Hệ Thống Thuế - Phân Hệ Cán Bộ
                    </h4>
                    <div className="d-flex align-items-center">
                        <span className="me-3 fw-bold text-dark">CB: {user.hoTen}</span>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => {localStorage.removeItem('user'); navigate('/login');}}>
                            <i className="bi bi-box-arrow-right"></i> Đăng xuất
                        </button>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Toolbar */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-secondary mb-0 fw-bold">Danh sách hồ sơ chờ xử lý</h5>
                    <div className="d-flex gap-2">
                        <button className="btn btn-success shadow-sm" onClick={handleExportExcel}>
                            <i className="bi bi-file-earmark-excel me-2"></i> Xuất Excel
                        </button>
                        <button className="btn btn-primary shadow-sm" onClick={fetchRecords} disabled={loading}>
                            <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin' : ''}`}></i> 
                            {loading ? 'Đang tải...' : 'Làm mới'}
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="card shadow-sm border-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="ps-3">ID</th>
                                    <th>Người Nộp / CCCD</th>
                                    <th>Thông Tin Đất</th>
                                    <th>Thuế Dự Kiến</th>
                                    <th>Trạng Thái</th>
                                    <th className="text-end pe-4">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hoSoList.length > 0 ? hoSoList.map(item => (
                                    <tr key={item.maHoSo || item.id} className={item.trangThai === 'CANH_BAO_GIAN_LAN' ? 'table-warning' : ''}>
                                        <td className="ps-3 fw-bold">#{item.maHoSo || item.id}</td>
                                        <td>
                                            {/* Note: Backend cần trả về object nguoiNop hoặc map fields tương ứng */}
                                            <div className="fw-bold">{item.maNguoiKhai} (Mã User)</div>
                                        </td>
                                        <td>
                                            <div className="small">Mã Đất: <strong>{item.maThuaDat}</strong></div>
                                            <div className="small">DT Khai báo: <strong>{item.dienTichKhaiBao} m²</strong></div>
                                            <div className="badge bg-light text-dark border">{item.mucDichSuDungKhaiBao}</div>
                                        </td>
                                        <td className="fw-bold text-success">
                                            {item.soTienPhaiNop ? formatCurrency(item.soTienPhaiNop) : '---'}
                                        </td>
                                        <td>
                                            {renderStatus(item.trangThai)}
                                            {item.ghiChuCanBo && <div className="text-muted small fst-italic mt-1" style={{fontSize: '0.75rem', maxWidth: '150px'}}>{item.ghiChuCanBo}</div>}
                                        </td>
                                        <td className="text-end pe-4">
                                            <button className="btn btn-sm btn-outline-secondary me-2" title="Xem lịch sử" onClick={() => handleViewLog(item.maHoSo || item.id)}>
                                                <i className="bi bi-clock-history"></i>
                                            </button>

                                            {/* Chỉ hiển thị nút Duyệt/Từ chối nếu trạng thái là CHO_DUYET hoặc CANH_BAO_GIAN_LAN */}
                                            {['CHO_DUYET', 'CANH_BAO_GIAN_LAN'].includes(item.trangThai) ? (
                                                <>
                                                    <button className="btn btn-sm btn-success me-1" title="Duyệt"
                                                        onClick={() => {
                                                            setDecisionModal({ show: true, id: item.maHoSo || item.id, type: 'approve' });
                                                            setReason('Hồ sơ hợp lệ, đủ điều kiện đóng thuế.');
                                                        }}>
                                                        <i className="bi bi-check-lg"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-danger" title="Từ chối"
                                                        onClick={() => {
                                                            setDecisionModal({ show: true, id: item.maHoSo || item.id, type: 'reject' });
                                                            setReason('');
                                                        }}>
                                                        <i className="bi bi-x-lg"></i>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-muted small fst-italic"><i className="bi bi-lock-fill"></i> Đã xử lý</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" className="text-center py-5 text-muted">Không có hồ sơ nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL: DUYỆT / TỪ CHỐI */}
            {decisionModal.show && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className={`modal-header text-white ${decisionModal.type === 'approve' ? 'bg-success' : 'bg-danger'}`}>
                                <h5 className="modal-title">
                                    {decisionModal.type === 'approve' ? 'Xác Nhận Duyệt Hồ Sơ' : 'Xác Nhận Từ Chối Hồ Sơ'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setDecisionModal({ show: false, id: null, type: null })}></button>
                            </div>
                            <div className="modal-body">
                                <p>Đang xử lý hồ sơ ID: <strong>#{decisionModal.id}</strong></p>
                                <label className="form-label fw-bold">Ghi chú cán bộ (Lý do):</label>
                                <textarea className="form-control" rows="4" 
                                    placeholder={decisionModal.type === 'approve' ? "Nhập ghi chú (không bắt buộc)..." : "Nhập lý do từ chối (Bắt buộc)..."}
                                    value={reason} onChange={(e) => setReason(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setDecisionModal({ show: false, id: null, type: null })}>Hủy bỏ</button>
                                <button type="button" className={`btn ${decisionModal.type === 'approve' ? 'btn-success' : 'btn-danger'}`} onClick={handleSubmitDecision}>
                                    {decisionModal.type === 'approve' ? 'Xác Nhận Duyệt' : 'Xác Nhận Từ Chối'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: LỊCH SỬ LOG */}
            {logModal.show && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Nhật Ký Xử Lý Hồ Sơ</h5>
                                <button type="button" className="btn-close" onClick={() => setLogModal({ show: false, logs: [] })}></button>
                            </div>
                            <div className="modal-body bg-light" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                                {logModal.logs.length > 0 ? (
                                    <div className="timeline">
                                        {logModal.logs.map((log, idx) => (
                                            <div key={idx} className="card mb-2 border-0 shadow-sm">
                                                <div className="card-body py-2">
                                                    <div className="d-flex justify-content-between">
                                                        <strong className="text-primary">{log.trangThaiDen}</strong>
                                                        <small className="text-muted">{formatDate(log.thoiGianXuLy)}</small>
                                                    </div>
                                                    <p className="mb-0 small">{log.ghiChu}</p>
                                                    <small className="text-muted fst-italic">Người xử lý ID: {log.maCanBo}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted py-4">Chưa có lịch sử ghi nhận.</div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setLogModal({ show: false, logs: [] })}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxOfficerDashboard;