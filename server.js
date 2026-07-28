const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  const io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  global.io = io;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join:kitchen", () => {
      socket.join("kitchen");
    });

    socket.on("join:waiter", () => {
      socket.join("waiter");
    });

    socket.on("join:order", (orderId) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("join:table", (tableId) => {
      socket.join(`table:${tableId}`);
    });

    socket.on("order:created", (order) => {
      io.to("kitchen").emit("order:new", order);
      io.to("waiter").emit("order:new", order);
      if (order?.tableId) {
        io.to(`table:${order.tableId}`).emit("order:update", order);
      }
    });

    socket.on("order:status", (order) => {
      io.to("kitchen").emit("order:update", order);
      io.to("waiter").emit("order:update", order);
      if (order?.id) {
        io.to(`order:${order.id}`).emit("order:update", order);
      }
      if (order?.tableId) {
        io.to(`table:${order.tableId}`).emit("order:update", order);
      }
    });

    socket.on("table:update", (table) => {
      io.to("waiter").emit("table:update", table);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
