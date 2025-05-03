let http = require("http");
let fs = require("fs");
let path = require("path");
let db = require("./database");



let indexHtmlFile = fs.readFileSync(path.join(__dirname, "static", "index.html"));
let styleFile = fs.readFileSync(path.join(__dirname, "static", "style.css"));
let scriptFile = fs.readFileSync(path.join(__dirname, "static", "script.js"));



const server = http.createServer((req, res) => {
    if (req.method == "GET") {
        switch(req.url) {
            case "/": return res.end(indexHtmlFile);
            case "/script.js": return res.end(scriptFile);
            case "/style.css": return res.end(styleFile);
        }
        res.statusCode = 404;
        res.end("404");
    }
})

server.listen(3000);

const { Server } = require("socket.io");
const io = new Server(server);

io.on("connection", socket => {
    console.log("A user connected. Id: " + socket.id);
    socket.on("new_message", message => {
        let date = new Date();
        let hours = String(date.getHours()).padStart(2, "0");
        let minutes = String(date.getMinutes()).padStart(2, "0");
        let time = hours + ":" + minutes;
        io.emit("message", JSON.stringify({
            "sender": "Admin",
            "text": message,
            "time": time
        }))
    })
})