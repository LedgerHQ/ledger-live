import { DdRum, ErrorSource } from "@datadog/mobile-react-native";
import type { FeatureFlagsReadFailure } from "@shared/feature-flags";
import { reportFeatureFlagsReadFailure } from "./reportFeatureFlagsReadFailure";

let mockIsDatadogEnabled = true;

jest.mock("@datadog/mobile-react-native", () => ({
  DdRum: { addError: jest.fn() },
  ErrorSource: { SOURCE: "SOURCE" },
}));
jest.mock("~/datadog", () => ({
  get isDatadogEnabled() {
    return mockIsDatadogEnabled;
  },
}));

const bootSyncMessage = "Feature flags: re-resolution failed at boot, running on compiled defaults";

describe("reportFeatureFlagsReadFailure", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    mockIsDatadogEnabled = true;
    jest.mocked(DdRum.addError).mockClear();
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it.each<FeatureFlagsReadFailure>([
    { stage: "cache", attempt: 1, isCold: true },
    { stage: "remote", attempt: 1, isCold: true },
    { stage: "remote", attempt: 3, isCold: true },
  ])("logs a cold $stage failure at attempt $attempt, without Datadog", failure => {
    const error = new Error("boom");

    reportFeatureFlagsReadFailure(error, failure);

    expect(consoleError).toHaveBeenCalledWith(
      `Feature flags: ${failure.stage} read failed, resolving on compiled defaults`,
      error,
    );
    expect(DdRum.addError).not.toHaveBeenCalled();
  });

  it.each<FeatureFlagsReadFailure>([
    { stage: "remote", attempt: 1, isCold: false },
    { stage: "remote", attempt: 2, isCold: false },
  ])("ignores a warm remote failure at attempt $attempt", failure => {
    reportFeatureFlagsReadFailure(new Error("boom"), failure);

    expect(consoleError).not.toHaveBeenCalled();
    expect(DdRum.addError).not.toHaveBeenCalled();
  });

  it.each([true, false])("logs a boot sync failure and sends it to Datadog, isCold %s", isCold => {
    const error = new Error("reducer blew up");

    reportFeatureFlagsReadFailure(error, { stage: "sync", attempt: 1, isCold });

    expect(consoleError).toHaveBeenCalledWith(bootSyncMessage, error);
    expect(DdRum.addError).toHaveBeenCalledWith(bootSyncMessage, ErrorSource.SOURCE, error.stack);
  });

  it("sends an empty stack to Datadog when the thrown value is not an Error", () => {
    reportFeatureFlagsReadFailure("not an error", { stage: "sync", attempt: 1, isCold: true });

    expect(DdRum.addError).toHaveBeenCalledWith(bootSyncMessage, ErrorSource.SOURCE, "");
  });

  it("only logs a boot sync failure when Datadog is disabled", () => {
    mockIsDatadogEnabled = false;
    const error = new Error("reducer blew up");

    reportFeatureFlagsReadFailure(error, { stage: "sync", attempt: 1, isCold: true });

    expect(consoleError).toHaveBeenCalledWith(bootSyncMessage, error);
    expect(DdRum.addError).not.toHaveBeenCalled();
  });

  it.each([true, false])("ignores a sync failure after boot, isCold %s", isCold => {
    reportFeatureFlagsReadFailure(new Error("boom"), { stage: "sync", attempt: 2, isCold });

    expect(consoleError).not.toHaveBeenCalled();
    expect(DdRum.addError).not.toHaveBeenCalled();
  });
});
