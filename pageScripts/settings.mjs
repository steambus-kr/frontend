import BasePage from "../lib/base.mjs";

export default class SettingsPage extends BasePage {
  constructor() {
    super("settings", "Settings - Steambus");
  }

  async mountContent() {
    const content = document.createElement("div");
    content.classList.add("page");
    content.innerHTML = await fetch('/pageScripts/settings.html').then(r => r.text());
    return content;
  }

  async unmountContent() {}
}
