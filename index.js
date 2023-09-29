const express = require("express");
const app = express();
const http = require("http").Server(app);
const cors = require("cors");
const PORT = 4000;
const socketIO = require("socket.io")(http, {
	cors: {
		origin: "http://localhost:3000",
	},
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const generateID = () => Math.random().toString(36).substring(2, 10);
let chatGroups = [];

socketIO.on("connection", (socket) => {
	console.log(`⚡: ${socket.id} user just connected!`);

	socket.on("createGroup", (name) => {
		socket.join(name);
		chatGroups.unshift({ id: generateID(), name, messages: [] });
		socketIO.emit("groupsList", chatGroups);
	});

	socket.on("findGroup", (id) => {
		let result = chatGroups.filter((group) => group.id == id);
		socket.emit("foundGroup", result?.[0]?.messages);
	});

	socket.on("newMessage", (data) => {
		const { group_id, message, user, timestamp } = data;

		let result = chatGroups.filter((group) => group.id == group_id);

		const newMessage = {
			id: generateID(),
			text: message,
			user,
			time: timestamp,
		};

		socket.to(result[0].name).emit("groupMessage", newMessage);
		result[0].messages.push(newMessage);

		socketIO.emit("groupsList", chatGroups);
		socketIO.emit("foundGroup", result[0].messages);
	});

	socket.on("typing", (data) => {
		socket.broadcast.emit("typing", data);
	});

	socket.on("disconnect", () => {
		socket.disconnect();
		console.log("🔥: A user disconnected");
	});
});

app.get("/groups", (req, res) => {
	res.json(chatGroups);
});

http.listen(PORT, () => {
	console.log(`Server listening on ${PORT}`);
});
