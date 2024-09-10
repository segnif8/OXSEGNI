const socket = io();
const userArea = document.getElementById('userArea');
const onlineUsersDiv = document.getElementById('onlineUsers');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const gameArea = document.getElementById('gameArea');
const gameContainer = document.getElementById('gameContainer');
const messageElement = document.getElementById('message');

let username;

loginBtn.addEventListener('click', () => {
    username = usernameInput.value;
    if (username) {
        socket.emit('newUser', username);
        userArea.style.display = 'none';
    }
});

socket.on('updateUsers', (users) => {
    onlineUsersDiv.innerHTML = '<strong>Online Users:</strong><br>' +
        users.filter(user => user !== username).map(user => 
            `<div class="online-user" onclick="joinGame('${user}')">${user}</div>`).join('');
    onlineUsersDiv.style.display = users.length > 1 ? 'block' : 'none';
    gameArea.style.display = 'block';
});

function joinGame(user) {
    socket.emit('joinGame', { opponent: user });
}

socket.on('gameStarted', () => {
    messageElement.innerText = "Game started! Your turn.";
    createBoard();
});

socket.on('updateBoard', (board) => {
    renderBoard(board);
});

socket.on('gameOver', ({ winner }) => {
    const resultMessage = winner ? `Player ${winner} wins!` : "It's a draw!";
    messageElement.innerText = resultMessage;
    resetBoard();
});

function createBoard() {
    gameContainer.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('click', () => handleCellClick(i));
        gameContainer.appendChild(cell);
    }
}

function handleCellClick(index) {
    socket.emit('makeMove', { index });
}

function renderBoard(board) {
    const cells = document.querySelectorAll('.cell');
    board.forEach((value, index) => {
        cells[index].textContent = value;
        if (value) {
            cells[index].classList.add(value);
        }
    });
}

function resetBoard() {
    createBoard();
    messageElement.innerText = '';
}