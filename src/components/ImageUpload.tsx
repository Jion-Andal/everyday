import { useRef, useState } from 'react';
import { isImageFile, processUploadImage } from '../utils/processUploadImage';

interface ImageUploadProps {
  preview: string | null;
  onChange: (file: File | null, preview: string | null) => void;
}

export function ImageUpload({ preview, onChange }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || !isImageFile(file)) return;

    setProcessing(true);
    try {
      const { file: compressedFile, preview: compressedPreview } = await processUploadImage(file);
      onChange(compressedFile, compressedPreview);
    } finally {
      setProcessing(false);
    }
  };

  const clear = () => {
    onChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="image-upload">
      <label className="field-label">A moment from today</label>
      {preview ? (
        <div className="image-upload__preview-wrap">
          <img src={preview} alt="Preview" className="image-upload__preview" />
          <button type="button" className="image-upload__remove" onClick={clear}>
            Remove
          </button>
        </div>
      ) : (
        <div className="image-upload__actions">
          <button
            type="button"
            className="btn btn--secondary image-upload__add"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            {processing ? 'Processing photo...' : 'Add photo'}
          </button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
