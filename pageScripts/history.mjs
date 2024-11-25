import BasePage from "../lib/base.mjs";

async function templateHandler(originalText, templateObj) {
  let newText = originalText;
  for (const [key, value] of Object.entries(templateObj)) {
    newText = newText.replaceAll(`{{${key}}}`, value);
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

async function reviewSummary(reviewRatio, reviewCount) {
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
  constructor() {
    super("history", "History - Steambus");
  }

  async mountContent() {
    const historyItems = JSON.parse(localStorage.getItem("history") ?? "[]");

    const content = document.createElement("div");
    content.innerHTML = (
      await fetch("/pageScripts/history.html").then((r) => r.text())
    ).replace("{{history_length}}", historyItems.length);

    const historyItemHTML = await fetch("/pageScripts/history-item.html").then(
      (r) => r.text(),
    );
    const historyContainer = content.querySelector(".game-container");

    for (const [idx, historyItem] of Object.entries(historyItems)) {
      const reviewInfo = await reviewSummary(
        historyItem.review.ratio,
        historyItem.review.positive + historyItem.review.negative,
      );
      const historyItemElement = document.createElement("article");
      historyItemElement.classList.add("history-item");
      historyItemElement.style.setProperty("--index", idx);
      historyItemElement.innerHTML = await templateHandler(historyItemHTML, {
        title: historyItem.title,
        app_id: historyItem.app_id,
        genres: historyItem.genres.join(", "),
        thumbnail_src: historyItem.thumbnail_src,
        review_summary: ReviewSummaryEnum[reviewInfo].ko,
        review_total: historyItem.review.positive + historyItem.review.negative,
        review_percentage: `${Math.round(historyItem.review.ratio * 10000) / 100}%`,
        history_datetime: new Intl.DateTimeFormat("ko", {}).format(
          new Date(historyItem.datetime),
        ),
      });
      historyContainer.appendChild(historyItemElement);
    }

    return content;
  }

  async unmountContent() {}
}
