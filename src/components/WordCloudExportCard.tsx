import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import WordCloud from 'wordcloud';
import { buildWordCloudList, colorForWord, getWordCloudLayout } from '../lib/wordCloudText';
import type { ExportLog } from '../types/log';

const CLOUD_WIDTH = 1580;
const CLOUD_HEIGHT = 820;

export interface WordCloudExportHandle {
  waitForRender: () => Promise<void>;
}

interface WordCloudExportCardProps {
  year: number;
  month: number;
  logs: ExportLog[];
  theme: 'light' | 'dark';
}

export const WordCloudExportCard = memo(
  forwardRef<WordCloudExportHandle, WordCloudExportCardProps>(function WordCloudExportCard(
    { year, month, logs, theme },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderedRef = useRef(false);
    const pendingResolveRef = useRef<(() => void) | null>(null);

    const wordList = useMemo(() => buildWordCloudList(logs), [logs]);
    const monthName = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long' });

    useImperativeHandle(ref, () => ({
      waitForRender: () =>
        new Promise<void>((resolve) => {
          if (renderedRef.current) {
            resolve();
            return;
          }
          pendingResolveRef.current = resolve;
        }),
    }));

    useEffect(() => {
      renderedRef.current = false;
      const canvas = canvasRef.current;
      if (!canvas) return undefined;

      const handleComplete = () => {
        renderedRef.current = true;
        pendingResolveRef.current?.();
        pendingResolveRef.current = null;
      };

      canvas.addEventListener('wordcloudstop', handleComplete);

      if (wordList.length === 0) {
        const ctx = canvas.getContext('2d');
        canvas.width = CLOUD_WIDTH;
        canvas.height = CLOUD_HEIGHT;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, CLOUD_WIDTH, CLOUD_HEIGHT);
          ctx.fillStyle = '#8b6914';
          ctx.font = '600 28px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('No words to show yet', CLOUD_WIDTH / 2, CLOUD_HEIGHT / 2);
        }
        handleComplete();
        return () => canvas.removeEventListener('wordcloudstop', handleComplete);
      }

      canvas.width = CLOUD_WIDTH;
      canvas.height = CLOUD_HEIGHT;

      const layout = getWordCloudLayout(wordList.length);

      WordCloud(canvas, {
        list: wordList,
        backgroundColor: '#ffffff',
        gridSize: layout.gridSize,
        weightFactor: (size) => Math.pow(size, 1.5) * layout.weightScale,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: '700',
        color: (word) => colorForWord(word),
        minSize: layout.minSize,
        rotateRatio: 0.42,
        rotationSteps: 2,
        minRotation: -Math.PI / 2,
        maxRotation: Math.PI / 2,
        shuffle: false,
        drawOutOfBound: false,
        shrinkToFit: true,
        shape: 'circle',
        ellipticity: 1.35,
      });

      return () => {
        canvas.removeEventListener('wordcloudstop', handleComplete);
        WordCloud.stop();
      };
    }, [wordList]);

    return (
      <div className="story-export story-export--wordcloud" data-theme={theme}>
        <div className="story-export__backdrop" aria-hidden="true">
          <div className="story-export__orb story-export__orb--warm" />
          <div className="story-export__orb story-export__orb--soft" />
          <div className="story-export__grain" />
        </div>

        <div className="story-export__inner">
          <header className="story-export__title-block">
            <p className="story-export__month">{monthName}</p>
            <p className="story-export__year">{year}</p>
            <div className="story-export__rule" aria-hidden="true">
              <span className="story-export__rule-line" />
              <span className="story-export__rule-dot" />
              <span className="story-export__rule-line" />
            </div>
          </header>

          <div className="story-export__panel story-export__panel--wordcloud">
            <div className="story-export__panel-shine" aria-hidden="true" />
            <canvas
              ref={canvasRef}
              className="story-export__wordcloud-canvas"
              width={CLOUD_WIDTH}
              height={CLOUD_HEIGHT}
              aria-hidden="true"
            />
          </div>

          <footer className="story-export__footer">everyday</footer>
        </div>
      </div>
    );
  }),
);
