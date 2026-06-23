import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "LLD/utils/cn";
import { useCyclingPlaceholder } from "./useCyclingPlaceholder";

const TEXT_INSET = "pl-[44px] pr-[16px]";

type Props = Readonly<{
  visible: boolean;
  cycling: boolean;
  testId?: string;
}>;

function PhraseLayer({
  children,
  className,
  onAnimationEnd,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  onAnimationEnd?: () => void;
}>) {
  return (
    <span
      className={cn("absolute inset-0 flex items-center", TEXT_INSET, className)}
      onAnimationEnd={onAnimationEnd}
    >
      <span className="body-1 truncate text-muted">{children}</span>
    </span>
  );
}

export function AnimatedSearchPlaceholder({ visible, cycling, testId }: Props) {
  const { t } = useTranslation();

  const phrases = useMemo(
    () => [
      t("topBar.searchPlaceholders.crypto"),
      t("topBar.searchPlaceholders.stablecoins"),
      t("topBar.searchPlaceholders.stocks"),
      t("topBar.searchPlaceholders.addresses"),
    ],
    [t],
  );

  const { index, animate } = useCyclingPlaceholder(phrases.length, visible && cycling);

  const prevIndexRef = useRef(index);
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);

  if (prevIndexRef.current !== index) {
    setOutgoingIndex(prevIndexRef.current);
    prevIndexRef.current = index;
  }
  if (!animate && outgoingIndex !== null) {
    setOutgoingIndex(null);
  }

  const transitioning = animate && outgoingIndex !== null;

  return (
    <div
      aria-hidden
      data-testid={testId}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden transition-opacity",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <PhraseLayer
        key={index}
        className={transitioning ? "animate-search-placeholder-slide-in" : undefined}
      >
        {phrases[index]}
      </PhraseLayer>
      {transitioning && (
        <PhraseLayer
          key={outgoingIndex}
          className="animate-search-placeholder-slide-out"
          onAnimationEnd={() => setOutgoingIndex(null)}
        >
          {phrases[outgoingIndex]}
        </PhraseLayer>
      )}
    </div>
  );
}
