import BasePage from "../lib/base.mjs";

export default class HistoryPage extends BasePage {
  constructor() {
    super("history", "History - Steambus");
  }

  async mountContent() {
    await new Promise((r) => {
      setTimeout(r, 10000);
    });
    const content = document.createElement("div");
    content.innerHTML = await fetch('/pageScripts/history.html').then(r => r.text());
    return content;
  }

  async unmountContent() {}
}
