import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const UserDashboard = () => {
    // Get user info from localStorage (simulated or real login)
    const user = JSON.parse(localStorage.getItem('user')) || {
        hoTen: 'Developer Test',
        cccd: '000000000000',
        trangThai: 'Đã xác thực'
    };
    
    const [activeTab, setActiveTab] = useState('home'); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // --- STATE 1: LAND PLANNING LOOKUP ---
    const [searchParams, setSearchParams] = useState({ soTo: '', soThua: '' });
    const [searchResult, setSearchResult] = useState(null);

    // --- STATE 2: SUBMIT TAX DECLARATION (MULTIPART) ---
    const [ownedLands, setOwnedLands] = useState([]);
    const [toKhai, setToKhai] = useState({
        maThuaDat: '',
        dienTichKhaiBao: '',
        mucDichSuDungKhaiBao: 'ODT',
        namKhaiThue: new Date().getFullYear()
    });
    const [toKhaiFile, setToKhaiFile] = useState(null);

    // --- STATE 3: MANAGE RECORDS & LOGS & PAYMENT ---
    const [myRecords, setMyRecords] = useState([]);
    const [logModal, setLogModal] = useState({ show: false, logs: [] });
    
    // --- STATE 4: COMPLAINT ---
    const [complaintModal, setComplaintModal] = useState({ show: false, maHoSo: null });
    const [complaintText, setComplaintText] = useState('');
    const [complaintFile, setComplaintFile] = useState(null);

    // HELPER FORMAT
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleString('vi-VN') : '---';
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    // ===========================
    // 1. TRA CỨU QUY HOẠCH (API 2.2)
    // ===========================
    const handleTraCuuQuyHoach = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearchResult(null);
        try {
            const res = await axiosClient.get('/thuadat/tra-cuu', {
                params: { soTo: searchParams.soTo, soThua: searchParams.soThua }
            });
            setSearchResult(res.data);
        } catch (err) {
            setSearchResult(null);
            showMessage('Không tìm thấy thửa đất này!', 'danger');
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of the API functions: fetchOwnedLands, handleSubmitToKhai, etc. remain the same) ...
    // ===========================
    // 2. NỘP TỜ KHAI (API 2.3 - MULTIPART)
    // ===========================
    const fetchOwnedLands = async () => {
        try {
            const res = await axiosClient.get('/thuadat/cua-toi', { params: { maChuSoHuu: user.id } });
            setOwnedLands(res.data);
        } catch (err) { console.error(err); }
    };

    // ===========================
    // 2. NỘP TỜ KHAI (API 2.3 - MULTIPART)
    // ===========================
    const handleSubmitToKhai = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            
            // 1. Data JSON
            const dataPayload = {
                maNguoiDung: user.id,
                maThuaDat: parseInt(toKhai.maThuaDat),
                dienTichKhaiBao: parseFloat(toKhai.dienTichKhaiBao),
                mucDichSuDungKhaiBao: toKhai.mucDichSuDungKhaiBao,
                namKhaiThue: parseInt(toKhai.namKhaiThue)
            };

            // --- SỬA ĐỔI QUAN TRỌNG TẠI ĐÂY ---
            // Backend (Java/Spring) thường yêu cầu JSON part phải có Content-Type là application/json
            // Nếu chỉ dùng JSON.stringify(), nó sẽ gửi dạng text/plain => Lỗi 415 hoặc 400
            const jsonBlob = new Blob([JSON.stringify(dataPayload)], {
                type: 'application/json'
            });
            formData.append("data", jsonBlob); 
            // ----------------------------------

            // 2. File đính kèm (nếu có)
            if (toKhaiFile) {
                formData.append("file", toKhaiFile);
            }

            // --- THÊM HEADER CONFIG ---
            const res = await axiosClient.post('/hoso/nop-to-khai', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Xử lý response
            const { maHoSo, trangThai, thongBao } = res.data;
            if (trangThai === 'CANH_BAO_GIAN_LAN') {
                showMessage(`⚠️ ${thongBao}`, 'warning');
            } else {
                showMessage(`✅ Nộp thành công! Mã hồ sơ: #${maHoSo}`, 'success');
                // Reset form
                setToKhai({ ...toKhai, dienTichKhaiBao: '', maThuaDat: '' });
                setToKhaiFile(null);
                // Reset input file bằng cách clear value của thẻ input (nếu cần thiết dùng ref)
                document.querySelector('input[type="file"]').value = ""; 
            }
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data?.error || err.message || 'Lỗi nộp hồ sơ', 'danger');
        } finally {
            setLoading(false);
        }
    };

    // ===========================
    // 3. LỊCH SỬ & LOG (API 2.5, 2.6)
    // ===========================
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/hoso/danh-sach');
            // Filter user hiện tại (Logic tạm thời phía client)
            const myData = res.data.filter(item => item.maNguoiKhai === user.id);
            setMyRecords(myData);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleViewLog = async (id) => {
        try {
            const res = await axiosClient.get(`/hoso/${id}/lich-su-xu-ly`);
            setLogModal({ show: true, logs: res.data });
        } catch (err) { alert("Không tải được lịch sử"); }
    };

    const handlePayment = async (id) => {
        if (!window.confirm("Xác nhận thanh toán thuế cho hồ sơ này?")) return;
        try {
            await axiosClient.post(`/hoso/${id}/thanh-toan`);
            showMessage("Thanh toán thành công!", "success");
            fetchHistory(); // Reload lại để cập nhật trạng thái
        } catch (err) {
            alert(err.response?.data || "Lỗi thanh toán");
        }
    };

    // ===========================
    // 4. KHIẾU NẠI (API 2.7 - MULTIPART)
    // ===========================
    const handleSubmitComplaint = async () => {
        if (!complaintText) return alert("Vui lòng nhập nội dung!");
        try {
            const formData = new FormData();
            const dataPayload = {
                maHoSo: complaintModal.maHoSo,
                maNguoiGui: user.id,
                noiDung: complaintText
            };
            formData.append("data", JSON.stringify(dataPayload));
            if (complaintFile) formData.append("file", complaintFile);

            await axiosClient.post('/hoso/khieu-nai', formData);
            alert("Gửi khiếu nại thành công!");
            setComplaintModal({ show: false, maHoSo: null });
            setComplaintText('');
            setComplaintFile(null);
        } catch (err) {
            alert(err.response?.data?.error || "Lỗi gửi khiếu nại");
        }
    };

    useEffect(() => {
        if (activeTab === 'nop-to-khai') fetchOwnedLands();
        if (activeTab === 'lich-su') fetchHistory();
    }, [activeTab]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const renderStatus = (status) => {
        const map = {
            'CHO_DUYET': { text: 'Chờ duyệt', cls: 'bg-primary' },
            'DA_DUYET': { text: 'Chờ đóng tiền', cls: 'bg-info text-dark' },
            'DA_NOP_TIEN': { text: 'Hoàn thành', cls: 'bg-success' },
            'CANH_BAO_GIAN_LAN': { text: 'Cảnh báo gian lận', cls: 'bg-warning text-dark' },
            'BI_TU_CHOI': { text: 'Bị từ chối', cls: 'bg-danger' }
        };
        const s = map[status] || { text: status, cls: 'bg-secondary' };
        return <span className={`badge ${s.cls}`}>{s.text}</span>;
    };

    return (
        <div className="min-vh-100 bg-light">
            {/* Header */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
                <div className="container">
                    <span className="navbar-brand fw-bold text-uppercase d-flex align-items-center">
                        <img src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg" alt="Logo" className="me-2 rounded" style={{ height: '45px' }} />
                        Cổng Dịch Vụ Công
                    </span>
                    <div className="d-flex align-items-center text-white gap-3">
                        <button onClick={handleLogout} className="btn btn-outline-light btn-sm"><i className="bi bi-box-arrow-right"></i> Thoát</button>
                    </div>
                </div>
            </nav>

            <div className="container py-4">
                {message.text && (
                    <div className={`alert alert-${message.type} alert-dismissible fade show shadow-sm`}>
                        {message.text}
                        <button type="button" className="btn-close" onClick={() => setMessage({ text: '', type: '' })}></button>
                    </div>
                )}

                <div className="row">
                    {/* MENU & INFO CARD */}
                    <div className="col-lg-3 mb-4">
                        {/* 1. IDENTITY INFO CARD */}
                        <div className="card shadow-sm border-0 mb-3">
                            <div className="card-body">
                                <h6 className="text-uppercase text-muted mb-3" style={{ fontSize: '0.85rem' }}>THÔNG TIN ĐỊNH DANH</h6>
                                <p className="mb-1"><strong>Họ tên:</strong> {user.hoTen}</p>
                                <p className="mb-1"><strong>CCCD:</strong> {user.cccd}</p>
                                <p className="mb-0"><strong>Trạng thái:</strong> <span className="text-success">{user.trangThai || 'Đã xác thực'}</span></p>
                            </div>
                        </div>

                        {/* Navigation Menu */}
                        <div className="card shadow-sm border-0">
                            <div className="card-body p-2">
                                <div className="list-group list-group-flush">
                                    <button className={`list-group-item list-group-item-action py-3 ${activeTab === 'home' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('home')}>
                                        <i className="bi bi-house-door me-2"></i> Trang Chủ
                                    </button>
                                    <button className={`list-group-item list-group-item-action py-3 ${activeTab === 'tra-cuu' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('tra-cuu')}>
                                        <i className="bi bi-map me-2"></i> Tra Cứu Quy Hoạch
                                    </button>
                                    <button className={`list-group-item list-group-item-action py-3 ${activeTab === 'nop-to-khai' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('nop-to-khai')}>
                                        <i className="bi bi-file-earmark-plus me-2"></i> Nộp Tờ Khai
                                    </button>
                                    <button className={`list-group-item list-group-item-action py-3 ${activeTab === 'lich-su' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('lich-su')}>
                                        <i className="bi bi-clock-history me-2"></i> Quản Lý Hồ Sơ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="col-lg-9">
                        
                        {/* TAB: TRANG CHỦ */}
                        {activeTab === 'home' && (
                            <div className="card shadow-sm border-0 h-100 p-5 text-center">
                                <div className="mb-4">
                                    <img src="https://cdn-icons-png.flaticon.com/512/2666/2666505.png" alt="Icon" width="80" className="mb-3" />
                                    <h3 className="text-danger fw-bold">Xin chào, {user.hoTen}!</h3>
                                    <p className="text-muted">Chào mừng bạn đến với hệ thống quản lý thuế đất điện tử.</p>
                                </div>
                                
                                <div className="row g-4 justify-content-center">
                                    <div className="col-md-5">
                                        <div 
                                            className="card h-100 p-4 shadow-sm border text-white" 
                                            style={{ backgroundColor: '#B3541E', cursor: 'pointer' }}
                                            onClick={() => setActiveTab('nop-to-khai')}
                                        >
                                            <div className="fs-1 mb-2"><i className="bi bi-file-earmark-arrow-up"></i></div>
                                            <h5 className="fw-bold">Khai Báo Thuế Đất</h5>
                                        </div>
                                    </div>
                                    <div className="col-md-5">
                                        <div 
                                            className="card h-100 p-4 shadow-sm border text-primary" 
                                            style={{ cursor: 'pointer', borderColor: '#B3541E' }}
                                            onClick={() => setActiveTab('lich-su')}
                                        >
                                            <div className="fs-1 mb-2 text-primary" style={{color: '#B3541E'}}><i className="bi bi-search" style={{color: '#B3541E'}}></i></div>
                                            <h5 className="fw-bold" style={{color: '#B3541E'}}>Tra Cứu Kết Quả</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ... (Other tabs: nop-to-khai, lich-su... keep exactly as before) ... */}
                        
                        {/* TAB: TRA CỨU QUY HOẠCH */}
                        {activeTab === 'tra-cuu' && (
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white"><h5 className="text-primary mb-0">Bản Đồ Quy Hoạch Trực Tuyến</h5></div>
                                <div className="card-body p-4">
                                    <form onSubmit={handleTraCuuQuyHoach} className="row g-3 align-items-end">
                                        <div className="col-md-5">
                                            <label className="form-label fw-bold">Số Tờ Bản Đồ</label>
                                            <input type="text" className="form-control" placeholder="VD: 10" value={searchParams.soTo} onChange={e => setSearchParams({...searchParams, soTo: e.target.value})} required />
                                        </div>
                                        <div className="col-md-5">
                                            <label className="form-label fw-bold">Số Thửa Đất</label>
                                            <input type="text" className="form-control" placeholder="VD: 25" value={searchParams.soThua} onChange={e => setSearchParams({...searchParams, soThua: e.target.value})} required />
                                        </div>
                                        <div className="col-md-2">
                                            <button className="btn btn-primary w-100" disabled={loading}>
                                                {loading ? '...' : <i className="bi bi-search"></i>} Tìm
                                            </button>
                                        </div>
                                    </form>

                                    {searchResult && (
                                        <div className="alert alert-success mt-4">
                                            <h6 className="fw-bold"><i className="bi bi-geo-alt-fill"></i> Kết quả tra cứu:</h6>
                                            <hr/>
                                            <div className="row">
                                                <div className="col-md-6 mb-2">Địa chỉ: <strong>{searchResult.diaChiChiTiet}</strong></div>
                                                <div className="col-md-6 mb-2">Diện tích gốc: <strong>{searchResult.dienTichGoc} m²</strong></div>
                                                <div className="col-md-6">Loại đất: <strong>{searchResult.maLoaiDat}</strong></div>
                                                <div className="col-md-6">Chủ sở hữu hiện tại: <strong>{searchResult.maChuSoHuu || 'Chưa xác định'}</strong></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: NỘP TỜ KHAI */}
                        {activeTab === 'nop-to-khai' && (
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white"><h5 className="text-primary mb-0">Nộp Tờ Khai Thuế</h5></div>
                                <div className="card-body p-4">
                                    <form onSubmit={handleSubmitToKhai}>
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label fw-bold">1. Chọn thửa đất sở hữu</label>
                                                <select className="form-select" value={toKhai.maThuaDat} onChange={e => setToKhai({...toKhai, maThuaDat: e.target.value})} required>
                                                    <option value="">-- Chọn đất --</option>
                                                    {ownedLands.map((l, index) => (
                                                        <option key={l.maThuaDat || l.id || index} value={l.maThuaDat || l.id}>
                                                            Tờ {l.soTo} / Thửa {l.soThua} - {l.diaChi}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold">2. Diện tích khai báo (m²)</label>
                                                <input type="number" step="0.1" className="form-control" value={toKhai.dienTichKhaiBao} onChange={e => setToKhai({...toKhai, dienTichKhaiBao: e.target.value})} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold">3. Mục đích sử dụng</label>
                                                <select className="form-select" value={toKhai.mucDichSuDungKhaiBao} onChange={e => setToKhai({...toKhai, mucDichSuDungKhaiBao: e.target.value})}>
                                                    <option value="ODT">ODT - Đất ở</option>
                                                    <option value="LUA">LUA - Đất lúa</option>
                                                </select>
                                            </div>
                                            
                                            {/* ĐÃ SỬA: Xóa thuộc tính required và cập nhật nhãn */}
                                            <div className="col-12">
                                                <label className="form-label fw-bold">
                                                    4. Tài liệu đính kèm (Sổ đỏ/Bản vẽ) <span className="text-muted fw-normal">(Không bắt buộc)</span>
                                                </label>
                                                <input 
                                                    type="file" 
                                                    className="form-control" 
                                                    onChange={e => setToKhaiFile(e.target.files[0])} 
                                                    /* Đã xóa required ở đây */
                                                />
                                            </div>

                                            <div className="col-12 mt-4">
                                                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                                    {loading ? 'Đang gửi...' : 'Nộp Tờ Khai'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* TAB: LỊCH SỬ & LOG */}
                        {activeTab === 'lich-su' && (
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white d-flex justify-content-between">
                                    <h5 className="text-primary mb-0">Quản Lý Hồ Sơ</h5>
                                    <button className="btn btn-sm btn-light" onClick={fetchHistory}><i className="bi bi-arrow-clockwise"></i></button>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Mã HS</th>
                                                <th>Thuế</th>
                                                <th>Trạng Thái</th>
                                                <th className="text-end">Hành Động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myRecords.map(item => (
                                                <tr key={item.maHoSo}>
                                                    <td>#{item.maHoSo}</td>
                                                    <td className="fw-bold text-success">{item.soTienThue ? formatCurrency(item.soTienThue) : '---'}</td>
                                                    <td>{renderStatus(item.trangThai)}</td>
                                                    <td className="text-end">
                                                        <button className="btn btn-sm btn-outline-info me-2" title="Xem tiến trình" onClick={() => handleViewLog(item.maHoSo)}>
                                                            <i className="bi bi-journal-text"></i>
                                                        </button>
                                                        
                                                        {item.trangThai === 'DA_DUYET' && (
                                                            <button className="btn btn-sm btn-success me-2" onClick={() => handlePayment(item.maHoSo)}>
                                                                <i className="bi bi-credit-card"></i> Thanh toán
                                                            </button>
                                                        )}
                                                        
                                                        {item.trangThai === 'TU_CHOI' && (
                                                            <button className="btn btn-sm btn-danger" onClick={() => setComplaintModal({ show: true, maHoSo: item.maHoSo })}>
                                                                Khiếu nại
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* ... (Keep Modals: logModal, complaintModal exactly as before) ... */}
             {/* MODAL: LOG TIẾN TRÌNH */}
            {logModal.show && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Nhật Ký Xử Lý</h5>
                                <button type="button" className="btn-close" onClick={() => setLogModal({ show: false, logs: [] })}></button>
                            </div>
                            <div className="modal-body">
                                <ul className="list-group list-group-flush">
                                    {logModal.logs.length > 0 ? logModal.logs.map((log, idx) => (
                                        <li key={idx} className="list-group-item">
                                            <small className="text-muted">{formatDate(log.thoiGian)}</small>
                                            <div className="fw-bold">{log.hanhDong}</div>
                                            <div className="small">{log.moTa}</div>
                                            <div className="text-primary small">Người xử lý: {log.nguoiThucHien}</div>
                                        </li>
                                    )) : <div className="text-center text-muted">Chưa có lịch sử.</div>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: KHIẾU NẠI */}
            {complaintModal.show && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">Gửi Khiếu Nại (HS #{complaintModal.maHoSo})</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setComplaintModal({show:false, maHoSo:null})}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Lý do khiếu nại</label>
                                    <textarea className="form-control" rows="3" value={complaintText} onChange={e => setComplaintText(e.target.value)}></textarea>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Bằng chứng (Ảnh/Văn bản)</label>
                                    <input type="file" className="form-control" onChange={e => setComplaintFile(e.target.files[0])} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setComplaintModal({show:false, maHoSo:null})}>Hủy</button>
                                <button className="btn btn-danger" onClick={handleSubmitComplaint}>Gửi Đơn</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;