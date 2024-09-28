// index.js
const server = require('./server');

// Set the port the app will listen on
const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});