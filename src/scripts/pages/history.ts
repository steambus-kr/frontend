import BasePage from "../lib.js";
import type {GameInfoResponse} from "../types.js";

async function templateHandler(originalText: string, templateObj: Record<string, string | number>) {
  let newText = originalText;
  for (const [key, value] of Object.entries(templateObj)) {
    newText = newText.replaceAll(`{{${key}}}`, value.toString());
  }
  return newText;
}

const ReviewSummaryEnum = {
  0: {
    code: "overwhelmingly-positive",
    ko: "압도적으로 긍정적",
  },
  1: {
    code: "very-positive",
    ko: "매우 긍정적",
  },
  2: {
    code: "positive",
    ko: "긍정적",
  },
  3: {
    code: "mostly-positive",
    ko: "대체로 긍정적",
  },
  4: {
    code: "mixed",
    ko: "복합적",
  },
  5: {
    code: "mostly-negative",
    ko: "대체로 부정적",
  },
  6: {
    code: "negative",
    ko: "부정적",
  },
  7: {
    code: "very-negative",
    ko: "매우 부정적",
  },
  8: {
    code: "overwhelmingly-negative",
    ko: "압도적으로 부정적",
  },
  9: {
    code: "none",
    ko: "-",
  },
};

async function reviewSummary(reviewRatio: number, reviewCount: number) {
  if (reviewCount < 10) return 9;
  if (reviewRatio >= 0.95 && reviewCount >= 500) {
    return 0;
  }
  if (reviewRatio >= 0.8 && reviewCount >= 50) {
    return 1;
  }
  if (reviewRatio >= 0.8) {
    return 2;
  }
  if (reviewRatio >= 0.7) {
    return 3;
  }
  if (reviewRatio >= 40) {
    return 4;
  }
  if (reviewRatio >= 20) {
    return 5;
  }
  if (reviewCount >= 500) {
    return 8;
  }
  if (reviewCount >= 50) {
    return 7;
  }
  return 6;
}

export default class HistoryPage extends BasePage {
  historyItemElements: HTMLElement[] = [];

  constructor(index: number) {
    super("history", "History - Steambus", index);
  }

  async removeFromHistory(appId: number) {
    const historyItems = JSON.parse(localStorage.getItem("history") ?? "[]");
    const newHistoryItems = historyItems.filter((item: GameInfoResponse) => item.app_id !== appId);
    localStorage.setItem("history", JSON.stringify(newHistoryItems));
    const willBeRemoved = document.querySelector(
      `.history-item[data-app_id="${appId}"]`,
    ) as HTMLElement;
    const transitionBox = document.createElement('div');
    transitionBox.classList.add('remove-transition-box');
    const b = willBeRemoved.getBoundingClientRect()
    transitionBox.style.setProperty(
      '--width',
      b.width + 'px'
    )
    transitionBox.style.setProperty(
      '--height',
      b.height + 'px',
    )
    willBeRemoved.insertAdjacentElement('afterend', transitionBox);
    willBeRemoved.style.position = 'fixed';
    willBeRemoved.style.top = `${b.y}px`;
    willBeRemoved.style.left = `${b.x}px`;
    willBeRemoved.style.width = `${b.width}px`;
    willBeRemoved.style.height = `${b.height}px`;
    willBeRemoved.classList.add("remove-transition");
    (document.querySelector(`.summary > span`) as HTMLSpanElement).innerText = `${newHistoryItems.length}개 기록됨`;
    setTimeout(() => {
      // after transition
      willBeRemoved.remove();
      transitionBox.remove();
      this.historyItemElements = this.historyItemElements.filter((item) => item.dataset.app_id !== appId.toString());
      void this.updateIndex()
    }, 800)
  }

  async updateIndex() {
    for (const [idx, historyItem] of Object.entries(this.historyItemElements)) {
      historyItem.style.setProperty("--index", idx);
    }
  }

  async removeAll() {
    localStorage.removeItem("history");
    document.querySelectorAll(".history-item").forEach((item) => item.remove());
    (document.querySelector(`.summary > span`) as HTMLSpanElement).innerText = `0개 기록됨`;
  }

  async mountContent() {
    const historyItems: (GameInfoResponse & {datetime: Date})[] = JSON.parse(localStorage.getItem("history") ?? "[]");

    const content = document.createElement("div");
    content.innerHTML = await this.loadHTML().then(async (text) => text.replace("{{history_length}}", historyItems.length.toString()));
    (content.querySelector("button.delete") as HTMLButtonElement).addEventListener("click", () => {
      this.removeAll()
    })

    const historyItemHTML = await this.loadHTML('item')
    const historyContainer = content.querySelector(".game-container") as HTMLElement;

    for (const historyItem of historyItems) {
      const reviewInfo = await reviewSummary(
        historyItem.review.ratio,
        historyItem.review.positive + historyItem.review.negative,
      );
      const historyItemElement = document.createElement("article");
      historyItemElement.classList.add("history-item");
      historyItemElement.dataset.app_id = historyItem.app_id.toString();
      historyItemElement.innerHTML = await templateHandler(historyItemHTML, {
        title: historyItem.title,
        app_id: historyItem.app_id,
        genres: historyItem.genres.join(", "),
        review_summary: ReviewSummaryEnum[reviewInfo].ko,
        review_total: historyItem.review.positive + historyItem.review.negative,
        review_percentage: `${Math.round(historyItem.review.ratio * 10000) / 100}%`,
        history_datetime: new Intl.DateTimeFormat("ko", {}).format(
          new Date(historyItem.datetime),
        ),
      });
      const thumbnailContainer = historyItemElement.querySelector("div.thumbnail")!;
      function thumbnailFailure() {
        const failureContainer = document.createElement("div");
        failureContainer.classList.add("fail");
        failureContainer.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 48 48\"><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"4\" d=\"M10 44h28a2 2 0 0 0 2-2V14H30V4H10a2 2 0 0 0-2 2v36a2 2 0 0 0 2 2M30 4l10 10m-22 8l12 12m0-12L18 34\"/></svg>"
        const message = document.createElement("span");
        message.innerText = "이미지를 불러올 수 없습니다."
        failureContainer.appendChild(message);
        thumbnailContainer.appendChild(failureContainer);
      }
      fetch(historyItem.thumbnail_src).then(async (r) => {
        if (!r.ok) {
          thumbnailFailure();
        } else {
          const i = document.createElement("img");
          i.src = URL.createObjectURL(await r.blob())
          thumbnailContainer.appendChild(i);
        }
        thumbnailContainer.classList.remove("img-loading");
      }).catch(thumbnailFailure).finally(() => thumbnailContainer.classList.remove("img-loading"));
      (historyItemElement.querySelector(`button.delete`) as HTMLButtonElement).addEventListener("click", () => {
        this.removeFromHistory(historyItem.app_id);
      })
      historyContainer.appendChild(historyItemElement);
      this.historyItemElements.push(historyItemElement);
    }

    return content;
  }

  async unmountContent() {
    this.historyItemElements = [];
  }
}
