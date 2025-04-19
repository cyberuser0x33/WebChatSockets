const toggleThemeBtn = document.querySelector(".togle-theme");
toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    toggleThemeBtn.textContent = document.body.classList.contains(".dark") ? "☀️" : "🌙";
})