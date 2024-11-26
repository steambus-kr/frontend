import BasePage from "../lib.js";

export default class PageNotFoundPage extends BasePage {
  constructor() {
    super("404", "Page Not Found - Steambus", {
      preventState: true
    });
  }

  async mountContent() {
    const content = document.createElement("div");
    content.innerHTML = await this.loadHTML();
    return content;
  }

  async unmountContent() {}
}