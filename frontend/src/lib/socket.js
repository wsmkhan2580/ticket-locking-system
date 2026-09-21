import { io } from "socket.io-client";

// Single shared socket instance for the whole app. Reading the server URL
// from an environment variable means production builds never depend on
// localhost — set VITE_SERVER_URL to the deployed Render backend URL.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

export const SERVER_HTTP_URL = SERVER_URL;
