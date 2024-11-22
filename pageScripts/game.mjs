import BasePage from "../lib/base.mjs";

async function templateHandler(originalText, templateObj) {
  for (const [key, value] of Object.entries(templateObj)) {
    originalText = originalText.replaceAll(`{{${key}}}`, value);
  }
  return originalText;
}

const ReviewSummaryEnum = {
  0: {
    code: 'overwhelmingly-positive',
    ko: "압도적으로 긍정적"
  },
  1: {
    code: 'very-positive',
    ko: "매우 긍정적"
  },
  2: {
    code: 'positive',
    ko: '긍정적'
  },
  3: {
    code: 'mostly-positive',
    ko: "대체로 긍정적"
  },
  4: {
    code: 'mixed',
    ko: "복합적"
  },
  5: {
    code: 'mostly-negative',
    ko: "대체로 부정적"
  },
  6: {
    code: 'negative',
    ko: '부정적'
  },
  7: {
    code: 'very-negative',
    ko: "매우 부정적"
  },
  8: {
    code: 'overwhelmingly-negative',
    ko: '압도적으로 부정적'
  },
  9: {
    code: 'none',
    ko: '-'
  }
}

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

export default class GamePage extends BasePage {
  constructor() {
    super("game", "Game - Steambus")
  }

  async mountContent() {
    const container = document.createElement("div");

    async function ErrorDescriptionHandler(title, description) {
      const titleElm = document.createElement("h1");
      const descriptionElm = document.createElement("p");
      titleElm.innerText = title;
      descriptionElm.innerText = description;
      container.appendChild(titleElm);
      container.appendChild(descriptionElm);
    }

    async function NotFoundHandler() {
      await ErrorDescriptionHandler("404", "필터에 맞는 게임을 찾을 수 없습니다. 더 많은 게임이 포함되도록 필터를 조정하고 다시 시도해보세요.");
    }

    async function TooManyRequestHandler() {
      await ErrorDescriptionHandler("429", "짧은 시간에 너무 많은 요청이 시도되었습니다. 조금 뒤 다시 시도해주세요.");
    }

    async function UnexpectedErrorHandler() {
      await ErrorDescriptionHandler("500", "서버에서 알 수 없는 오류가 발생했습니다. 관리자에게 문의하거나 조금 뒤에 다시 시도해보세요.");
    }

    try {
      const gameInfo = await fetch("https://steambus.kr/api/game/recommend", {
        method: "POST",
        body: JSON.stringify({
          exclude: [],
          filter: {},
        })
      })

      if (!gameInfo.ok) {
        switch (gameInfo.status) {
          case 404:
            await NotFoundHandler();
            break;
          case 429:
            await TooManyRequestHandler();
            break;
          default:
            await UnexpectedErrorHandler();
        }

        return container;
      }

      /**
       * @type {
       *   {
       *     app_id: number;
       *     title: string;
       *     description: string;
       *     owner_min: number;
       *     release_date: string;
       *     player_count: {
       *       latest: {
       *         count: number;
       *         date: number;
       *       } | null;
       *       peak: {
       *         count: number;
       *         date: number;
       *       } | null;
       *     };
       *     thumbnail_src: string;
       *     review: {
       *       positive: number;
       *       negative: number;
       *       ratio: number;
       *     };
       *     genres: string[];
       *   }
       * }
       */
      const gameInfoJson = await gameInfo.json();
      const reviewInfo = await reviewSummary(gameInfoJson.review.ratio, gameInfoJson.review.positive + gameInfoJson.review.negative);
      container.innerHTML = await fetch(`/pageScripts/game.html`).then(async res => await templateHandler(await res.text(), {
        genres: gameInfoJson.genres.join(', '),
        title: gameInfoJson.title,
        app_id: gameInfoJson.app_id,
        description: gameInfoJson.description,
        thumbnail_src: gameInfoJson.thumbnail_src,
        current_player: gameInfoJson.player_count.latest?.count || '-',
        peak_player: gameInfoJson.player_count.peak?.count || '-',
        owner_min: gameInfoJson.owner_min,
        release_date: gameInfoJson.release_date,
        review_summary_ko: ReviewSummaryEnum[reviewInfo].ko,
        review_summary_code: ReviewSummaryEnum[reviewInfo].code,
        review_positive: gameInfoJson.review.positive,
        review_negative: gameInfoJson.review.negative,
      }));
    } catch (e) {
      console.error(e);
      await UnexpectedErrorHandler();
    }
    return container;
  }

  async unmountContent() {}
}