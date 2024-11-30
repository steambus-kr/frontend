export interface GameInfoResponse {
  app_id: number;
  title: string;
  description: string;
  owner_min: number;
  release_date: string;
  player_count: {
    latest: {
      count: number;
      date: number;
    } | null;
    peak: {
      count: number;
      date: number;
    } | null;
  };
  thumbnail_src: string;
  review: {
    positive: number;
    negative: number;
    ratio: number;
  };
  genres: string[];
}

// https://github.com/steambus-kr/backend/blob/main/src/types.ts#L57
export interface IFilter {
  owner_min: number;
  player_min: number;
  player_max: number;
  positive_review_min: number;
  positive_review_max: number;
  negative_review_min: number;
  negative_review_max: number;
  review_ratio_min: number;
  review_ratio_max: number;
  genre: string;
}

export interface IConfig {
  owner_min: number | null;
  player_min: number | null;
  player_max: number | null;
  review_tab: "simple" | "advanced";
  review_selection_min: number;
  review_selection_max: number;
  positive_min: number | null;
  positive_max: number | null;
  negative_min: number | null;
  negative_max: number | null;
}

export type IFormConfig = Record<keyof IConfig, string>;

