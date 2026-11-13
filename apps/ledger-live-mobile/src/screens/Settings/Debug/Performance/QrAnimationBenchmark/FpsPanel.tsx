import React, { useEffect, useState } from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const SAMPLE_MS = 500;
// The first samples include mount work: leave them out of the minimum.
const WARM_UP_SAMPLES = 2;
const JS_BLOCK_MS = 1000;

type FpsStats = Readonly<{ current: number; min: number; samples: number }>;

const EMPTY_STATS: FpsStats = { current: 0, min: Infinity, samples: 0 };

function addSample(stats: FpsStats, fps: number): FpsStats {
  const samples = stats.samples + 1;
  const min = samples > WARM_UP_SAMPLES ? Math.min(stats.min, fps) : stats.min;
  return { current: fps, min, samples };
}

/** Frames the UI thread draws per second, counted from a Reanimated frame callback. */
function useUiThreadFps(): FpsStats {
  const [stats, setStats] = useState(EMPTY_STATS);
  const frames = useSharedValue(0);
  const windowStart = useSharedValue(-1);

  const onSample = (fps: number) => setStats(previous => addSample(previous, fps));

  useFrameCallback(({ timestamp }) => {
    if (windowStart.get() < 0) windowStart.set(timestamp);
    frames.set(frames.get() + 1);
    const elapsed = timestamp - windowStart.get();
    if (elapsed >= SAMPLE_MS) {
      scheduleOnRN(onSample, Math.round((frames.get() * 1000) / elapsed));
      frames.set(0);
      windowStart.set(timestamp);
    }
  });

  return stats;
}

/** Frames the JS thread gets per second, counted with requestAnimationFrame. */
function useJsThreadFps(): FpsStats {
  const [stats, setStats] = useState(EMPTY_STATS);

  useEffect(() => {
    let frames = 0;
    let windowStart = -1;
    let request = 0;
    const onFrame = (timestamp: number) => {
      if (windowStart < 0) windowStart = timestamp;
      frames += 1;
      const elapsed = timestamp - windowStart;
      if (elapsed >= SAMPLE_MS) {
        const fps = Math.round((frames * 1000) / elapsed);
        setStats(previous => addSample(previous, fps));
        frames = 0;
        windowStart = timestamp;
      }
      request = requestAnimationFrame(onFrame);
    };
    request = requestAnimationFrame(onFrame);
    return () => cancelAnimationFrame(request);
  }, []);

  return stats;
}

function blockJsThread() {
  const end = Date.now() + JS_BLOCK_MS;
  while (Date.now() < end) {
    // Busy wait: animations driven by the JS thread freeze, UI-thread ones keep running.
  }
}

function formatStats({ current, min }: FpsStats): string {
  return `${current} fps · min ${Number.isFinite(min) ? min : "–"}`;
}

function StatsRow({ label, stats }: Readonly<{ label: string; stats: FpsStats }>) {
  return (
    <Box lx={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text typography="body2SemiBold" lx={{ color: "base" }}>
        {label}
      </Text>
      <Text typography="body2" lx={{ color: "base" }}>
        {formatStats(stats)}
      </Text>
    </Box>
  );
}

function FpsReadout() {
  const ui = useUiThreadFps();
  const js = useJsThreadFps();
  return (
    <>
      <StatsRow label="UI thread" stats={ui} />
      <StatsRow label="JS thread" stats={js} />
    </>
  );
}

/** Owns its state so its updates never re-render the QR codes being measured. Remount to reset. */
export function FpsPanel({ mountMs }: Readonly<{ mountMs?: number }>) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <Box lx={{ gap: "s8", padding: "s12", borderRadius: "md", backgroundColor: "surface" }}>
      <FpsReadout key={resetKey} />
      <Box lx={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          Mount
        </Text>
        <Text typography="body2" lx={{ color: "base" }}>
          {mountMs === undefined ? "–" : `${mountMs} ms`}
        </Text>
      </Box>
      <Box lx={{ flexDirection: "row", gap: "s8" }}>
        <Button appearance="gray" size="sm" onPress={() => setResetKey(value => value + 1)}>
          Reset
        </Button>
        <Button appearance="gray" size="sm" onPress={blockJsThread}>
          Block JS for 1 s
        </Button>
      </Box>
    </Box>
  );
}
