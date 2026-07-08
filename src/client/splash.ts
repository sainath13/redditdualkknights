import { navigateTo, context, requestExpandedMode } from '@devvit/web/client';

const docsLink = document.getElementById('docs-link') as HTMLDivElement;
const playtestLink = document.getElementById('playtest-link') as HTMLDivElement;
const discordLink = document.getElementById('discord-link') as HTMLDivElement;
const startButton = document.getElementById('start-button') as HTMLButtonElement;

startButton.addEventListener('click', (e) => {
  requestExpandedMode(e, 'game');
});

docsLink.addEventListener('click', () => {
  navigateTo('https://developers.reddit.com/docs');
});

playtestLink.addEventListener('click', () => {
  navigateTo('https://www.reddit.com/r/Devvit');
});

discordLink.addEventListener('click', () => {
  navigateTo('https://discord.com/invite/R7yu2wh9Qz');
});

const titleElement = document.getElementById('title') as HTMLHeadingElement;
const statsElement = document.getElementById('stats-text') as HTMLParagraphElement;

async function fetchStats() {
  try {
    const res = await fetch('/api/leaderboard');
    if (res.ok) {
      const data = await res.json();
      const attempts = data.attempts || 0;
      const solves = data.solves || 0;
      statsElement.textContent = `Global Stats: ${attempts} Plays | ${solves} Solves`;
    }
  } catch (e) {
    console.error('Failed to fetch stats:', e);
  }
}

function init() {
  titleElement.textContent = `Hey ${context.username ?? 'user'} 👋`;
  fetchStats();
}

init();
