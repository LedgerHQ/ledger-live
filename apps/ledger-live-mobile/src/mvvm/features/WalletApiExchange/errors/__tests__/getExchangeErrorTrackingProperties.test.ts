import { CompleteExchangeError } from "@ledgerhq/live-common/exchange/error";
import { getExchangeErrorTrackingProperties } from "../getExchangeErrorTrackingProperties";

describe("getExchangeErrorTrackingProperties", () => {
  it("keeps the failed step and the error key of an exchange step error", () => {
    const error = new CompleteExchangeError("CHECK_PAYOUT_ADDRESS", "wrongDevice", "failed");

    expect(getExchangeErrorTrackingProperties(error)).toEqual({
      step: "CHECK_PAYOUT_ADDRESS",
      title: "wrongDevice",
    });
  });

  it("leaves out the addresses a sanctioned-address error carries", () => {
    const error = Object.assign(new Error("sanctioned"), {
      step: "INIT",
      title: "AddressesSanctionedError",
      addresses: ["bc1qsanctioned"],
    });

    expect(getExchangeErrorTrackingProperties(error)).toEqual({
      step: "INIT",
      title: "AddressesSanctionedError",
    });
  });

  it("leaves out the cause and message of an error the swap live app reported", () => {
    const swapLiveError = {
      name: "SwapError",
      message: "Payload request failed",
      cause: { swapCode: "swap002", response: { data: { error: { message: "backend" } } } },
    };

    expect(getExchangeErrorTrackingProperties(swapLiveError)).toEqual({});
  });

  it("tracks nothing for a missing or non-object error", () => {
    expect(getExchangeErrorTrackingProperties(undefined)).toEqual({});
    expect(getExchangeErrorTrackingProperties("failed")).toEqual({});
  });

  it("ignores a step or title that is not a string", () => {
    const error = Object.assign(new Error("failed"), { step: 2, title: { key: "x" } });

    expect(getExchangeErrorTrackingProperties(error)).toEqual({});
  });
});
