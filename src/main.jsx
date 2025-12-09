import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'; // <--- Thêm dòng này
import 'bootstrap-icons/font/bootstrap-icons.css'; // <--- Thêm dòng này để sử dụng biểu tượng Bootstrap Icons
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)