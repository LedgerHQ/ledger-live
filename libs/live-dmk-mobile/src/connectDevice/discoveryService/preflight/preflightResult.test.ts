import { DiscoveryErrorTypes, type DiscoveryError } from "../../types";
import {
  mapDiscoveryErrorToPreflightResult,
  retryPreflightCheck,
  successPreflightResult,
} from "./preflightResult";

const discoveryError: DiscoveryError = {
  type: DiscoveryErrorTypes.Unknown,
  error: new Error("failure"),
};

describe("preflightResult", () => {
  it("GIVEN success preflight result, WHEN reading it, THEN it should be successful", () => {
    // GIVEN
    const result = successPreflightResult;

    // WHEN
    const success = result.success;

    // THEN
    expect(success).toBe(true);
  });

  it("GIVEN discovery error, WHEN building failure result, THEN it should contain the error", () => {
    // GIVEN
    const error = discoveryError;

    // WHEN
    const result = mapDiscoveryErrorToPreflightResult(error);

    // THEN
    expect(result).toEqual({
      success: false,
      discoveryError: error,
    });
  });

  it("GIVEN retry check succeeds, WHEN retrying preflight, THEN it should return true", async () => {
    // GIVEN
    const check = jest.fn().mockResolvedValue(successPreflightResult);

    // WHEN
    const result = await retryPreflightCheck(check);

    // THEN
    expect(result).toBe(true);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("GIVEN retry check fails, WHEN retrying preflight, THEN it should return the discovery error", async () => {
    // GIVEN
    const check = jest.fn().mockResolvedValue(mapDiscoveryErrorToPreflightResult(discoveryError));

    // WHEN
    const result = await retryPreflightCheck(check);

    // THEN
    expect(result).toBe(discoveryError);
    expect(check).toHaveBeenCalledTimes(1);
  });
});
