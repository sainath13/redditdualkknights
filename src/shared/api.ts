export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
  levelData?: string;
};

export type PublishLevelRequest = {
  title: string;
  levelData: string;
};

export type PublishLevelResponse = {
  type: 'publish_level';
  postId: string;
  url: string;
};

export type SubmitScoreRequest = {
  score: number;
};

export type SubmitScoreResponse = {
  type: 'submit_score';
  score: number;
  personalBest: boolean;
};

export type LeaderboardEntry = {
  member: string;
  score: number;
};

export type LeaderboardResponse = {
  type: 'leaderboard';
  scores: LeaderboardEntry[];
};

export type IncrementResponse = {
  type: "increment";
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: "decrement";
  postId: string;
  count: number;
};
