import { useEffect, useState } from "react";
import { SPONSORED_PHASE, type SponsoredPhase } from "./types";

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** "mm:ss" spent waiting for the energy delivery; restarts on each entry into POLLING. */
export function useSponsoredPollingElapsed(phase: SponsoredPhase): string {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (phase !== SPONSORED_PHASE.POLLING) return;
    setElapsedSeconds(0);
    const intervalId = setInterval(() => {
      setElapsedSeconds(previous => previous + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [phase]);

  return formatElapsed(elapsedSeconds);
}
