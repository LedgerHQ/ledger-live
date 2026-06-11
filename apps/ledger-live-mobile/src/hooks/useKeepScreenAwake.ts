import { useEffect } from "react";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { v4 as uuid_v4 } from "uuid";

/**
 * Prevents the screen from sleeping while `enabled` is `true`, releasing the
 * lock as soon as `enabled` becomes `false` or the owner component unmounts.
 *
 * Prefer this over expo-keep-awake's `useKeepAwake` when you need to toggle the
 * wake lock at runtime from a boolean (e.g. only while a device flow, signing or
 * firmware update is in progress). Use `useKeepAwake` directly when the screen
 * should simply stay awake for the whole lifetime of the mounted component.
 *
 * Note: this only keeps the screen awake while the app is in the foreground.
 *
 * @param enabled Whether the screen should be kept awake.
 */
export function useKeepScreenAwake(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const tag = uuid_v4();
    activateKeepAwakeAsync(tag).catch(error => {
      console.warn("useKeepScreenAwake: failed to activate keep awake", error);
    });

    return () => {
      deactivateKeepAwake(tag).catch(error => {
        console.warn("useKeepScreenAwake: failed to deactivate keep awake", error);
      });
    };
  }, [enabled]);
}
