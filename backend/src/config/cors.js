/**
 * Centralized CORS configuration.
 *
 * Reads allowed origins from the CLIENT_ORIGINS environment variable so that
 * production deployments (Vercel/Netlify frontend -> Render backend) never
 * depend on a hardcoded localhost value.
 *
 * CLIENT_ORIGINS should be a comma-separated list, e.g.:
 *   CLIENT_ORIGINS=https://my-app.vercel.app,http://localhost:5173
 */

function getAllowedOrigins() {
  const raw = process.env.CLIENT_ORIGINS || "http://localhost:5173,http://localhost:3000";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();

/**
 * Origin-checking function shared by both Express (cors middleware)
 * and Socket.IO (server-side CORS option).
 */
function originCheck(origin, callback) {
  // Allow non-browser tools (curl, server-to-server, health checks) that
  // don't send an Origin header at all.
  if (!origin) return callback(null, true);

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS: origin "${origin}" is not allowed`));
}

const expressCorsOptions = {
  origin: originCheck,
  methods: ["GET", "POST"],
  credentials: true,
};

const socketIoCorsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true,
};

module.exports = {
  allowedOrigins,
  expressCorsOptions,
  socketIoCorsOptions,
};
