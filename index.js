let http = require('http');
let fs = require('fs');
let path = require('path');

let indexHtmlFile = fs.readFileSync(path.join(__dirname, "static", "index.html"));
let styleFile = fs.readFileSync(path.join(__dirname, "static", "style.css"));
let scriptFile = fs.readFileSync(path.join(__dirname, "static", "script.js"));

const server = http.createServer((req, res) => {
    if (req.method === "GET") {
        switch (req.url) {
            case "/": return res.end(indexHtmlFile);
            case "/script.js": return res.end(scriptFile);
            case "/style.css": return res.end(styleFile);
        }
        res.statusCode = 404;
        res.end("404 Not Found");
    }
})

server.listen(3000);
