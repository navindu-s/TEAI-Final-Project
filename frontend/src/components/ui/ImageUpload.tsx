import { Image as ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Tea image" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  return (
    <div>
      <div className="label-xs mb-1.5">{label}</div>
      {preview ? (
        <div className="relative overflow-hidden rounded border border-zinc-800">
          <img src={preview} alt="upload preview" className="w-full max-h-72 object-contain bg-zinc-950" />
          <button
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded bg-black/70 p-1.5 text-zinc-200 ring-1 ring-zinc-700 hover:bg-black/90"
            aria-label="clear image"
          >
            <X size={14} />
          </button>
          <div className="px-3 py-1.5 text-[11px] font-mono text-zinc-400">
            {value!.name} · {(value!.size / 1024).toFixed(1)} KB
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-8 text-zinc-400 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-300"
        >
          <ImageIcon size={28} />
          <div className="text-[12px]">Click to upload an image</div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <Upload size={10} /> jpg · png · webp
          </div>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
