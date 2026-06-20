const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(file.name);
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read image.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image.'));
    reader.readAsDataURL(blob);
  });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image.'));
    img.src = url;
  });
}

async function loadImageSource(
  source: Blob,
): Promise<{
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  cleanup?: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(source);
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, width, height) => ctx.drawImage(bitmap, 0, 0, width, height),
        cleanup: () => bitmap.close(),
      };
    } catch {
      /* Fall back to object URL + Image element. */
    }
  }

  const objectUrl = URL.createObjectURL(source);
  try {
    const img = await loadImageFromUrl(objectUrl);
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, width, height) => ctx.drawImage(img, 0, 0, width, height),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToJpegFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not compress image.'));
          return;
        }
        resolve(new File([blob], filename, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

async function compressImage(file: File): Promise<{ file: File; preview: string }> {
  const loaded = await loadImageSource(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(loaded.width, loaded.height));
    const targetWidth = Math.max(1, Math.round(loaded.width * scale));
    const targetHeight = Math.max(1, Math.round(loaded.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process image.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    loaded.draw(ctx, targetWidth, targetHeight);

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    const compressedFile = await canvasToJpegFile(canvas, `${baseName}.jpg`);
    const preview = await readBlobAsDataUrl(compressedFile);

    return { file: compressedFile, preview };
  } finally {
    loaded.cleanup?.();
  }
}

/** Resize and compress an image for storage. Falls back to the original file on failure. */
export async function processUploadImage(file: File): Promise<{ file: File; preview: string }> {
  try {
    return await compressImage(file);
  } catch (error) {
    console.error(error);
    const preview = await readBlobAsDataUrl(file);
    return { file, preview };
  }
}
