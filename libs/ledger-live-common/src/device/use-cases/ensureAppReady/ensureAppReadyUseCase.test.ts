/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */

import { LoadingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { of } from "rxjs";
import { getDeprecationConfig, shouldUpgrade } from "../../../apps";
import { runEnsureAppReadyAttempt } from "./helpers/runEnsureAppReadyAttempt";
import { withRetryableRepeat } from "./helpers/withRetryableRepeat";
import { ensureAppReadyUseCase } from "./ensureAppReadyUseCase";

jest.mock("./helpers/runEnsureAppReadyAttempt", () => ({
  runEnsureAppReadyAttempt: jest.fn(),
}));

jest.mock("./helpers/withRetryableRepeat", () => ({
  withRetryableRepeat: jest.fn(),
}));

const runEnsureAppReadyAttemptMock = jest.mocked(runEnsureAppReadyAttempt);
const withRetryableRepeatMock = jest.mocked(withRetryableRepeat);

const dmk = { name: "dmk" } as any;
const input = {
  appName: "Ethereum",
  dependencies: ["1inch"],
  requireLatestFirmware: false,
  allowPartialDependencies: false,
} as any;
const deprecationDismissedCurrencyNames = ["Ethereum"];
const sideEffects = {
  onDeviceIdObserved: jest.fn(),
  onLastSeenDeviceInfoObserved: jest.fn(),
};

describe("ensureAppReadyUseCase", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("composes retry wrapper and attempt with resolved dependencies", () => {
    const retry = jest.fn();
    const getMinVersionMock = jest.fn();
    const observable = of<EnsureAppReadyState>({ type: LoadingStateType.Loading });
    withRetryableRepeatMock.mockImplementation(factory => factory(retry));
    runEnsureAppReadyAttemptMock.mockReturnValue(observable);

    const states: EnsureAppReadyState[] = [];
    ensureAppReadyUseCase({
      dmk,
      sessionId: "session-1",
      input,
      deprecationDismissedCurrencyNames,
      sideEffects,
      dependencies: {
        getMinVersion: getMinVersionMock,
      },
    }).subscribe(state => states.push(state));

    expect(withRetryableRepeatMock).toHaveBeenCalledTimes(1);
    expect(runEnsureAppReadyAttemptMock).toHaveBeenCalledWith({
      dmk,
      sessionId: "session-1",
      input,
      deprecationDismissedCurrencyNames,
      sideEffects,
      retry,
      dependencies: {
        getMinVersion: getMinVersionMock,
        getDeprecationConfig,
        shouldUpgrade,
      },
    });
    expect(states).toEqual([{ type: LoadingStateType.Loading }]);
  });

  it("forwards retry wrapper states", () => {
    const loadingState: EnsureAppReadyState = { type: LoadingStateType.Loading };
    withRetryableRepeatMock.mockReturnValue(of(loadingState, loadingState));

    const states: EnsureAppReadyState[] = [];
    ensureAppReadyUseCase({
      dmk,
      sessionId: "session-1",
      input,
      deprecationDismissedCurrencyNames,
      sideEffects,
    }).subscribe(state => states.push(state));

    expect(states).toEqual([loadingState, loadingState]);
  });
});
