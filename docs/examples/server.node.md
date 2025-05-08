```javascript
// server.node.mjs
import http from 'node:http';
import Extreme, { param, wildcard } from 'extreme-router';

// Define the type for your route store, mapping methods to handlers
type MethodHandler = (req: http.IncomingMessage, res: http.ServerResponse, params?: Record<string, string>) => void;
type RouteStore = {
  [method: string]: MethodHandler; // e.g., GET, POST
};

// Initialize the router
const router = new Extreme<RouteStore>();

// Register plugins (chaining supported)
router.use(param)
.use(wildcard);

// --- Define Handlers ---
const homeHandler: MethodHandler = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Welcome Home! (GET)');
};
const createUserHandler: MethodHandler = (req, res) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  req.on('end', () => {
    res.writeHead(201, { 'Content-Type': 'text/plain' });
    res.end(`Creating user... (POST) Data: ${body}`);
  });
};
const userHandler: MethodHandler = (req, res, params) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`User ID: ${params?.userId} (GET)`);
};
const updateUserHandler: MethodHandler = (req, res, params) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  req.on('end', () => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Updating user ${params?.userId}... (PUT) Data: ${body}`);
  });
};
const fileHandler: MethodHandler = (req, res, params) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`File path: ${params?.['*']} (GET)`);
};
const notFoundHandler: MethodHandler = (req, res) => {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
};
const methodNotAllowedHandler: MethodHandler = (req, res) => {
  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
};

// --- Register Routes and Methods ---
router.register('/').GET = homeHandler;

const userRoute = router.register('/users/:userId');
userRoute.GET = userHandler;
userRoute.PUT = updateUserHandler;

router.register('/users').POST = createUserHandler;

router.register('/files/*').GET = fileHandler;

// Create Node.js server
const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const match = router.match(url.pathname);
  const method = req.method ?? 'GET'; // Default to GET if method is undefined

  if (match) {
    // Check if a handler exists for the request method
    const handler = match[method as keyof RouteStore];
    if (handler) {
      if ('params' in match && match.params) {
        // Dynamic route match
        handler(req, res, match.params);
      } else {
        // Static route match
        handler(req, res);
      }
    } else {
      // Path matched, but method not allowed
      methodNotAllowedHandler(req, res);
    }
  } else {
    // No path match found
    notFoundHandler(req, res);
  }
});

server.listen(3000, () => {
  console.log('Node.js server listening on http://localhost:3000');
});
```
