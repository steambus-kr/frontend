import BasePage from "../lib/base.mjs";

const reviewSelections = [
  "-",
  '"압도적으로 긍정적"',
  '"매우 긍정적"',
  '"긍정적"',
  '"대체로 긍정적"',
  '"복합적"',
  '"대체로 부정적"',
  '"부정적"',
  '"매우 부정적"',
  '"압도적으로 부정적"'
]

export default class SettingsPage extends BasePage {
  constructor() {
    super("settings", "Settings - Steambus");
  }

  async mountContent() {
    /* HTML 로드 */
    const content = document.createElement("div");
    content.innerHTML = await fetch('/pageScripts/settings.html').then(r => r.text());

    /*** 변수 충돌 관리를 위한 클로저화 ***/

    /* 탭 기능 */
    (() => {
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
    })();

    /* 리뷰 기준 옵션 삽입 */
    (() => {
      const reviewElements = [];
      for (const [idx, reviewSummary] of Object.entries(reviewSelections)) {
        const c = document.createElement("option");
        c.innerText = reviewSummary;
        c.value = idx;
        reviewElements.push(c);
      }

      const reviewSelectors = content.querySelectorAll(".review-selector")
      for (const review of reviewSelectors) {
        for (const element of reviewElements) {
          review.appendChild(element.cloneNode(true))
        }
      }
    })();

    /* 최대/최소 옵션 변경 */
    (() => {
      const reviewMin = content.querySelector('select#review_selection_min');
      const reviewMax = content.querySelector('select#review_selection_max');

      const reviewMinOptions = reviewMin.querySelectorAll("option");
      const reviewMaxOptions = reviewMax.querySelectorAll("option");

      reviewMin.addEventListener("change", (e) => {
        const value = parseInt(e.currentTarget.value);
        const shouldDisabledRange = [value + 1, reviewSelections.length - 1];

        reviewMaxOptions.forEach(
          (option) =>
            value === 0
              ? option.disabled = false
              : option.value !== "0" &&
                option.value >= shouldDisabledRange[0] &&
                option.value <= shouldDisabledRange[1]
                  ? option.disabled = true
                  : option.disabled = false
        );
      })

      reviewMax.addEventListener("change", (e) => {
        const value = parseInt(e.currentTarget.value);
        const shouldDisabledRange = [0, value - 1];

        reviewMinOptions.forEach(
          (option) =>
            value === 0
              ? option.disabled = false
              : option.value !== "0" &&
                option.value >= shouldDisabledRange[0] &&
                option.value <= shouldDisabledRange[1]
                  ? option.disabled = true
                  : option.disabled = false
        );
      })
    })();

    /* 모든 필드 validation시 오류 메시지 */
    (() => {
      const inputs = content.querySelectorAll("input,select")
      inputs.forEach((element) => {
        const errorMsg = content.querySelector(`p[data-for="${element.id}"]`);
        element.addEventListener("invalid", (e) => {
          e.preventDefault();
          errorMsg.innerText = e.target.validationMessage;
          errorMsg.classList.remove("no-error")
        })
        element.addEventListener("blur", (e) => {
          if (e.target.validity.valid) return;
          errorMsg.innerText = e.target.validationMessage;
          errorMsg.classList.remove("no-error")
        })
        element.addEventListener("change", () => {
          errorMsg.innerText = "";
          errorMsg.classList.add("no-error")
        })
        element.addEventListener("focus", () => {
          errorMsg.innerText = "";
          errorMsg.classList.add("no-error")
        })
      })
    })();

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