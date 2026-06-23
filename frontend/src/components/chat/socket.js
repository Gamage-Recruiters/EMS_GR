import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const socketUrl =
  import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api\/?$/, "");

const socket = io(socketUrl, {
  autoConnect: false,
  auth: (cb) => {
    cb({ token: localStorage.getItem("accessToken") });
  },
  transports: ["websocket", "polling"],
});

export default socket;
