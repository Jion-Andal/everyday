import { toPng } from 'html-to-image';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

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

export async function downloadStoryScreenshot(
  node: HTMLElement,
  year: number,
  month: number,
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
  link.download = `everyday-${year}-${monthStr}-story.png`;
  link.href = dataUrl;
  link.click();
}
