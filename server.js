const express = require('express');
const fs = require('fs');

// Start express server and send the html file to the client in order to be able to see a website.
//
const app = express();
const serv = require('http').Server(app);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(5000);
console.log('Server running. Go to: http://localhost:5000/');

// Socket
const io = require('socket.io')(serv, {});

// Game
class TicTacToeGame {
  constructor() {
    this.players = [];
    this.turn = '';
    this.board = ['', '', '', '', '', '', '', '', ''];
    this.started = false;
  }
}

let game = new TicTacToeGame();

const checkVictory = (game, curTurn) => {
  const { board } = game;

  let winner = '';

  // Horizontals  Javascript: a == b && b == c  --->  Math: a=b=c
  if (board[0] === board[1] && board[1] === board[2] && board[1] !== '')
    winner = curTurn;
  else if (board[3] === board[4] && board[4] === board[5] && board[4] !== '')
    winner = curTurn;
  else if (board[6] === board[7] && board[7] === board[8] && board[7] !== '')
    winner = curTurn;
  // Verticals
  else if (board[0] === board[3] && board[3] === board[6] && board[3] !== '')
    winner = curTurn;
  else if (board[1] === board[4] && board[4] === board[7] && board[4] !== '')
    winner = curTurn;
  else if (board[2] === board[5] && board[5] === board[8] && board[5] !== '')
    winner = curTurn;
  // Diagonals
  else if (board[0] === board[4] && board[4] === board[8] && board[4] !== '')
    winner = curTurn;
  else if (board[2] === board[4] && board[4] === board[6] && board[4] !== '')
    winner = curTurn;

  let draw = true;
  board.forEach((cell) => {
    if (cell == '') {
      draw = false;
    }
  });

  if (winner !== '') {
    // send victory msg
    io.sockets.emit('victory', {
      winner: winner,
    });
    game.started = false;
  } else if (draw) {
    io.sockets.emit('draw', {});
  }
};

io.sockets.on('connection', (socket) => {
  console.log(socket.id, 'connected to the server');

  // Add player to our game
  if (game.players.length < 2) {
    const curPiece = game.players.length < 1 ? 'O' : 'X';
    game.players.push({
      id: socket.id,
      piece: curPiece,
    });

    // Set the turn
    game.turn = game.players[0].id;

    // Emit a response when someone joins succesfully
    io.sockets.emit('gameChannel', {
      players: game.players,
      msg: 'Someone joined a game.',
    });

    // set started to true when the are two players
    game.started = true;
  } else {
    // Emit a message when the game is full
    io.sockets.emit('messageChannel', {
      receiver: socket.id,
      msg: 'The game is full.',
    });

    // Kill the socket if the game is full
    io.sockets.sockets.forEach((sck) => {
      // If given socket id is exist in list of all sockets, kill it
      if (sck.id === socket.id) sck.disconnect(true);
    });
  }

  // Listen to game movements
  socket.on('move', (data) => {
    // If it's the player's turn and the game has started
    if (socket.id === game.turn && game.started) {
      // Place Placement Validation
      if (game.board[data.cell] === '') {
        // Place Piece
        game.board[data.cell] = game.players[data.index].piece;

        // Update turn
        const curTurn = game.turn;
        game.turn = game.players[Math.floor(1 / (data.index + 1))].id;

        // Emit piece placed
        io.sockets.emit('piece placed', {
          board: game.board,
        });

        // Check for victory
        checkVictory(game, curTurn);
      }
    }
  });

  // Listen for a disconnection
  socket.on('disconnect', (reason) => {
    console.log(reason);
    // Create a new game
    game = new TicTacToeGame();

    // Emit game cancellation
    io.sockets.emit(`disconnection`, {
      reason: reason,
    });

    // Kill the sockets
    io.sockets.sockets.forEach((sck) => {
      sck.disconnect(true);
    });
  });
});
