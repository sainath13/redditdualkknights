import { reddit, context } from '@devvit/web/server';

export const createPost = async (title: string = 'dual-knights') => {
  return await reddit.submitCustomPost({
    title: title,
    subredditName: context.subredditName,
  });
};
