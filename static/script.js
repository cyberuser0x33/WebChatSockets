const toggleThemeBtn = document.querySelector(".toggle-theme");
toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    toggleThemeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
})

const socket = io({
    auth: {
        cookie: document.cookie
    }
});

let c = document.cookie;
let token = c.split("=")[1];
let userId = token.split(".")[0];
let username = token.split(".")[1];
alertify.log("Welcome, " + username);

let form = document.querySelector("form");
let sendBtn = document.querySelector(".send");

form.addEventListener("submit", e => {
    e.preventDefault();
    if (e.target["msg"].value.trim() == "") {
        textarea.style.height = "auto";
        e.target["msg"].value = "";
        return
    }
    sendBtn.classList.add("sending");
    setTimeout(() => {
        sendBtn.classList.remove("sending");
    }, 1000)
    socket.emit("new_message", e.target["msg"].value.trim());
    e.target["msg"].value = "";
    textarea.style.height = "auto";
})
let textarea = document.querySelector("#msg");
textarea.addEventListener("keydown", e => {
    if (e.key == "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
    }
})
textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
})

let messagesDOM = document.querySelector("#messages");
socket.on("message", msg => {
    let obj = JSON.parse(msg);
    let align = "right";
    let avatarDOM = "";
    let senderDOM = "";
    if (userId != obj.userId) {
        align = "left";
        let letter = obj.sender.charAt(0);
        avatarDOM = `<div class="avatar">${letter}</div>`;
        senderDOM = `<span class="sender">${obj.sender}</span>`
    }

    messagesDOM.innerHTML += `
        <li class="${align}">
            ${avatarDOM}
            <div class="message">
                ${senderDOM}
                <p class="content">${obj.text}</p>
                <p class="time">${obj.time}</p>
            </div>
        </li>
    `;
    messagesDOM.scrollTo(0, messagesDOM.scrollHeight);
})

socket.on("history", msgArray => {
    msgArray.forEach(item => {
        let align = "right";
        let avatarDOM = "";
        let senderDOM = "";
        if (userId != item.user_id) {
            align = "left";
            let letter = item.author.charAt(0);
            avatarDOM = `<div class="avatar">${letter}</div>`;
            senderDOM = `<span class="sender">${item.author}</span>`
        }

        messagesDOM.innerHTML += `
        <li class="${align}">
            ${avatarDOM}
            <div class="message">
                ${senderDOM}
                <p class="content">${item.msg}</p>
                <p class="time">${item.datetime}</p>
            </div>
        </li>
    `;
    })
    messagesDOM.scrollTo(0, messagesDOM.scrollHeight);
})

document.querySelector(".exit").addEventListener("click", () => {
    document.cookie = "token=;Max-Age=0";
    location.assign("/");
})