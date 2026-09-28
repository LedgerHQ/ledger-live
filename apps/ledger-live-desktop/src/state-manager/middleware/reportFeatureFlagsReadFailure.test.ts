import type { FeatureFlagsReadFailure } from "@shared/feature-flags";
import appLogger from "~/renderer/logger";
import { reportFeatureFlagsReadFailure } from "./reportFeatureFlagsReadFailure";

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: { critical: jest.fn() },
}));

describe("reportFeatureFlagsReadFailure", () => {
  beforeEach(() => {
    jest.mocked(appLogger.critical).mockClear();
  });

  it.each<FeatureFlagsReadFailure>([
    { stage: "cache", attempt: 1, isCold: true },
    { stage: "remote", attempt: 1, isCold: true },
    { stage: "remote", attempt: 3, isCold: true },
  ])("reports a cold $stage failure at attempt $attempt", failure => {
    const error = new Error("boom");

    reportFeatureFlagsReadFailure(error, failure);

    expect(appLogger.critical).toHaveBeenCalledWith(
      error,
      `Feature flags: ${failure.stage} read failed, resolving on compiled defaults`,
    );
  });

  it.each<FeatureFlagsReadFailure>([
    { stage: "remote", attempt: 1, isCold: false },
    { stage: "remote", attempt: 2, isCold: false },
  ])("ignores a warm remote failure at attempt $attempt", failure => {
    reportFeatureFlagsReadFailure(new Error("boom"), failure);

    expect(appLogger.critical).not.toHaveBeenCalled();
  });

  it.each([true, false])("reports a boot sync failure, isCold %s", isCold => {
    const error = new Error("reducer blew up");

    reportFeatureFlagsReadFailure(error, { stage: "sync", attempt: 1, isCold });

    expect(appLogger.critical).toHaveBeenCalledWith(
      error,
      "Feature flags: re-resolution failed at boot, running on compiled defaults",
    );
  });

  it.each([true, false])("ignores a sync failure after boot, isCold %s", isCold => {
    reportFeatureFlagsReadFailure(new Error("boom"), { stage: "sync", attempt: 2, isCold });

    expect(appLogger.critical).not.toHaveBeenCalled();
  });
});
