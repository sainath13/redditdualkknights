import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  DecrementResponse,
  IncrementResponse,
  InitResponse,
  PublishLevelRequest,
  PublishLevelResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
  LeaderboardResponse,
} from '../../shared/api';
import { createPost } from '../core/post';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required but missing from context',
      },
      400
    );
  }

  try {
    const [count, username, levelData] = await Promise.all([
      redis.get('count'),
      reddit.getCurrentUsername(),
      redis.get(`level_${postId}`)
    ]);

    return c.json<InitResponse>({
      type: 'init',
      postId: postId,
      count: count ? parseInt(count) : 0,
      username: username ?? 'anonymous',
      levelData: levelData ?? undefined,
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    return c.json<ErrorResponse>(
      { status: 'error', message: errorMessage },
      400
    );
  }
});

api.post('/increment', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', 1);
  return c.json<IncrementResponse>({
    count,
    postId,
    type: 'increment',
  });
});

api.post('/decrement', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', -1);
  return c.json<DecrementResponse>({
    count,
    postId,
    type: 'decrement',
  });
});

api.post('/publish-level', async (c) => {
  const { title, levelData } = await c.req.json<PublishLevelRequest>();
  if (!title || !levelData) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'title and levelData are required' },
      400
    );
  }

  try {
    const post = await createPost(title);
    
    // Store level data in Redis using the new post's ID
    await redis.set(`level_${post.id}`, levelData);

    return c.json<PublishLevelResponse>({
      type: 'publish_level',
      postId: post.id,
      url: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error('Error publishing level:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to publish custom level' },
      500
    );
  }
});

api.post('/submit-score', async (c) => {
  const { postId } = context;
  const { score } = await c.req.json<SubmitScoreRequest>();
  
  if (!postId) return c.json<ErrorResponse>({ status: 'error', message: 'postId is required' }, 400);
  if (typeof score !== 'number') return c.json<ErrorResponse>({ status: 'error', message: 'score is required' }, 400);

  const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
  const leaderboardKey = `leaderboard_${postId}`;

  try {
    const currentScore = await redis.zScore(leaderboardKey, username);
    let personalBest = false;

    if (currentScore === undefined || score < currentScore) {
      await redis.zAdd(leaderboardKey, { member: username, score });
      personalBest = true;
    }

    return c.json<SubmitScoreResponse>({
      type: 'submit_score',
      score,
      personalBest
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to submit score' }, 500);
  }
});

api.get('/leaderboard', async (c) => {
  const { postId } = context;
  
  if (!postId) return c.json<ErrorResponse>({ status: 'error', message: 'postId is required' }, 400);

  const leaderboardKey = `leaderboard_${postId}`;

  try {
    // Get top 10 players (lowest scores)
    const topScores = await redis.zRange(leaderboardKey, 0, 9, { by: 'rank' });
    return c.json<LeaderboardResponse>({
      type: 'leaderboard',
      scores: topScores
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to fetch leaderboard' }, 500);
  }
});
