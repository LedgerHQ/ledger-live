import { AppState, NativeEventEmitter, NativeModules, Platform } from "react-native";

let tasksOutsideApp = 0;

export async function leaveAppFor<T>(task: () => Promise<T>): Promise<T> {
  if (Platform.OS !== "android") {
    return task();
  }

  tasksOutsideApp += 1;
  let hasLeft = false;
  let isBack = false;

  const comeBack = () => {
    if (!isBack) {
      isBack = true;
      subscription.remove();
      tasksOutsideApp -= 1;
    }
  };

  const subscription = AppState.addEventListener("change", state => {
    if (state === "background") {
      hasLeft = true;
    } else if (state === "active" && hasLeft) {
      comeBack();
    }
  });

  try {
    return await task();
  } catch (error) {
    comeBack();
    throw error;
  }
}

// Android reads the process lifecycle: its AppState reports "background" as soon as the activity
// pauses, which a permission dialog over the app is enough for. iOS AppState only reports
// "background" once the app has left; a system alert makes it "inactive".
export function onAppBackground(listener: () => void): () => void {
  if (Platform.OS === "android") {
    const subscription = new NativeEventEmitter(NativeModules.AppVisibilityModule).addListener(
      "appDidEnterBackground",
      () => {
        if (tasksOutsideApp === 0) {
          listener();
        }
      },
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
    ? tasksOutsideApp === 0 && !NativeModules.AppVisibilityModule.isInForeground()
    : AppState.currentState === "background";
}
