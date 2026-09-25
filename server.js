import http from "http";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";

const PORT = 3001;

const server = http.createServer((req, res) => {
  fs.readFile("./public/index.html", (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

function broadcast(payload) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", (socket, req) => {
  const username = new URL(req.url, "http://localhost").searchParams.get(
    "username",
  );

  broadcast({ type: "system", text: username + " joined" });

  socket.on("message", (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      broadcast({
        type: "chat",
        username: parsed.username,
        text: parsed.text,
      });
    } catch {
    }
  });

  socket.on("close", () => {
    broadcast({ type: "system", text: username + " left" });
  });
});

server.listen(PORT, () => {
  console.log("Chat server running at http://localhost:3001");
});
