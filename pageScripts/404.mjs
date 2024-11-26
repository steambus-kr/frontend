import BasePage from "../lib.mjs";

export default class PageNotFoundPage extends BasePage {
  constructor() {
    super("404", "Page Not Found - Steambus", {
      preventState: true,
    });
  }

  async mountContent() {
    await new Promise((r) => {
      setTimeout(r, 10000);
    });
    const content = document.createElement("div");
    content.innerHTML = await fetch('/pageScripts/404.html').then(r => r.text());
    return content;
  }

  async unmountContent() {}
}
