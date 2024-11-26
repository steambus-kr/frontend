import BasePage from "../lib.js";

export default class IndexPage extends BasePage {
  constructor() {
    super("index", "Steambus");
  }

  async mountContent() {
    const content = document.createElement("div");
    content.innerHTML = await this.loadHTML("index");
    return content;
  }

  async unmountContent() {}
}