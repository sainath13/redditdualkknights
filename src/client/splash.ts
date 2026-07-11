import { requestExpandedMode } from '@devvit/web/client';

const startButton = document.getElementById('start-button') as HTMLButtonElement;

startButton.addEventListener('click', (e) => {
  requestExpandedMode(e, 'game');
});

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
  fetchStats();
}

init();

document.body.addEventListener('mousedown', () => document.body.classList.add('clicking'));
document.body.addEventListener('mouseup', () => document.body.classList.remove('clicking'));
document.body.addEventListener('mouseleave', () => document.body.classList.remove('clicking'));
