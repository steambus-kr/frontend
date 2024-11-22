import BasePage from "../lib/base.mjs";

export default class SettingsPage extends BasePage {
  constructor() {
    super("settings", "Settings - Steambus");
  }

  async mountContent() {
    const content = document.createElement("div");
    content.classList.add("page");
    content.innerHTML = `
      <h1>Settings</h1>
      <p>
        This page is a placeholder for a future feature.
      </p>
    `;
    return content;
  }

  async unmountContent() {}
}
