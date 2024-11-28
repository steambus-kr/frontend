import BasePage from "../lib.js";

export default class IndexPage extends BasePage {
  constructor(index: number) {
    super("index", "Steambus", index);
  }

  async mountContent() {
    const content = document.createElement("div");
    content.innerHTML = await this.loadHTML();
    return content;
  }

  async unmountContent() {}
}