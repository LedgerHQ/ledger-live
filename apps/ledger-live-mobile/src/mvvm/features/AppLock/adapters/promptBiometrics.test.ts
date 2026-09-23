import { AppState, type AppStateStatus } from "react-native";
import { promptBiometrics } from "./promptBiometrics";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  promptBiometrics: jest.fn(async () => ({ status: "succeeded" })),
}));

const { promptBiometrics: promptDeviceBiometrics } = jest.requireMock(
  "@features/platform-app-lock",
);

const LABELS = { reason: "Unlock", fallback: "Use passcode", cancel: "Cancel" };

let changeListeners: ((state: AppStateStatus) => void)[] = [];
const remove = jest.fn();

const setAppState = (state: AppStateStatus) => Object.assign(AppState, { currentState: state });
const becomeActive = () => {
  setAppState("active");
  changeListeners.forEach(listener => listener("active"));
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  changeListeners = [];
  setAppState("active");
  jest.spyOn(AppState, "addEventListener").mockImplementation(((
    _type: string,
    listener: (state: AppStateStatus) => void,
  ) => {
    changeListeners.push(listener);
    return { remove };
  }) as typeof AppState.addEventListener);
});

afterEach(() => {
  jest.useRealTimers();
});

const settledYet = async (promise: Promise<unknown>) => {
  let settled = false;
  promise.then(() => {
    settled = true;
  });
  await Promise.resolve();
  await Promise.resolve();
  return settled;
};

describe("answering a biometric prompt", () => {
  it("answers straight away when the app never left the foreground", async () => {
    await expect(promptBiometrics(LABELS)).resolves.toEqual({ status: "succeeded" });
    expect(AppState.addEventListener).not.toHaveBeenCalled();
  });

  it("holds the answer until the app is active again", async () => {
    promptDeviceBiometrics.mockImplementationOnce(async () => {
      setAppState("inactive");
      return { status: "succeeded" };
    });

    const answer = promptBiometrics(LABELS);

    expect(await settledYet(answer)).toBe(false);

    becomeActive();

    await expect(answer).resolves.toEqual({ status: "succeeded" });
    expect(remove).toHaveBeenCalled();
  });

  it("holds a failed or cancelled answer the same way", async () => {
    promptDeviceBiometrics.mockImplementationOnce(async () => {
      setAppState("inactive");
      return { status: "cancelled" };
    });

    const answer = promptBiometrics(LABELS);

    expect(await settledYet(answer)).toBe(false);

    becomeActive();

    await expect(answer).resolves.toEqual({ status: "cancelled" });
  });

  it("stops waiting after a bound, so an event that never comes cannot hang the caller", async () => {
    promptDeviceBiometrics.mockImplementationOnce(async () => {
      setAppState("inactive");
      return { status: "succeeded" };
    });

    const answer = promptBiometrics(LABELS);

    expect(await settledYet(answer)).toBe(false);

    jest.advanceTimersByTime(1_000);

    await expect(answer).resolves.toEqual({ status: "succeeded" });
    expect(remove).toHaveBeenCalled();
  });

  it("does not wait on a backgrounded app, which the user chose to leave", async () => {
    promptDeviceBiometrics.mockImplementationOnce(async () => {
      setAppState("background");
      return { status: "succeeded" };
    });

    await expect(promptBiometrics(LABELS)).resolves.toEqual({ status: "succeeded" });
  });
});
