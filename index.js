let http = require("http");
let fs = require("fs");
let path = require("path");
let db = require("./database");
let cookie = require("cookie");

let indexHtmlFile = fs.readFileSync(path.join(__dirname, "static", "index.html"));
let styleFile = fs.readFileSync(path.join(__dirname, "static", "style.css"));
let scriptFile = fs.readFileSync(path.join(__dirname, "static", "script.js"));
let authHtmlFile = fs.readFileSync(path.join(__dirname, "static", "auth.html"));
let authJsFile = fs.readFileSync(path.join(__dirname, "static", "auth.js"));

let validateAuthTokens = [];

const server = http.createServer((req, res) => {
    if (req.method == "GET") {
        switch (req.url) {
            case "/auth": return res.end(authHtmlFile);
            case "/auth.js": return res.end(authJsFile);
            default: return guarded(req, res);
        }
    }
    if (req.method == "POST") {
        switch (req.url) {
            case "/api/login": return loginUser(req, res);
            case "/api/register": return registerUser(req, res);
            default: return guarded(req, res);
        }
    }
})

function registerUser(req, res) {
    let data = "";
    req.on("data", chunk => {
        data += chunk;
    })
    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            if (!user.login.trim() || !user.password.trim()) {
                res.statusCode = 400;
                return res.end(JSON.stringify({
                    "error": "Empty username or password"
                }))
            }
            if (await db.isUserExist(user.login)) {
                res.statusCode = 400;
                return res.end(JSON.stringify({
                    "error": "Username already exists"
                }))
            }
            await db.addUser(user);
            res.statusCode = 201;
            res.end(JSON.stringify({
                "status": "ok"
            }))
        } catch (e) {
            res.statusCode = 500;
            return res.end(JSON.stringify({
                "error": "Some error, try again"
            }))
        }
    })
}

function loginUser(req, res) {
    let data = "";
    req.on("data", chunk => {
        data += chunk;
    })

    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            const token = await db.getAuthToken(user);
            validateAuthTokens.push(token);
            res.statusCode = 200;
            res.end(JSON.stringify({
                "token": token
            }))
        } catch (e) {
            res.statusCode = 400;
            return res.end(JSON.stringify({
                "error": e
            }))
        }
    })
}

function getCredentials(c = "") {
    let cookies = cookie.parse(c);
    let token = cookies?.token;
    if (!token || !validateAuthTokens.includes(token)) return null;

    let [userId, login] = token.split(".");
    return {userId, login}
}

function guarded(req, res) {
    const creds = getCredentials(req.headers?.cookie);
    if (!creds) {
        res.writeHead(302, {"Location": "/auth"});
        return res.end();
    }
    if (req.method == "GET") {
        switch(req.url) {
            case "/": return res.end(indexHtmlFile);
            case "/script.js": return res.end(scriptFile);
            case "/style.css": return res.end(styleFile);
        }
    }
    res.statusCode = 404;
    res.end("404");
}

server.listen(3000);

const { Server } = require("socket.io");
const io = new Server(server);

io.use((socket, next) => {
    const cookie = socket.handshake.auth.cookie;
    const creds = getCredentials(cookie);
    if (!creds) next(new Error("no auth"));
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
        let date = new Date();
        let hours = String(date.getHours()).padStart(2, "0");
        let minutes = String(date.getMinutes()).padStart(2, "0");
        let time = hours + ":" + minutes;
        db.addMessage(message, userId, time);
        io.emit("message", JSON.stringify({
            "sender": login,
            "text": message,
            "time": time,
            "userId": userId
        }))
    })
})