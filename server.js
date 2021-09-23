const users = { };
const rooms = { };

const io = require("socket.io")(require("http").createServer(function(){}).listen(3000))

// Estabelece uma conexão
io.on("connection", io => {
    console.log("\n\nConnection established with a client")

        // Valida usuário
    io.on("validate", (inData, inCallback) => {
        const user = users[inData.userName];
        if(user) {
            if(user.password === inData.password) {
                inCallback({status: "OK"})
            } else {
                inCallback({status: "Fail"})
            }
        } else {
            users[inData.userName] = inData;
            io.broadcast.emit("newUser", users);
            inCallback({status: "Created"})
        }
    })

    // Cria salas de chat
    io.on("create", (inData, inCallback) => {
        if(rooms[inData.roomName]) {
            inCallback({status: "Exists"})
        } else {
            inData.users = {}
            rooms[inData.roomName] = inData;
            io.broadcast.emit("Created", rooms);
            inCallback({status: "Created", rooms: rooms})
        }
    })

    // Listar as salas de chat
    io.on("listRooms", (inData, inCallback) => {
        inCallback(rooms)
    })

    // Listar usuários
    io.on("listUsers", (inData, inCallback) => {
        inCallback(users)
    })

    // Entrando em uma sala de chat
    io.on("join", (inData, inCallback) => {
        const room = rooms[inData.roomName];

        if(Object.keys(room.users).length >= rooms.maxPeople) {
            inCallback({status: "Full"})
        } else {
            room.users[inData.userName] = users[inData.userName]
            io.broadcast.emit("Joined", room)
            inCallback({status: "Joined", room: room})
        }
    })

    // Envia uma mensagem na Sala
    io.on("post", (inData, inCallback) => {
        io.broadcast.emit("posted", inData)
        inCallback({status: "OK"})
    })

    // Convidando um usuário para a sala
    io.on("invite", (inData, inCallback) => {
        io.broadcast.emit("invited", inData);
        inCallback({status: "OK"})
    })

    // Saindo de uma sala
    io.on("leave", (inData, inCallback) => {
        const room = rooms[inData.roomName]
        delete room.users[inData.userName]
        io.broadcast,emit("left", room);
        inCallback({status: "OK"})
    })

    // Fechando uma sala
    io.on("close", (inData, inCallback) => {
        delete rooms[inData.roomName];
        io.broadcast.emit("closed", {
            roomName: inData.roomName, rooms: rooms
        });
        inCallback(rooms)
    })

    // Expulsando um usuário da sala
    io.on("kick", (inData, inCallback) => {
        const room = rooms[inData.roomName]
        const users = room.users
        delete users[inData.userName]
        io.broadcast.emit("kicked", room)
        inCallback({status: "OK"})
    })
})
