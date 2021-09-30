/**
 * Module dependencies.
 */
import debugLib from 'debug';
import http from 'http';
import app from '../app';

const debug = debugLib('your-project-name:server');

let port = null;
let server = null;

/**
 * Normalize a port into a number, string, or false.
 *
 * @param {number} val - the port
 * @returns {number|boolean} Either the port number, or false
 */
function normalizePort(val) {
  const normalisedPort = parseInt(val, 10);

  if (Number.isNaN(normalisedPort)) {
    // named pipe
    return val;
  }

  if (normalisedPort >= 0) {
    // port number
    return normalisedPort;
  }

  return false;
}

/**
 * Event listener for HTTP server 'error' event.
 *
 * @param {Error} error - the error
 * @returns {void} Nothing
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      process.stderr.write(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      process.stderr.write(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server 'listening' event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
  process.stdout.write(`Listening on ${bind}`);
}

/**
 * Get port from environment and store in Express.
 */

port = normalizePort(process.env.PORT || '8000');
app.set('port', port);

/**
 * Create HTTP server.
 */

server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
