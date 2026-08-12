const STORAGE_KEY = "dev-indepth-theme";

export function initThemeToggle(button: HTMLButtonElement) {
  const updateLabel = () => {
    const currentTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    const label = `Switch to ${nextTheme} theme`;

    button.setAttribute("aria-label", label);
    button.title = label;
  };

  updateLabel();
  button.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(STORAGE_KEY, nextTheme);
    updateLabel();
  });
}
