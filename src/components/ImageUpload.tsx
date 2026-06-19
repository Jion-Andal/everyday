import { useRef, useState } from 'react';

interface ImageUploadProps {
  preview: string | null;
  onChange: (file: File | null, preview: string | null) => void;
}

export function ImageUpload({ preview, onChange }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(file, reader.result as string);
    };
    reader.readAsDataURL(file);
    setMenuOpen(false);
  };

  const clear = () => {
    onChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
          <p className="image-upload__hint">A photo from today, if you like.</p>
          <div className="image-upload__buttons">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setMenuOpen((o) => !o)}
            >
              Add photo
            </button>
            {menuOpen && (
              <div className="image-upload__menu">
                <button
                  type="button"
                  className="image-upload__menu-item"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Take a photo
                </button>
                <button
                  type="button"
                  className="image-upload__menu-item"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload from gallery
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
