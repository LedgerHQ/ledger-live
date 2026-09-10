// THROWAWAY DIAGNOSTIC — do not merge.
//
// Shows, on screen, whether `readCachedFlags` actually served the config the platform Firebase
// SDK kept on disk, and whether it did so before the network answered. The decisive run is the
// second launch with the network cut: the cache line must be non-empty while the fetch line
// reports a failure.
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Probe = {
  cacheMs: number | null;
  cacheCount: number | null;
  cacheWalletSync: string | null;
  cacheError: string | null;
  fetchMs: number | null;
  fetchOutcome: string | null;
  fetchCount: number | null;
};

const started = Date.now();
const listeners = new Set<() => void>();

let probe: Probe = {
  cacheMs: null,
  cacheCount: null,
  cacheWalletSync: null,
  cacheError: null,
  fetchMs: null,
  fetchOutcome: null,
  fetchCount: null,
};

function update(patch: Partial<Probe>) {
  probe = { ...probe, ...patch };
  listeners.forEach(listener => listener());
}

function describeWalletSync(value: unknown): string {
  if (!value || typeof value !== "object") return "absent";
  const feature = value as { enabled?: boolean; params?: { environment?: string } };
  return `enabled=${feature.enabled} env=${feature.params?.environment}`;
}

export function recordCacheRead(flags: Record<string, unknown>) {
  update({
    cacheMs: Date.now() - started,
    cacheCount: Object.keys(flags).length,
    cacheWalletSync: describeWalletSync(flags["llmWalletSync"]),
  });
}

export function recordCacheError(error: unknown) {
  update({ cacheMs: Date.now() - started, cacheError: String(error) });
}

export function recordFetch(outcome: "ok" | "failed", payload: unknown) {
  update({
    fetchMs: Date.now() - started,
    fetchOutcome: outcome === "ok" ? "ok" : `failed: ${String(payload).slice(0, 120)}`,
    fetchCount: outcome === "ok" ? Object.keys(payload as Record<string, unknown>).length : null,
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function verdict(state: Probe): string {
  if (state.cacheError) return "CACHE UNREADABLE";
  if (state.cacheCount === null) return "waiting for cache read...";
  if (state.cacheCount === 0) return "CACHE EMPTY (cold, or unreadable)";
  return `CACHE ALIVE — ${state.cacheCount} flags, no network`;
}

export function FlagCacheProbeOverlay() {
  const state = React.useSyncExternalStore(
    subscribe,
    () => probe,
    () => probe,
  );

  return (
    <View style={styles.root} pointerEvents="none">
      <Text style={styles.title}>FF CACHE PROBE</Text>
      <Text style={styles.line}>{verdict(state)}</Text>
      <Text style={styles.line}>
        {`cache   ${state.cacheMs === null ? "..." : `+${state.cacheMs}ms`}  count=${state.cacheCount ?? "-"}`}
      </Text>
      <Text style={styles.line}>{`  llmWalletSync ${state.cacheWalletSync ?? "-"}`}</Text>
      {state.cacheError ? <Text style={styles.line}>{`  err ${state.cacheError}`}</Text> : null}
      <Text style={styles.line}>
        {`fetch   ${state.fetchMs === null ? "pending" : `+${state.fetchMs}ms`}  ${state.fetchOutcome ?? ""}  count=${state.fetchCount ?? "-"}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 8,
    bottom: 8,
    right: 8,
    zIndex: 9999,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#7CFF9B",
    backgroundColor: "rgba(0,0,0,0.86)",
  },
  title: { color: "#7CFF9B", fontSize: 11, fontWeight: "700" },
  line: { color: "#7CFF9B", fontSize: 10, fontFamily: "Courier" },
});
