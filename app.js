const socket = io();

const winner = document.querySelector('.winner');
const playersDiv = document.querySelector('.players');
const cells = document.querySelectorAll('.cell');
const message = document.querySelector('.message');

socket.on('gameChannel', (data) => {
  console.log(data);
  // Clear
  winner.textContent = '';
  cells.forEach((cell) => {
    cell.textContent = '';
  });
  message.textContent = '';

  // Add the players to the UI
  let newPlayersDiv = document.createElement('div');

  data.players.forEach((player, index) => {
    const playerDiv = document.createElement('div');
    playerDiv.textContent =
      'Player: ' +
      player.piece +
      (player.id === socket.id ? ' (You)' : ' (Opponent)');
    newPlayersDiv.appendChild(playerDiv);

    // Set move emitter for the squares
    if (socket.id === player.id) {
      cells.forEach((cell) => {
        cell.addEventListener('click', (e) => {
          socket.emit('move', {
            id: socket.id,
            index: index,
            cell: cell.id,
          });
        });
      });
    }
  });
  playersDiv.innerHTML = newPlayersDiv.innerHTML;
});

// Listen to pieces placed
socket.on('piece placed', (data) => {
  cells.forEach((cell, index) => {
    cell.textContent = data.board[index];
  });
});

// Listen for a winner
socket.on('victory', (data) => {
  if (data.winner === socket.id) {
    winner.textContent = 'You Win!';
  } else {
    winner.textContent = 'You Lost!';
  }
});

// Listen for a draw
socket.on('draw', (data) => {
  winner.textContent = 'Draw';
});

// Listen for a message
socket.on('messageChannel', (data) => {
  if (data.receiver === socket.id) message.textContent = data.msg;
});

// Listen for disconnection
socket.on('disconnection', (reason) => {
  message.textContent = 'Your Opponent left';
  winner.textContent = 'You Win!';
});
