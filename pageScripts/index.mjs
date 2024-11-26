import BasePage from "../lib.mjs";

export default class IndexPage extends BasePage {
  constructor() {
    super("index", "Steambus");
  }

  async mountContent() {
    const content = document.createElement("div");
    content.innerHTML = await fetch("/pageScripts/index.html").then((res) => res.text());
    return content;
  }

  async unmountContent() {}
}
