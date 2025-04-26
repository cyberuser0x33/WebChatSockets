const toggleThemeBtn = document.querySelector(".toggle-theme");
toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    toggleThemeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
})

const socket = io(); 
let form = document.querySelector("form");
let sendBtn = document.querySelector(".send");

form.addEventListener("submit", e => {
    e.preventDefault();
    sendBtn.classList.add("sending");
    setTimeout(() => {
        sendBtn.classList.remove("sending");
    }, 1000)
    socket.emit("new_message", e.target["msg"].value);
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
    console.log(obj);
    let letter = obj.sender.charAt(0);
    messagesDOM.innerHTML += `
        <li class="left">
            <div class="avatar">${letter}</div>
            <div class="message">
                <span class="sender">${obj.sender}</span>
                <p class="content">${obj.text}</p>
                <p class="time">${obj.time}</p>
            </div>
        </li>
    `
})