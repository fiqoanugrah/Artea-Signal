"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, Video } from "lucide-react";

type Preview = {
  name: string;
  type: string;
  url: string;
};

export function EvidencePicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [files, setFiles] = useState<File[]>([]);

  const previews = useMemo<Preview[]>(
    () =>
      files.map((file) => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      })),
    [files]
  );
  const activePreview = previews[activeIndex] || previews[0];

  function handleFiles(nextFiles: FileList | null) {
    const incoming = Array.from(nextFiles || []);
    const merged = [...files, ...incoming];
    syncInputFiles(merged);
    setFiles(merged);
    setActiveIndex(Math.max(0, merged.length - incoming.length));
  }

  function removeActive() {
    const nextFiles = files.filter((_, index) => index !== activeIndex);
    syncInputFiles(nextFiles);
    setFiles(nextFiles);
    setActiveIndex((index) => Math.max(0, Math.min(index, nextFiles.length - 1)));
  }

  function syncInputFiles(nextFiles: File[]) {
    if (!inputRef.current) {
      return;
    }

    const transfer = new DataTransfer();
    nextFiles.forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
  }

  return (
    <aside className="submit-evidence-card">
      <div className="upload-control">
        <div>
          <span className="eyebrow evidence-eyebrow">
            <ImagePlus size={14} />
            Evidence
          </span>
          <h2>Attach visual proof</h2>
          <p>Screenshots, photos, atau video bisa lebih dari satu.</p>
        </div>
        <input
          accept="image/*,video/*"
          id="evidence"
          multiple
          name="evidence"
          onChange={(event) => handleFiles(event.target.files)}
          ref={inputRef}
          type="file"
        />
      </div>

      <div className="evidence-preview-panel">
        <div className="console-header">
          <span>Evidence preview</span>
          <span>{files.length} files</span>
        </div>
        {activePreview ? (
          <div className="evidence-carousel">
            <figure className="evidence-preview evidence-preview-large">
              {activePreview.type.startsWith("video/") ? (
                <video controls muted src={activePreview.url} />
              ) : (
                <img alt="" src={activePreview.url} />
              )}
              <figcaption>
                {activePreview.type.startsWith("video/") ? <Video size={13} /> : <ImagePlus size={13} />}
                <span>{activePreview.name}</span>
              </figcaption>
            </figure>
            <div className="carousel-actions">
              <button
                className="icon-button"
                disabled={previews.length <= 1}
                onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                type="button"
              >
                <ChevronLeft size={17} />
              </button>
              <span className="filter-pill">
                {activeIndex + 1} / {previews.length}
              </span>
              <button
                className="icon-button"
                disabled={previews.length <= 1}
                onClick={() => setActiveIndex((index) => Math.min(previews.length - 1, index + 1))}
                type="button"
              >
                <ChevronRight size={17} />
              </button>
              <button className="icon-button danger-icon" onClick={removeActive} type="button">
                <Trash2 size={16} />
              </button>
            </div>
            {previews.length > 1 ? (
              <div className="evidence-strip">
                {previews.map((preview, index) => (
                  <button
                    className={index === activeIndex ? "strip-thumb active" : "strip-thumb"}
                    key={preview.url}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  >
                    {preview.type.startsWith("video/") ? <Video size={16} /> : <img alt="" src={preview.url} />}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="empty-preview">
            <ImagePlus size={26} />
            <p>Upload multiple images or videos. Preview akan muncul di sini sebelum submit.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
