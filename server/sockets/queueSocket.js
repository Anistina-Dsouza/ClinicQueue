const queueSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Queue-related socket events will be defined here
    // Example: socket.on('joinQueue', (data) => { ... });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = queueSocket;