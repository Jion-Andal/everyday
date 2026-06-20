import { toPng } from 'html-to-image';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

async function downloadStoryPng(
  node: HTMLElement,
  year: number,
  month: number,
  kind: 'calendar' | 'wordcloud',
): Promise<void> {
  await waitForImages(node);

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const dataUrl = await toPng(node, {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    skipFonts: false,
  });

  const link = document.createElement('a');
  const monthStr = String(month + 1).padStart(2, '0');
  const uniqueId = crypto.randomUUID().slice(0, 8);
  link.download = `everyday-${year}-${monthStr}-${kind}-${uniqueId}.png`;
  link.href = dataUrl;
  link.click();
}

export async function downloadStoryScreenshot(
  node: HTMLElement,
  year: number,
  month: number,
): Promise<void> {
  await downloadStoryPng(node, year, month, 'calendar');
}

export async function downloadWordCloudScreenshot(
  node: HTMLElement,
  year: number,
  month: number,
): Promise<void> {
  await downloadStoryPng(node, year, month, 'wordcloud');
}
