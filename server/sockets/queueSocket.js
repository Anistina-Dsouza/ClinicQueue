/**
 * WebSocket connections event mapping for ClinicQueue
 */
const queueSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);

    // Clinicians join a unified channel to receive real-time dashboard queue pushes
    socket.on('joinClinicianDashboard', () => {
      socket.join('clinicians');
      console.log(`Socket ${socket.id} joined 'clinicians' room.`);
    });

    // Patients subscribe to updates for their specific token
    socket.on('subscribeTokenStatus', (tokenNumber) => {
      if (tokenNumber) {
        socket.join(`token:${tokenNumber}`);
        console.log(`Socket ${socket.id} subscribed to room 'token:${tokenNumber}'.`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`WebSocket client disconnected: ${socket.id}`);
    });
  });
};

module.exports = queueSocket;