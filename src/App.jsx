import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import TaxOfficerDashboard from './components/TaxOfficerDashboard';
import UserDashboard from './components/UserDashboard';


// Component Bảo vệ Route (Chỉ cho phép đúng Role truy cập)
const PrivateRoute = ({ children, allowedRoles }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (!allowedRoles.includes(user.vaiTro)) {
        // Nếu đăng nhập rồi nhưng sai quyền -> Đẩy về trang phù hợp với quyền đó
        if (user.vaiTro === 'ADMIN') return <Navigate to="/admin" />;
        if (user.vaiTro === 'CAN_BO') return <Navigate to="/can-bo" />;
        return <Navigate to="/dashboard" />;
    }

    return children;
};

// Component Dashboard cho người dân (Placeholder)
// const UserDashboard = () => {
//     const user = JSON.parse(localStorage.getItem('user'));
//     return (
//         <div className="container mt-5 text-center">
//             <h2>Xin chào công dân: {user?.hoTen}</h2>
//             <p>Đây là trang tra cứu và nộp thuế.</p>
//             <button className="btn btn-danger" onClick={() => {
//                 localStorage.removeItem('user');
//                 window.location.href = '/login';
//             }}>Đăng xuất</button>
//         </div>
//     );
// };

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* --- PHÂN QUYỀN --- */}
                
                {/* 1. ADMIN: Chỉ Admin được vào */}
                <Route path="/admin" element={
                    <PrivateRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                    </PrivateRoute>
                } />

                {/* 2. CÁN BỘ: Chỉ Cán bộ được vào */}
                <Route path="/can-bo" element={
                    <PrivateRoute allowedRoles={['CAN_BO']}>
                        <TaxOfficerDashboard />
                    </PrivateRoute>
                } />

                {/* 3. NGƯỜI DÂN: Chỉ Chủ đất được vào */}
                <Route path="/dashboard" element={
                    <PrivateRoute allowedRoles={['CHU_DAT']}>
                        <UserDashboard />
                    </PrivateRoute>
                } />

                {/* Mặc định */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;