const WebSocket = require("ws");
const port = process.env.WS_PORT;

const wss = new WebSocket.Server({ port });
const redis = require("redis");
const redisConnection = { url: "redis://redis_db:6379" };
const subscriber = redis.createClient(redisConnection);
const publisher = redis.createClient(redisConnection);

const main = async () => {
  console.log(`WS Server listening on port ${port}...`);

  await subscriber.connect();
  await publisher.connect();

  const WS_CHANNEL = "ws:messages";
  const mockedUsers = [
    {
      id: 1,
      port,
      firstname: "John",
      lastname: "Doe",
    },
  ];

  await subscriber.subscribe(WS_CHANNEL, (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      const message = JSON.parse(data);

      if (message.type === "get-users") {
        ws.send(JSON.stringify(mockedUsers));
      }

      if (message.type === "broadcast") {
        publisher.publish(WS_CHANNEL, JSON.stringify(mockedUsers));
      }
    });
  });
};

(async () => {
  await main();
})();
