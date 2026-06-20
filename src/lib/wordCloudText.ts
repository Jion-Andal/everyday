import type { ExportLog } from '../types/log';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'being',
  'but',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'for',
  'from',
  'had',
  'has',
  'have',
  'he',
  'her',
  'here',
  'him',
  'his',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'me',
  'my',
  'no',
  'not',
  'of',
  'on',
  'or',
  'our',
  'out',
  'she',
  'so',
  'some',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'they',
  'this',
  'to',
  'too',
  'up',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'will',
  'with',
  'would',
  'you',
  'your',
]);

const WORD_OF_DAY_WEIGHT = 8;
const JOURNAL_MAX_WORDS = 60;

function tokenizeJournal(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'-]+/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
}

/** Each word-of-the-day entry as a single phrase (one per logged day). */
export function getWordOfDayEntries(text: string): string[] {
  const phrase = text.trim();
  return phrase ? [phrase] : [];
}

export function hasWordOfDayWords(logs: ExportLog[]): boolean {
  return logs.some((log) => log.wordOfDay.trim().length > 0);
}

export function buildWordCloudList(logs: ExportLog[]): [string, number][] {
  const counts = new Map<string, number>();
  const displayForm = new Map<string, string>();
  const fromWordOfDay = new Set<string>();

  for (const log of logs) {
    for (const phrase of getWordOfDayEntries(log.wordOfDay)) {
      const key = phrase.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + WORD_OF_DAY_WEIGHT);
      fromWordOfDay.add(key);
      if (!displayForm.has(key)) displayForm.set(key, phrase);
    }
  }

  const journalCounts = new Map<string, number>();
  const journalDisplay = new Map<string, string>();

  for (const log of logs) {
    for (const token of tokenizeJournal(log.whatHappened)) {
      const key = token.toLowerCase();
      if (fromWordOfDay.has(key)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
        continue;
      }
      journalCounts.set(key, (journalCounts.get(key) ?? 0) + 1);
      if (!journalDisplay.has(key)) journalDisplay.set(key, token);
    }
  }

  const journalEntries = Array.from(journalCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, JOURNAL_MAX_WORDS);

  for (const [key, weight] of journalEntries) {
    counts.set(key, weight);
    displayForm.set(key, journalDisplay.get(key)!);
  }

  return Array.from(counts.entries())
    .sort((a, b) => {
      const aIsWordOfDay = fromWordOfDay.has(a[0]);
      const bIsWordOfDay = fromWordOfDay.has(b[0]);
      if (aIsWordOfDay !== bIsWordOfDay) return aIsWordOfDay ? -1 : 1;
      return b[1] - a[1];
    })
    .map(([key, weight]) => [displayForm.get(key)!, weight]);
}

export function getWordCloudLayout(wordCount: number): {
  gridSize: number;
  weightScale: number;
  minSize: number;
} {
  const wordOfDayCount = wordCount;
  if (wordOfDayCount <= 12) {
    return { gridSize: 7, weightScale: 4.0, minSize: 20 };
  }
  if (wordOfDayCount <= 20) {
    return { gridSize: 6, weightScale: 3.3, minSize: 18 };
  }
  if (wordOfDayCount <= 31) {
    return { gridSize: 5, weightScale: 2.7, minSize: 16 };
  }
  if (wordOfDayCount <= 45) {
    return { gridSize: 4, weightScale: 2.2, minSize: 14 };
  }
  return { gridSize: 4, weightScale: 1.8, minSize: 13 };
}

export const WORD_CLOUD_COLORS = [
  '#1b4332',
  '#2d5016',
  '#606c38',
  '#a7c957',
  '#5c4033',
  '#8b6914',
  '#c9a87c',
  '#1a1a1a',
] as const;

export function colorForWord(word: string): string {
  let hash = 0;
  for (let i = 0; i < word.length; i += 1) {
    hash = word.charCodeAt(i) + ((hash << 5) - hash);
  }
  return WORD_CLOUD_COLORS[Math.abs(hash) % WORD_CLOUD_COLORS.length];
}
