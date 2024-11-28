import BasePage from "../lib.js";
import validator, {optional, uint} from "../validator.js";
import type {IConfig, IFormConfig} from "../types";
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
  '"압도적으로 부정적"',
];

const initialState: IConfig = {
  owner_min: null,
  player_min: null,
  player_max: null,
  review_tab: "simple",
  review_selection_min: 0,
  review_selection_max: 0,
  positive_min: null,
  positive_max: null,
  negative_min: null,
  negative_max: null,
};

export default class SettingsPage extends BasePage {
  static SETTINGS_KEY = "settings";

  inputs: HTMLInputElement[] = [];
  settings: IConfig = {
    owner_min: null,
    player_min: null,
    player_max: null,
    review_tab: "simple",
    review_selection_min: 0,
    review_selection_max: 0,
    positive_min: null,
    positive_max: null,
    negative_min: null,
    negative_max: null,
  };
  reviewTab: Tab | null = null;

  constructor(index: number) {
    super("settings", "Settings - Steambus", index);
  }

  async loadConfig() {
    const dbSettings = localStorage.getItem(SettingsPage.SETTINGS_KEY);
    this.settings = dbSettings ? JSON.parse(dbSettings) : initialState;
    this.inputs.forEach((input) => {
      const settingName = input.name as keyof IConfig;
      if (settingName === 'review_tab' && this.reviewTab) {
        this.reviewTab.setTab(this.settings[settingName] ?? initialState.review_tab)
      }
      input.value = (this.settings[settingName] ?? initialState[settingName] ?? "").toString();
    });
  }

  async saveConfig() {
    localStorage.setItem(
      SettingsPage.SETTINGS_KEY,
      JSON.stringify(this.settings),
    );
  }

  async setFormError(key: string, errorMsg: string) {
    const input = this.inputs.find((input) => input.id === key);
    input && input.setCustomValidity(errorMsg);
  }

  async validate(formDataObj: IFormConfig) {
    const response: {
      ok: boolean;
      errors: Record<string, string>
    } = {
      ok: true,
      errors: {},
    };

    function writeError(key: string, errorMsg: string) {
      response.ok = false;
      if (key in response.errors) {
        // 덮어쓰기 금지, 첫 에러만 표시
        return;
      }
      response.errors[key] = errorMsg;
    }

    const t = validator(writeError);

    t("owner_min", formDataObj.owner_min).t(optional).t(uint);
    const player_min_v = t("player_min", formDataObj.player_min)
      .t(optional)
      .t(uint)
    const player_max_v = t("player_max", formDataObj.player_max)
      .t(optional)
      .t(uint)
    if (player_min_v.ok && !player_min_v.break && player_max_v.ok && !player_max_v.break && parseInt(formDataObj.player_min) > parseInt(formDataObj.player_max)) {
      writeError("player_min", "최소값은 최대값보다 작아야 합니다.");
    }
    const positive_min_v = t("positive_min", formDataObj.positive_min)
      .t(optional)
      .t(uint)
    const positive_max_v = t("positive_max", formDataObj.positive_max)
      .t(optional)
      .t(uint)
    if (positive_min_v.ok && !positive_min_v.break && positive_max_v.ok && !positive_max_v.break && parseInt(formDataObj.positive_min) > parseInt(formDataObj.positive_max)) {
      writeError("positive_min", "최소값은 최대값보다 작아야 합니다.");
    }
    const negative_min_v = t("negative_min", formDataObj.negative_min)
      .t(optional)
      .t(uint)
    const negative_max_v = t("negative_max", formDataObj.negative_max)
      .t(optional)
      .t(uint)
    if (negative_min_v.ok && !negative_min_v.break && negative_max_v.ok && !negative_max_v.break && parseInt(formDataObj.negative_min) > parseInt(formDataObj.negative_max)) {
      writeError("negative_min", "최소값은 최대값보다 작아야 합니다.");
    }

    return response;
  }

  async transform(formDataObj: IFormConfig): Promise<IConfig> {
    function nullOrNumber(value: string) {
      if (value === "") return null;
      return parseInt(value)
    }

    return {
      owner_min: nullOrNumber(formDataObj.owner_min),
      player_min: nullOrNumber(formDataObj.player_min),
      player_max: nullOrNumber(formDataObj.player_max),
      review_tab: formDataObj.review_tab as "simple" | "advanced",
      review_selection_min: parseInt(formDataObj.review_selection_min),
      review_selection_max: parseInt(formDataObj.review_selection_max),
      positive_min: nullOrNumber(formDataObj.positive_min),
      positive_max: nullOrNumber(formDataObj.positive_max),
      negative_min: nullOrNumber(formDataObj.negative_min),
      negative_max: nullOrNumber(formDataObj.negative_max),
    }
  }

  async mountContent() {
    /* HTML 로드 */
    const content = document.createElement("div");
    content.innerHTML = await this.loadHTML();

    /*** 변수 충돌 관리를 위한 클로저화 ***/

    /* 탭 기능 */
    (() => {
      const tabSelects = content.querySelectorAll(".select-tab");
      for (const tabSelect of tabSelects) {
        const tabs: Record<string, [HTMLButtonElement, HTMLDivElement]> = {};
        for (const tab of tabSelect.querySelectorAll("button")) {
          const tabId = tab.dataset.tabId;
          if (!tabId) continue;
          const tabElement: HTMLDivElement | null | undefined = tabSelect.parentElement?.querySelector?.(
            `.select-tab ~ .tab-content > div[data-tab-id="${tabId}"]`
          )
          if (!tabElement) continue;
            tabs[tabId] = [
              tab,
              tabElement,
            ]
        }
        const input: HTMLInputElement | null = content.querySelector('input[name="review_tab"]');
        if (input) {
          input.value = 'simple'
          this.reviewTab = new Tab(tabs, input);
        }
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

      const reviewSelectors = content.querySelectorAll(".review-selector");
      for (const review of reviewSelectors) {
        for (const element of reviewElements) {
          review.appendChild(element.cloneNode(true));
        }
      }
    })();

    /* 최대/최소 옵션 변경 */
    (() => {
      const reviewMin = content.querySelector("select#review_selection_min") as HTMLSelectElement;
      const reviewMax = content.querySelector("select#review_selection_max") as HTMLSelectElement;

      const reviewMinOptions = reviewMin.querySelectorAll("option");
      const reviewMaxOptions = reviewMax.querySelectorAll("option");

      reviewMin.addEventListener("change", (e) => {
        const value = parseInt((e.currentTarget as HTMLInputElement).value);
        const shouldDisabledRange = [value + 1, reviewSelections.length - 1];

        reviewMaxOptions.forEach((option) =>
          value === 0
            ? (option.disabled = false)
            : option.value !== "0" &&
            parseInt(option.value) >= shouldDisabledRange[0] &&
            parseInt(option.value) <= shouldDisabledRange[1]
              ? (option.disabled = true)
              : (option.disabled = false),
        );
      });

      reviewMax.addEventListener("change", (e) => {
        const value = parseInt((e.currentTarget as HTMLInputElement).value);
        const shouldDisabledRange = [0, value - 1];

        reviewMinOptions.forEach((option) =>
          value === 0
            ? (option.disabled = false)
            : option.value !== "0" &&
            parseInt(option.value) >= shouldDisabledRange[0] &&
            parseInt(option.value) <= shouldDisabledRange[1]
              ? (option.disabled = true)
              : (option.disabled = false),
        );
      });
    })();

    /* 모든 필드 validation시 오류 메시지 */
    (() => {
      const inputs: NodeListOf<(HTMLInputElement | HTMLSelectElement)> = content.querySelectorAll("input,select");
      inputs.forEach((element) => {
        const errorMsg = content.querySelector(`p[data-for="${element.id}"]`) as HTMLParagraphElement;
        element.addEventListener("invalid", (e) => {
          const target = e.target as typeof element;
          e.preventDefault();
          errorMsg.innerText = target.validationMessage;
          errorMsg.classList.remove("no-error");
        });
        element.addEventListener("blur", (e) => {
          const target = e.target as typeof element;
          if (target.validity.valid) return;
          errorMsg.innerText = target.validationMessage;
          errorMsg.classList.remove("no-error");
        });
        element.addEventListener("change", () => {
          errorMsg.innerText = "";
          errorMsg.classList.add("no-error");
          element.setCustomValidity("");
        });
        element.addEventListener("focus", () => {
          errorMsg.innerText = "";
          errorMsg.classList.add("no-error");
          element.setCustomValidity("");
        });
      });
    })();

    /* review_ratio 계산 */
    (() => {
      const positiveMin = content.querySelector("input#positive_min") as HTMLInputElement;
      const positiveMax = content.querySelector("input#positive_max") as HTMLInputElement;
      const negativeMin = content.querySelector("input#negative_min") as HTMLInputElement;
      const negativeMax = content.querySelector("input#negative_max") as HTMLInputElement;
      const reviewRatio = content.querySelector("#review_ratio") as HTMLElement;
      function minRatioCalc() {
        let ratio ;
        if (positiveMin.value === "" || negativeMin.value === "") {
          ratio = "-";
        } else {
          const positiveMinValue = parseInt(positiveMin.value);
          const negativeMinValue = parseInt(negativeMin.value);
          ratio = Math.round(positiveMinValue / (positiveMinValue + negativeMinValue) * 100) / 100;
        }
        const reviewRatioTxt = reviewRatio.querySelector('li:first-child > span') as HTMLSpanElement;
          reviewRatioTxt && (reviewRatioTxt.innerText = ratio.toString());
      }
      function maxRatioCalc() {
        let ratio ;
        if (positiveMax.value === "" || negativeMax.value === "") {
          ratio = "-";
        } else {
          const positiveMaxValue = parseInt(positiveMax.value);
          const negativeMaxValue = parseInt(negativeMax.value);
          ratio = Math.round(positiveMaxValue / (positiveMaxValue + negativeMaxValue) * 100) / 100;
        }
        const reviewRatioTxt = reviewRatio.querySelector('li:last-child > span') as HTMLSpanElement;
        reviewRatioTxt && (reviewRatioTxt.innerText = ratio.toString());
      }
      positiveMin.addEventListener("input", minRatioCalc);
      positiveMax.addEventListener("input", maxRatioCalc);
      negativeMin.addEventListener("input", minRatioCalc);
      negativeMax.addEventListener("input", maxRatioCalc);
    })();

    /* SubmitEvent 핸들링 */
    (() => {
      const form = content.querySelector("form") as HTMLFormElement;
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formDataObj = Object.fromEntries(new FormData(form)) as IFormConfig;
        const validationResult = await this.validate(formDataObj);
        if (!validationResult.ok) {
          for (const [key, errorMsg] of Object.entries(
            validationResult.errors,
          )) {
            await this.setFormError(key, errorMsg);
          }
          form.reportValidity();
          return;
        }
        this.settings = await this.transform(formDataObj);
        await this.saveConfig();
      });
    })();

    this.inputs = Array.from(content.querySelectorAll("input,select,textarea"));
    await this.loadConfig();

    return content;
  }

  async unmountContent() {}
}

class Tab {
  /**
   *
   * @type {{ [tabId: toString]: [HTMLButtonElement, HTMLDivElement] }} [selectBtn, tabDiv]
   */
  tabs: Record<string, [HTMLButtonElement, HTMLDivElement]> = {};
  input;

  constructor(tabs: typeof this.tabs, input: HTMLInputElement) {
    this.tabs = tabs;
    this.input = input;
    this.applyEvents();
  }

  setTab(tabId: keyof typeof this.tabs) {
    this.input.value = tabId;
    this.tabs[tabId][0].classList.add("selected")
    this.tabs[tabId][1].classList.add("selected");
    for (const tabElementExceptThis of Object.entries(this.tabs)
      .filter(([_tabId]) => _tabId !== tabId)
      .map(([_, l]) => l)) {
      tabElementExceptThis[0].classList.remove("selected");
      tabElementExceptThis[1].classList.remove("selected");
    }
  }

  applyEvents() {
    for (const [tabId, tabElement] of Object.entries(this.tabs)) {
      tabElement[0].addEventListener("click", () => this.setTab(tabId));
    }
  }
}
