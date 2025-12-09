// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:9090/api', // Đường dẫn tới Controller của bạn
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;