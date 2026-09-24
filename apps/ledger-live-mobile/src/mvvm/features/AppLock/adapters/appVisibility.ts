import { AppState, NativeEventEmitter, NativeModules, Platform } from "react-native";

// Android reads the process lifecycle: its AppState reports "background" as soon as the activity
// pauses, which a permission dialog over the app is enough for. iOS AppState only reports
// "background" once the app has left; a system alert makes it "inactive".
export function onAppBackground(listener: () => void): () => void {
  if (Platform.OS === "android") {
    const subscription = new NativeEventEmitter(NativeModules.AppVisibilityModule).addListener(
      "appDidEnterBackground",
      listener,
    );

    return () => subscription.remove();
  }

  const subscription = AppState.addEventListener("change", state => {
    if (state === "background") {
      listener();
    }
  });

  return () => subscription.remove();
}

export function isAppInBackground(): boolean {
  return Platform.OS === "android"
    ? !NativeModules.AppVisibilityModule.isInForeground()
    : AppState.currentState === "background";
}
