import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  collectStates,
  deviceConnectionResult,
  deviceExtractedContext,
} from "../../tests/testUtils";
import { showExchangeErrorIntentJob } from "../job";
import type { ShowExchangeErrorIntentInput } from "../types";

const error = new Error("payout address rejected");

function startJob(input: ShowExchangeErrorIntentInput) {
  return collectStates(
    showExchangeErrorIntentJob({
      deviceConnectionResult,
      deviceExtractedContext,
      input,
      onResult: jest.fn(),
    }),
  );
}

describe("showExchangeErrorIntentJob", () => {
  it("shows the error at once and completes, without waiting on the device", () => {
    const { states, completed } = startJob({ error });

    expect(states).toEqual([{ type: "error", error }]);
    expect(completed()).toBe(true);
  });

  it("shows a plain error for a Nano S on a provider that works with it", () => {
    const { states } = startJob({
      error,
      provider: "changelly",
      deviceModelId: DeviceModelId.nanoS,
    });

    expect(states).toEqual([{ type: "error", error }]);
  });

  it("shows a plain error for ThorSwap on a device it works with", () => {
    const { states } = startJob({
      error,
      provider: "thorswap",
      deviceModelId: DeviceModelId.nanoX,
    });

    expect(states).toEqual([{ type: "error", error }]);
  });

  it("shows a plain error for ThorSwap when the device is not known", () => {
    const { states } = startJob({ error, provider: "thorswap" });

    expect(states).toEqual([{ type: "error", error }]);
  });

  it.each(["thorswap", "ThorSwap"])(
    "tells the user a Nano S cannot do a %s swap, whatever the error was",
    provider => {
      const { states } = startJob({
        error,
        provider,
        deviceModelId: DeviceModelId.nanoS,
        sourceCurrencyId: "bitcoin",
        targetCurrencyId: "ethereum",
      });

      expect(states).toEqual([
        {
          type: "incompatible-device",
          provider,
          deviceModelId: DeviceModelId.nanoS,
          sourceCurrencyId: "bitcoin",
          targetCurrencyId: "ethereum",
        },
      ]);
    },
  );

  it("leaves the currencies out when they are not known", () => {
    const { states } = startJob({
      error,
      provider: "thorswap",
      deviceModelId: DeviceModelId.nanoS,
    });

    expect(states).toEqual([
      { type: "incompatible-device", provider: "thorswap", deviceModelId: DeviceModelId.nanoS },
    ]);
  });
});
