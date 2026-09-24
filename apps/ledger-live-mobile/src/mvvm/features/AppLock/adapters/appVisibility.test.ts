import {
  AppState,
  DeviceEventEmitter,
  NativeModules,
  Platform,
  type AppStateStatus,
} from "react-native";
import { isAppInBackground, onAppBackground } from "./appVisibility";

let appStateListeners: ((state: AppStateStatus) => void)[] = [];

const changeAppState = (state: AppStateStatus) =>
  appStateListeners.forEach(listener => listener(state));

const stopProcess = () => DeviceEventEmitter.emit("appDidEnterBackground");

const onPlatform = (os: typeof Platform.OS) => Object.assign(Platform, { OS: os });

let unsubscribers: (() => void)[] = [];

const listen = () => {
  const listener = jest.fn();
  unsubscribers.push(onAppBackground(listener));
  return listener;
};

beforeEach(() => {
  appStateListeners = [];
  jest.spyOn(AppState, "addEventListener").mockImplementation(((
    _type: string,
    listener: (state: AppStateStatus) => void,
  ) => {
    appStateListeners.push(listener);
    return {
      remove: () => {
        appStateListeners = appStateListeners.filter(other => other !== listener);
      },
    };
  }) as typeof AppState.addEventListener);
});

afterEach(() => {
  unsubscribers.forEach(unsubscribe => unsubscribe());
  unsubscribers = [];
  jest.restoreAllMocks();
  onPlatform("ios");
});

describe("the app leaving, on Android", () => {
  beforeEach(() => onPlatform("android"));

  it("is reported when the process stops", () => {
    const listener = listen();

    stopProcess();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  // What a permission dialog produces: the activity pauses, AppState says background, and the app
  // is still on screen behind it.
  it("is not reported when only the activity pauses", () => {
    const listener = listen();

    changeAppState("background");

    expect(listener).not.toHaveBeenCalled();
  });

  it("is read from the process lifecycle", () => {
    jest.spyOn(NativeModules.AppVisibilityModule, "isInForeground").mockReturnValue(false);

    expect(isAppInBackground()).toBe(true);
  });

  it("stops being reported once unsubscribed", () => {
    const listener = jest.fn();
    const unsubscribe = onAppBackground(listener);

    unsubscribe();
    stopProcess();

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("the app leaving, on iOS", () => {
  beforeEach(() => onPlatform("ios"));

  it("is reported when the app goes to the background", () => {
    const listener = listen();

    changeAppState("background");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("is not reported for inactive, which a system alert causes", () => {
    const listener = listen();

    changeAppState("inactive");

    expect(listener).not.toHaveBeenCalled();
  });

  it("is read from AppState", () => {
    Object.assign(AppState, { currentState: "background" });

    expect(isAppInBackground()).toBe(true);

    Object.assign(AppState, { currentState: "active" });

    expect(isAppInBackground()).toBe(false);
  });

  it("stops being reported once unsubscribed", () => {
    const listener = jest.fn();
    const unsubscribe = onAppBackground(listener);

    unsubscribe();
    changeAppState("background");

    expect(listener).not.toHaveBeenCalled();
  });
});
