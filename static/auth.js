const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginTab = document.querySelector("#login-tab");
const registerTab = document.querySelector("#register-tab");

function showForm(form) {
    loginForm.classList.toggle("hidden", form != "login");
    registerForm.classList.toggle("hidden", form != "register");
}
window.onload = () => showForm("login");

loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const { login, password } = loginForm;
    const user = {
        login: login.value,
        password: password.value
    }
    fetch("/api/login", {
        method: "POST",
        body: JSON.stringify(user)
    }).then(async response => {
        let data = await response.json();
        if (response.status == 200) {
            const token = data.token;
            /*let days = 3;
            let expiresDate = new Date();
            expiresDate.setTime(expiresDate.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `token=${token}; expires=${expiresDate.toString()}`;*/
            document.cookie = `token=${token}`;
            window.location.assign("/");
        } else {
            alertify.error(data.error);
        }
    })
})

registerForm.addEventListener("submit", event => {
    event.preventDefault();
    const { login, password, cpassword } = registerForm;
    if (password.value != cpassword.value) {
        return alertify.error("Passwords not match")
    }
    const user = {
        login: login.value,
        password: password.value
    }
    fetch("/api/register", {
        method: "POST",
        body: JSON.stringify(user)
    }).then(async response => {
        let data = await response.json();
        if (response.status == 201) {
            alertify.success("Register success");
            showForm("login");
        } else {
            alertify.error(data.error);
        }
    })
})