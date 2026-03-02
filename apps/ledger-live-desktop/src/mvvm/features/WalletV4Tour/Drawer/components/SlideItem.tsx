import React from "react";

interface SlideItemProps {
  readonly title: string;
  readonly description: string;
}

export function SlideItem({ title, description }: SlideItemProps) {
  return (
    <div className="flex size-full flex-col">
      <div
        className="flex flex-1 flex-col items-center px-20"
        style={{ gap: 30, paddingBottom: 8 }}
      >
        <div
          className="flex h-[240px] w-full shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "var(--color-neutral-c20, #f0f0f0)" }}
        >
          <svg width="64" height="64" viewBox="0 0 48 48" fill="none" style={{ color: "#999" }}>
            <rect
              x="6"
              y="10"
              width="36"
              height="28"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="18" cy="22" r="4" stroke="currentColor" strokeWidth="2" />
            <path
              d="M6 32l10-8 6 5 8-10 12 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div
          className="flex animate-fade-in flex-col items-center text-center"
          style={{ pointerEvents: "none" }}
        >
          <div>
            <h3 className="m-0 mb-8 heading-4-semi-bold text-base">{title}</h3>
            <p className="m-0 body-2 text-muted">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
