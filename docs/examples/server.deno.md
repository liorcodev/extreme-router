```typescript
// server.deno.ts
// @deno-types="npm:extreme-router/dist/index.d.ts"
import Extreme, { param, wildcard } from 'npm:extreme-router';

// Define the type for your route store, mapping methods to handlers
type MethodHandler = (req: Request, params?: Record<string, string>) => Response | Promise<Response>;
type RouteStore = {
  [method: string]: MethodHandler; // e.g., GET, POST
};

// Initialize the router
const router = new Extreme<RouteStore>();

// Register plugins (chaining supported)
router.use(param).use(wildcard);

// --- Define Handlers ---
const homeHandler: MethodHandler = () => new Response('Welcome Home! (GET)');
const createUserHandler: MethodHandler = async (req) => {
  const body = await req.text();
  return new Response(`Creating user... (POST) Data: ${body}`, { status: 201 });
};
const userHandler: MethodHandler = (req, params) => new Response(`User ID: ${params?.userId} (GET)`);
const updateUserHandler: MethodHandler = async (req, params) => {
  const body = await req.text();
  return new Response(`Updating user ${params?.userId}... (PUT) Data: ${body}`);
};
const fileHandler: MethodHandler = (req, params) => new Response(`File path: ${params?.['*']} (GET)`);
const notFoundHandler: MethodHandler = () => new Response('Not Found', { status: 404 });
const methodNotAllowedHandler: MethodHandler = () => new Response('Method Not Allowed', { status: 405 });

// --- Register Routes and Methods ---
router.register('/').GET = homeHandler;

const userRoute = router.register('/users/:userId');
userRoute.GET = userHandler;
userRoute.PUT = updateUserHandler;

router.register('/users').POST = createUserHandler;

router.register('/files/*').GET = fileHandler;

// Create Deno server
Deno.serve({ port: 3000 }, (req) => {
  const url = new URL(req.url);
  const match = router.match(url.pathname);

  if (match) {
    // Check if a handler exists for the request method
    const handler = match[req.method as keyof RouteStore];
    if (handler) {
      if ('params' in match && match.params) {
        // Dynamic route match
        return handler(req, match.params);
      } else {
        // Static route match
        return handler(req);
      }
    } else {
      // Path matched, but method not allowed
      return methodNotAllowedHandler(req);
    }
  }

  // No path match found
  return notFoundHandler(req);
});

console.log('Deno server listening on http://localhost:3000');
```
