import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

const STORAGE_KEY = "hackathon.h1.securityScore.lastCheckIn";
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SCORE = 75;

function getStoredLastCheckIn(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getScore(lastCheckIn: number | null): number {
  if (!lastCheckIn) return DEFAULT_SCORE;
  const weeksSinceCheckIn = Math.floor((Date.now() - lastCheckIn) / MS_PER_WEEK);
  return Math.max(0, 100 - weeksSinceCheckIn);
}

export const SecurityScoreWidget = () => {
  const [lastCheckIn, setLastCheckIn] = useState<number | null>(() => getStoredLastCheckIn());

  const score = useMemo(() => getScore(lastCheckIn), [lastCheckIn]);
  const scoreLabel = score >= 80 ? "Good" : "Check recommended";

  const onCheckIn = useCallback(() => {
    const timestamp = Date.now();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(timestamp));
    }
    setLastCheckIn(timestamp);
  }, []);

  return (
    <div
      data-testid="portfolio-security-score-widget"
      className="flex flex-col gap-12 rounded-md bg-surface p-16"
    >
      <div className="flex items-center justify-between">
        <div>Vault Health Score</div>
        <div>{scoreLabel}</div>
      </div>
      <div>{score}</div>
      <div>
        {lastCheckIn
          ? `Last check-in: ${new Date(lastCheckIn).toLocaleString()}`
          : "Last check-in: never"}
      </div>
      <div>
        <Button appearance="main" size="sm" onClick={onCheckIn}>
          Firmware checked
        </Button>
      </div>
    </div>
  );
};
