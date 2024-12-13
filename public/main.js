// public/main.js
const socket = io();

const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

let senderId = 'default'; // Thiết lập ID người gửi (có thể thay đổi)
let receiverId = 'default'; // Thiết lập ID người nhận

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

// Thiết lập ID người dùng khi người dùng nhập vào tên
nameInput.addEventListener('input', (e) => {
    senderId = e.target.value;
    socket.emit('setUserId', senderId);
});

function sendMessage() {
    if (messageInput.value === '') return;
    const data = {
        sender: senderId,
        receiver: receiverId,
        message: messageInput.value,
        dateTime: new Date(),
    };
    socket.emit('message', data);
    addMessageToUI(true, data);
    messageInput.value = '';
}

socket.on('chat-message', (data) => {
    addMessageToUI(false, data);
});

function addMessageToUI(isOwnMessage, data) {
    const element = `
        <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
            <p class="message">
                ${data.message}
                <span>${data.sender} ● ${moment(data.dateTime).fromNow()}</span>
            </p>
        </li>
    `;
    messageContainer.innerHTML += element;
    scrollToBottom();

    socket.on('connect', () => {
      const userId = nameInput.value; // Lấy tên người dùng
      if (userId) {
          fetch(`/messages/${userId}`)
              .then(response => response.json())
              .then(messages => {
                  messages.forEach(message => {
                      const data = {
                          sender: message.sender,
                          receiver: message.receiver,
                          message: message.message,
                          dateTime: message.timestamp
                      };
                      addMessageToUI(data.sender === senderId, data); // Hiển thị trong UI
                  });
              });
      }
  });
}

function scrollToBottom() {
    messageContainer.scrollTo(0, messageContainer.scrollHeight);
}