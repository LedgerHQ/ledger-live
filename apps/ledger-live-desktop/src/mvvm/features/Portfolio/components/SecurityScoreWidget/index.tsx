import React, { useCallback, useMemo, useRef, useState } from "react";
import { Button, Tag, Divider } from "@ledgerhq/lumen-ui-react";
import { ShieldCheck } from "@ledgerhq/lumen-ui-react/symbols";
import FeatureToggle from "@ledgerhq/live-common/featureFlags/FeatureToggle";
import type { FeatureId } from "@ledgerhq/types-live";
import { openURL } from "~/renderer/linking";

const STORAGE_KEY = "hackathon.h1.securityScore.lastCheckIn";
const DEFAULT_SCORE = 75;
const HEALTHY_SCORE = 100;
const RESET_TAP_COUNT = 5;
const RESET_TAP_WINDOW_MS = 3000;

function getStoredLastCheckIn(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatStatusLabel(lastCheckIn: number | null): string {
  if (!lastCheckIn) return "Token approvals review recommended";
  const days = Math.floor((Date.now() - lastCheckIn) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Token approvals checked today";
  if (days === 1) return "Token approvals checked 1 day ago";
  return `Token approvals checked ${days} days ago`;
}

const SecurityScoreWidgetInner = () => {
  const [lastCheckIn, setLastCheckIn] = useState<number | null>(() => getStoredLastCheckIn());
  const resetTaps = useRef<number[]>([]);

  const score = useMemo(() => (lastCheckIn ? HEALTHY_SCORE : DEFAULT_SCORE), [lastCheckIn]);
  const statusLabel = useMemo(() => formatStatusLabel(lastCheckIn), [lastCheckIn]);
  const isHealthy = score >= 80;

  const tagAppearance = isHealthy ? ("success" as const) : ("warning" as const);
  const tagLabel = isHealthy ? "Good" : "Check recommended";

  const onCheckIn = useCallback(() => {
    const timestamp = Date.now();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(timestamp));
    }
    setLastCheckIn(timestamp);
    openURL("ledgerlive://discover/revoke-cash");
  }, []);

  const onResetAreaClick = useCallback(() => {
    const now = Date.now();
    resetTaps.current = resetTaps.current.filter(t => now - t < RESET_TAP_WINDOW_MS);
    resetTaps.current.push(now);
    if (resetTaps.current.length >= RESET_TAP_COUNT) {
      resetTaps.current = [];
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setLastCheckIn(null);
    }
  }, []);

  return (
    <div
      data-testid="portfolio-security-score-widget"
      className="flex flex-col gap-12 rounded-xl border border-muted-subtle bg-surface p-16"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <ShieldCheck size={20} />
          <span className="heading-5-semi-bold text-base">Vault Health</span>
        </div>
        <Tag size="sm" appearance={tagAppearance} label={tagLabel} />
      </div>

      <Divider orientation="horizontal" />

      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-4">
          <span className="heading-3-semi-bold text-base">{score}</span>
          <span className="body-2 text-muted">{statusLabel}</span>
        </div>
        <div
          data-testid="portfolio-security-score-reset-area"
          className="-m-8 p-8"
          onClick={onResetAreaClick}
        >
          <Button
            appearance="accent"
            size="sm"
            data-testid="portfolio-security-score-cta"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onCheckIn();
            }}
          >
            Do security check-in
          </Button>
        </div>
      </div>

      {lastCheckIn && (
        <div className="body-2 text-success">
          Vault health improved. Token approvals are in a healthier state.
        </div>
      )}
    </div>
  );
};

const FEATURE_FLAG_ID: FeatureId = "feature_hackathon_engagement_h1_security_score";

export const SecurityScoreWidget = () => (
  <FeatureToggle featureId={FEATURE_FLAG_ID}>
    <SecurityScoreWidgetInner />
  </FeatureToggle>
);
