import BasePage from "../lib/base.mjs";

export default class SettingsPage extends BasePage {
  constructor() {
    super("settings", "Settings - Steambus");
  }

  async mountContent() {
    /* HTML 로드 */
    const content = document.createElement("div");
    content.innerHTML = await fetch('/pageScripts/settings.html').then(r => r.text());

    /* 탭 기능 */
    const tabSelects = content.querySelectorAll(".select-tab");
    for (const tabSelect of tabSelects) {
      const tabs = {}
      for (const tab of tabSelect.querySelectorAll("button")) {
        const tabId = tab.dataset.tabId;
        tabs[tabId] = [
          tab,
          tabSelect.parentElement.querySelector(`.select-tab ~ .tab-content > div[data-tab-id="${tabId}"]`)
        ]
      }
      new Tab(tabs);
    }

    return content;
  }

  async unmountContent() {}
}

class Tab {
  /**
   *
   * @type {{ [tabId: toString]: [HTMLButtonElement, HTMLDivElement] }} [selectBtn, tabDiv]
   */
  tabs = {};

  constructor(tabs) {
    this.tabs = tabs;
    this.applyEvents()
  }

  applyEvents() {
    const onTabSelectBtnClick = (tabId) => (e) => {
      e.currentTarget.classList.add("selected");
      this.tabs[tabId][1].classList.add("selected");
      for (const tabElementExceptThis of Object.entries(this.tabs).filter(([_tabId]) => _tabId !== tabId).map(([_, l]) => l)) {
        tabElementExceptThis[0].classList.remove("selected");
        tabElementExceptThis[1].classList.remove("selected");
      }
    }

    for (const [tabId, tabElement] of Object.entries(this.tabs)) {
      tabElement[0].addEventListener('click', onTabSelectBtnClick(tabId))
    }
  }
}