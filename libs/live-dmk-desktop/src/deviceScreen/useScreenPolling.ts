import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ScreenApi } from "./screenApi";
import type { DeviceScreenInput, DeviceScreenState } from "./types";

/** Cadence while a screen is live, and the slower one while it is not. */
const SCREEN_POLL_MS = 500;
const IDLE_POLL_MS = 2000;

const describe = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Keeps the device screen fresh by polling a {@link ScreenApi} for stills, and
 * exposes the input handlers that drive it. Transport-agnostic: where the
 * requests go is the api's business.
 *
 * @param polling whether to keep the screen fresh. Off while the panel is
 * collapsed or no device is connected, so a hidden panel costs no requests.
 */
export function useScreenPolling(api: ScreenApi, polling: boolean): DeviceScreenState {
  const [state, setState] = useState<DeviceScreenState>({ kind: "loading" });

  const objectUrl = useRef<string | null>(null);
  const inFlight = useRef(false);
  /** Read by the poll loop to pick its delay. */
  const isLive = useRef(false);
  isLive.current = state.kind === "image";

  const releaseObjectUrl = useCallback(() => {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }, []);

  /**
   * Input handlers refresh straight after acting. Going through a ref keeps
   * them stable, so the <img> is not remounted on every poll.
   */
  const refreshRef = useRef<() => void>(() => {});

  const input = useMemo<DeviceScreenInput>(() => {
    const send = (call: Promise<void>) =>
      void call
        .then(() => refreshRef.current())
        .catch((error: unknown) => setState({ kind: "error", message: describe(error) }));

    return {
      pressButton: (button, action) => send(api.pressButton(button, action)),
      touch: (x, y, action) => send(api.touch(x, y, action)),
    };
  }, [api]);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const blob = await api.screenshot();
      releaseObjectUrl();
      if (blob) {
        objectUrl.current = URL.createObjectURL(blob);
        setState({ kind: "image", src: objectUrl.current, input });
      } else {
        setState((await api.idle?.()) ?? { kind: "error", message: "No screen to capture" });
      }
    } catch (error) {
      setState({ kind: "error", message: describe(error) });
    } finally {
      inFlight.current = false;
    }
  }, [api, input, releaseObjectUrl]);

  useEffect(() => {
    refreshRef.current = () => void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!polling) {
      // Drop the frame rather than keep a revoked object URL around, which
      // would flash a broken image when the panel reopens.
      releaseObjectUrl();
      setState({ kind: "loading" });
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = async () => {
      if (!document.hidden) await refresh();
      if (cancelled) return;
      timer = setTimeout(() => void tick(), isLive.current ? SCREEN_POLL_MS : IDLE_POLL_MS);
    };
    void tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [polling, refresh, releaseObjectUrl]);

  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

  return state;
}
