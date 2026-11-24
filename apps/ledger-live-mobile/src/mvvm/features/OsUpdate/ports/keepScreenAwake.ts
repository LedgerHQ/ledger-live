import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { v4 as uuid_v4 } from "uuid";

/** Keeps the screen awake until the returned release function is called. */
export function keepScreenAwake(): () => void {
  const tag = uuid_v4();
  activateKeepAwakeAsync(tag).catch(error => {
    console.warn("keepScreenAwake: failed to activate keep awake", error);
  });

  return () => {
    deactivateKeepAwake(tag).catch(error => {
      console.warn("keepScreenAwake: failed to deactivate keep awake", error);
    });
  };
}
