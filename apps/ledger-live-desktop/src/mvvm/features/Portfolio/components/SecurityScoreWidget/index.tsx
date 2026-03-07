import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Tag, Divider } from "@ledgerhq/lumen-ui-react";
import { ShieldCheck } from "@ledgerhq/lumen-ui-react/symbols";
import FeatureToggle from "@ledgerhq/live-common/featureFlags/FeatureToggle";
import type { FeatureId } from "@ledgerhq/types-live";

/* eslint-disable i18next/no-literal-string */

const STORAGE_KEY = "hackathon.h1.securityScore.lastCheckIn";
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SCORE = 75;
const RESET_TAP_COUNT = 5;
const RESET_TAP_WINDOW_MS = 3000;

function getStoredLastCheckIn(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeScore(lastCheckIn: number | null): number {
  if (!lastCheckIn) return DEFAULT_SCORE;
  const weeksSinceCheckIn = Math.floor((Date.now() - lastCheckIn) / MS_PER_WEEK);
  return Math.max(0, 100 - weeksSinceCheckIn);
}

function formatLastChecked(lastCheckIn: number | null): string {
  if (!lastCheckIn) return "Last check-in: never";
  const days = Math.floor((Date.now() - lastCheckIn) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Last checked today";
  if (days === 1) return "Last checked 1 day ago";
  return `Last checked ${days} days ago`;
}

const SecurityScoreWidgetInner = () => {
  const navigate = useNavigate();
  const [lastCheckIn, setLastCheckIn] = useState<number | null>(() => getStoredLastCheckIn());
  const [showConfirmation, setShowConfirmation] = useState(false);

  const resetTaps = useRef<number[]>([]);

  const score = useMemo(() => computeScore(lastCheckIn), [lastCheckIn]);
  const lastCheckedLabel = useMemo(() => formatLastChecked(lastCheckIn), [lastCheckIn]);

  const tagAppearance = score >= 80 ? ("success" as const) : ("warning" as const);
  const tagLabel = score >= 80 ? "Good" : "Check recommended";

  const onCheckIn = useCallback(() => {
    const timestamp = Date.now();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(timestamp));
    }
    setLastCheckIn(timestamp);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);

    navigate("/platform/revoke-cash");
  }, [navigate]);

  const onCardAreaClick = useCallback(() => {
    const now = Date.now();
    resetTaps.current = resetTaps.current.filter(t => now - t < RESET_TAP_WINDOW_MS);
    resetTaps.current.push(now);
    if (resetTaps.current.length >= RESET_TAP_COUNT) {
      resetTaps.current = [];
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setLastCheckIn(null);
      setShowConfirmation(false);
    }
  }, []);

  return (
    <div
      data-testid="portfolio-security-score-widget"
      className="flex flex-col gap-12 rounded-xl border border-neutral-40 bg-surface p-16"
      onClick={onCardAreaClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <ShieldCheck size={20} />
          <span className="text-body-semibold">Vault Health</span>
        </div>
        <Tag size="sm" appearance={tagAppearance} label={tagLabel} />
      </div>

      <Divider orientation="horizontal" />

      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-4">
          <span className="text-h2">{score}</span>
          <span className="text-small text-neutral-70">{lastCheckedLabel}</span>
        </div>
        <Button
          appearance="accent"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onCheckIn();
          }}
        >
          Do security check-in
        </Button>
      </div>

      {showConfirmation && (
        <div className="text-small text-success">Vault health improved. Well done!</div>
      )}
    </div>
  );
};

const FEATURE_FLAG_ID = "hackathonEngagementH1SecurityScore" as FeatureId;

export const SecurityScoreWidget = () => (
  <FeatureToggle featureId={FEATURE_FLAG_ID}>
    <SecurityScoreWidgetInner />
  </FeatureToggle>
);
