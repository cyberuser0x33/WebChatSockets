const http = require("http");
const fs = require("fs");
const path = require("path");
const db = require("./database");
const cookie = require("cookie");
const { Server } = require("socket.io");

const indexHtmlFile = fs.readFileSync(path.join(__dirname, "static", "index.html"));
const styleFile = fs.readFileSync(path.join(__dirname, "static", "style.css"));
const scriptFile = fs.readFileSync(path.join(__dirname, "static", "script.js"));
const authHtmlFile = fs.readFileSync(path.join(__dirname, "static", "auth.html"));
const authJsFile = fs.readFileSync(path.join(__dirname, "static", "auth.js"));

let validateAuthToken = [];

const server = http.createServer((req, res) => {
    if (req.method === "GET") {
        switch (req.url) {
            case "/auth": return res.end(authHtmlFile);
            case "/auth.js": return res.end(authJsFile);
            default: return guarded(req, res);
        }
    }

    if (req.method === "POST") {
        switch (req.url) {
            case "/api/login": return loginUser(req, res);
            case "/api/register": return registerUser(req, res);
            default: return guarded(req, res);
        }
    }
});

function registerUser(req, res) {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            if (!user.login || !user.password.trim()) {
                res.statusCode = 400;
                return res.end(JSON.stringify({
                    error: "Error 400 | Empty username or password"
                }));
            }

            if (await db.isUserExists(user.login)) {
                res.statusCode = 400;
                return res.end(JSON.stringify({
                    error: "Error 400 | Username already exists"
                }));
            }

            await db.addUser(user);
            res.statusCode = 201;
            return res.end(JSON.stringify({ status: "Ok" }));
        } catch (e) {
            res.statusCode = 500;
            return res.end(JSON.stringify({
                "error": e
            }));
        }
    });
}

function loginUser(req, res) {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            const token = await db.getAuthToken(user);
            validateAuthToken.push(token);
            res.statusCode = 200;
            return res.end(JSON.stringify({ token }));
        } catch (e) {
            res.statusCode = 400;
            return res.end(JSON.stringify({
                "error": e
            }));
        }
    });
}

function getCredentials(c = "") {
    let cookies = cookie.parse(c)
    let token = cookies?.token;
    if (!token || !validateAuthToken.includes(token)) return null;

    let [userId, login] = token.split(".");
    return {userId, login};

}

function guarded (req, res){
    const creds = getCredentials(req.headers?.cookie);
    if (!creds){
        res.writeHead(302, {"Location": "/auth"});
        return res.end();
    }
    if (req.method == "GET"){
        switch (req.url){
            case "/": return res.end(indexHtmlFile);
            case "/style.css": return res.end(styleFile);
            case "/script.js": return res.end(scriptFile);
        }
    }
    res.statusCode = 404;
    return res.end("404");
}

server.listen(3000, () => {
    console.log("Server is listening on port 3000");
});

const io = new Server(server);

io.use((socket, next) => {
    const cookie = socket.handshake.auth.cookie;
    const creds = getCredentials(cookie);
    if (!creds) next (new Error ("Not authorized"));
    socket.credentials = creds;
    next();
})

io.on("connection", async (socket) => {
    console.log("A user connected. Id: " + socket.id);
    let login = socket.credentials?.login;
    let userId = socket.credentials?.userId;
    let messages = await db.getMessages();
    socket.emit("history", messages);

    socket.on("new_message", message => {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        db.addMessage(message, userId, time);

        io.emit("message", JSON.stringify({
            sender: "Admin",
            text: message,
            time: time,
            "userId": userId
        }));
    });
});
