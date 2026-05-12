"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Video } from "lucide-react";
import { ReportMedia } from "@/lib/reports";

type EvidenceGalleryCarouselProps = {
  evidence: ReportMedia[];
};

export function EvidenceGalleryCarousel({ evidence }: EvidenceGalleryCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeEvidence = evidence[activeIndex] || evidence[0];

  if (!activeEvidence) {
    return null;
  }

  return (
    <div className="detail-evidence-carousel">
      <div className="detail-evidence-meta">
        <span>Evidence</span>
        <span>{evidence.length} files</span>
      </div>
      <figure className="detail-evidence-stage">
        {activeEvidence.mediaType === "video" ? (
          <video controls src={activeEvidence.url} />
        ) : (
          <img alt="" src={activeEvidence.url} />
        )}
        <figcaption>
          {activeEvidence.mediaType === "video" ? <Video size={14} /> : <ImagePlus size={14} />}
          <span>
            Evidence {activeIndex + 1} of {evidence.length}
          </span>
        </figcaption>
      </figure>

      <div className="detail-evidence-actions">
        <button
          className="icon-button detail-evidence-nav"
          disabled={activeIndex === 0}
          onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
          type="button"
        >
          <ChevronLeft size={17} />
        </button>
        <span className="detail-evidence-counter">
          {activeIndex + 1} / {evidence.length}
        </span>
        <button
          className="icon-button detail-evidence-nav"
          disabled={activeIndex === evidence.length - 1}
          onClick={() => setActiveIndex((index) => Math.min(evidence.length - 1, index + 1))}
          type="button"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {evidence.length > 1 ? (
        <div className="detail-evidence-strip">
          {evidence.map((item, index) => (
            <button
              className={index === activeIndex ? "strip-thumb active" : "strip-thumb"}
              key={item.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {item.mediaType === "video" ? <Video size={16} /> : <img alt="" src={item.url} />}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
