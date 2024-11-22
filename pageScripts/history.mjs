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
    content.classList.add("page");
    content.innerHTML = `
      <h1>History</h1>
      <p>
        This page is a placeholder for a future feature.
      </p>
    `;
    return content;
  }

  async unmountContent() {}
}
