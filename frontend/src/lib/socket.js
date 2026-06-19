import { io } from "socket.io-client";
import { API_URL } from "./api";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_URL, { transports: ["websocket"], autoConnect: true });
  }
  return socket;
};
