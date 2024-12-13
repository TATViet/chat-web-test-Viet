// app.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');  // Import pg module
const app = express();
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`💬 server on port ${PORT}`));

const io = require('socket.io')(server);

// Kết nối đến PostgreSQL
const pool = new Pool({
    user: 'Viet', // Thay bằng tên người dùng PostgreSQL của bạn
    host: 'localhost',
    database: 'chat_app',  // Tên cơ sở dữ liệu bạn đã tạo
    password: 'Vietk12+', // Thay bằng mật khẩu PostgreSQL của bạn
    port: 5432, // Cổng PostgreSQL mặc định
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

let socketsConnected = new Map(); // Lưu các socket

io.on('connection', onConnected);

function onConnected(socket) {
    console.log('Socket connected', socket.id);
    socketsConnected.set(socket.id, {});

    socket.on('setUserId', (userId) => {
        socketsConnected.set(socket.id, { userId });
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected', socket.id);
        socketsConnected.delete(socket.id);
    });

    socket.on('message', async (data) => {
        const { sender, receiver, message } = data;

        // Lưu tin nhắn vào cơ sở dữ liệu
        try {
            await pool.query('INSERT INTO messages (sender, receiver, message) VALUES ($1, $2, $3)', [sender, receiver, message]);
        } catch (error) {
            console.error('Error saving message:', error);
        }

        // Phát tin nhắn cho người nhận cụ thể
        for (let [id, user] of socketsConnected) {
            if (user.userId === receiver) {
                io.to(id).emit('chat-message', data);
                break;
            }
        }
    });

    socket.on('feedback', (data) => {
        socket.broadcast.emit('feedback', data);
    });
}

// API để lấy các tin nhắn
app.get('/messages/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const { rows } = await pool.query('SELECT * FROM messages WHERE sender = $1 OR receiver = $1', [userId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send(error);
    }
});