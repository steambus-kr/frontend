import BasePage from "../lib.js";
import type { IFilter, GameInfoResponse, IConfig } from "../types";

async function templateHandler(originalText: string, templateObj: Record<string, string | number>) {
  for (const [key, value] of Object.entries(templateObj)) {
    originalText = originalText.replaceAll(`{{${key}}}`, value.toString());
  }
  return originalText;
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
}

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

export default class GamePage extends BasePage {
  constructor() {
    super("game", "Game - Steambus", {
      preventState: true,
    });
  }

  static HistoryKey = "history";

  async pushHistory(gameJson: GameInfoResponse & { datetime: number }) {
    const existingHistory = JSON.parse(
      localStorage.getItem(GamePage.HistoryKey) ?? "[]",
    );
    existingHistory.push(gameJson);
    localStorage.setItem(GamePage.HistoryKey, JSON.stringify(existingHistory));
  }

  async filterBuilder(obj: IConfig) {
    const filter: Partial<IFilter> = {};
    if (obj.owner_min) filter.owner_min = obj.owner_min;
    if (obj.player_min) filter.player_min = obj.player_min;
    if (obj.player_max) filter.player_max = obj.player_max;
    if (obj.review_tab === "simple") {
      switch (obj.review_selection_min) {
        case 1:
          filter.positive_review_min = 475;
          filter.review_ratio_min = 0.95;
          break;
        case 2:
          filter.positive_review_min = 40;
          filter.review_ratio_min = 0.8;
          break;
        case 3:
          filter.positive_review_min = 8;
          filter.review_ratio_min = 0.8;
          break;
        case 4:
          filter.positive_review_min = 7;
          filter.review_ratio_min = 0.7;
          break;
        case 5:
          filter.positive_review_min = 4;
          filter.review_ratio_min = 0.4;
          break;
        case 6:
          filter.positive_review_min = 2;
          filter.review_ratio_min = 0.2;
          break;
        case 7:
          filter.positive_review_max = 9;
          filter.review_ratio_min = 0.0;
          break;
        case 8:
          filter.positive_review_max = 94;
          filter.review_ratio_min = 0.0;
          break;
      }
      switch (obj.review_selection_max) {
        case 2:
          filter.review_ratio_max = 0.95;
          break;
        case 3:
          filter.positive_review_max = 49;
          break;
        case 4:
          filter.review_ratio_max = 0.79;
          break;
        case 5:
          filter.review_ratio_max = 0.69;
          break;
        case 6:
          filter.review_ratio_max = 0.39;
          break;
        case 7:
          filter.review_ratio_max = 0.19;
          filter.positive_review_min = 2;
          break;
        case 8:
          filter.review_ratio_max = 0.19;
          filter.positive_review_min = 9;
          break;
        case 9:
          filter.review_ratio_max = 0.19;
          filter.positive_review_min = 95;
          break;
      }
    } else if (obj.review_tab === "advanced") {
      if (obj.positive_min) filter.positive_review_min = obj.positive_min;
      if (obj.positive_max) filter.positive_review_max = obj.positive_max;
      if (obj.positive_min && obj.negative_min)
        filter.review_ratio_min =
          obj.positive_min / (obj.positive_min + obj.negative_min);
      if (obj.positive_max && obj.negative_max)
        filter.review_ratio_max =
          obj.positive_max / (obj.positive_max + obj.negative_max);
    }
    return filter;
  }

  async mountContent() {
    const container = document.createElement("div");

    async function ErrorDescriptionHandler(title: string, description: string) {
      container.classList.add("error");
      const titleElm = document.createElement("h1");
      const descriptionElm = document.createElement("p");
      titleElm.innerText = title;
      descriptionElm.innerText = description;
      container.appendChild(titleElm);
      container.appendChild(descriptionElm);
    }

    async function NotFoundHandler() {
      await ErrorDescriptionHandler(
        "404",
        "필터에 맞는 게임을 찾을 수 없습니다. 더 많은 게임이 포함되도록 필터를 조정하고 다시 시도해보세요.",
      );
    }

    async function TooManyRequestHandler() {
      await ErrorDescriptionHandler(
        "429",
        "짧은 시간에 너무 많은 요청이 시도되었습니다. 조금 뒤 다시 시도해주세요.",
      );
    }

    async function UnexpectedErrorHandler(code: string | number) {
      await ErrorDescriptionHandler(
        `${code}`,
        "알 수 없는 오류가 발생했습니다. 관리자에게 문의하거나 조금 뒤에 다시 시도해보세요.",
      );
    }

    try {
      const filter = await this.filterBuilder(
        JSON.parse(localStorage.getItem("settings") ?? "{}"),
      );

      const gameInfo = await fetch("/api/game/recommend", {
        method: "POST",
        body: JSON.stringify({
          exclude: [],
          filter: filter,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!gameInfo.ok) {
        switch (gameInfo.status) {
          case 404:
            await NotFoundHandler();
            break;
          case 429:
            await TooManyRequestHandler();
            break;
          default:
            await UnexpectedErrorHandler(gameInfo.status);
        }

        return container;
      }

      const gameInfoJson: GameInfoResponse = await gameInfo.json();
      await this.pushHistory({
        ...gameInfoJson,
        datetime: new Date().getTime(),
      });
      const reviewInfo = await reviewSummary(
        gameInfoJson.review.ratio,
        gameInfoJson.review.positive + gameInfoJson.review.negative,
      );
      container.innerHTML = await this.loadHTML().then(
        async (text) =>
          await templateHandler(text, {
            genres: gameInfoJson.genres.join(", "),
            title: gameInfoJson.title,
            app_id: gameInfoJson.app_id,
            description: gameInfoJson.description,
            thumbnail_src: gameInfoJson.thumbnail_src,
            current_player: gameInfoJson.player_count.latest?.count || "-",
            peak_player: gameInfoJson.player_count.peak?.count || "-",
            owner_min: gameInfoJson.owner_min,
            release_date: gameInfoJson.release_date,
            review_summary_ko: ReviewSummaryEnum[reviewInfo].ko,
            review_summary_code: ReviewSummaryEnum[reviewInfo].code,
            review_positive: gameInfoJson.review.positive,
            review_negative: gameInfoJson.review.negative,
          }),
      );
    } catch (e) {
      console.error(e);
      await UnexpectedErrorHandler("클라이언트 오류");
    }
    return container;
  }

  async unmountContent() {}
}
