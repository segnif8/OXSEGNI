const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3006;

let gameState = {
    board: Array(9).fill(null),
    currentPlayer: 'x',
    winner: null,
    players: {},
    playerMarks: {},
    scores: { x: 0, o: 0, draw: 0 },
    history: []
};

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinGame', (username) => {
        if (Object.keys(gameState.players).length < 2) {
            gameState.players[socket.id] = username;
            if (Object.keys(gameState.players).length === 2) {
                io.emit('gameState', gameState);
            }
            socket.emit('usernameAccepted', { username, gameState });
        } else {
            socket.emit('usernameRejected', 'Game is full');
        }
    });

    socket.on('chooseMark', (mark) => {
        if (!gameState.playerMarks[socket.id]) {
            gameState.playerMarks[socket.id] = mark;
            const opponentSocketId = Object.keys(gameState.players).find(id => id !== socket.id);
            if (Object.keys(gameState.playerMarks).length === 2) {
                gameState.currentPlayer = Object.keys(gameState.playerMarks).find(id => gameState.playerMarks[id] === 'x');
                io.emit('gameState', gameState);
            }
        }
    });

    socket.on('move', (index) => {
        if (gameState.winner || gameState.board[index] || !isPlayerTurn(socket.id)) return;

        gameState.board[index] = gameState.playerMarks[socket.id];
        if (checkWinner()) {
            gameState.winner = gameState.currentPlayer;
            gameState.scores[gameState.currentPlayer] += 1;
        } else if (gameState.board.every(cell => cell)) {
            gameState.winner = 'draw';
            gameState.scores.draw += 1;
        } else {
            gameState.currentPlayer = Object.keys(gameState.playerMarks).find(id => id !== socket.id);
        }

        gameState.history.push(gameState.board.slice());
        if (gameState.history.length > 5) gameState.history.shift();
        io.emit('gameState', gameState);
    });

    socket.on('reset', () => {
        gameState = {
            board: Array(9).fill(null),
            currentPlayer: 'x',
            winner: null,
            players: gameState.players,
            playerMarks: {},
            scores: gameState.scores,
            history: gameState.history
        };
        io.emit('gameState', gameState);
    });

    socket.on('chatMessage', (message) => {
        io.emit('chatMessage', { username: gameState.players[socket.id], message });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        delete gameState.players[socket.id];
        delete gameState.playerMarks[socket.id];
        io.emit('gameState', gameState);
    });

    function isPlayerTurn(id) {
        return id === gameState.currentPlayer;
    }
});

function checkWinner() {
    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        return gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c];
    });
}

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
