declare module 'wordcloud' {
  interface WordCloudOptions {
    list?: [string, number][];
    fontFamily?: string;
    fontWeight?: string | number;
    color?:
      | string
      | ((
          word: string,
          weight: number,
          fontSize: number,
          distance: number,
          theta: number,
        ) => string);
    minSize?: number;
    weightFactor?: number | ((size: number) => number);
    clearCanvas?: boolean;
    backgroundColor?: string;
    gridSize?: number;
    origin?: [number, number];
    drawOutOfBound?: boolean;
    shrinkToFit?: boolean;
    minRotation?: number;
    maxRotation?: number;
    rotationSteps?: number;
    shuffle?: boolean;
    rotateRatio?: number;
    shape?: string;
    ellipticity?: number;
  }

  interface WordCloudStatic {
    (element: HTMLCanvasElement | HTMLCanvasElement[], options: WordCloudOptions): void;
    isSupported: boolean;
    minFontSize: number;
    stop: () => void;
  }

  const WordCloud: WordCloudStatic;
  export default WordCloud;
}
