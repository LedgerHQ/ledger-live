/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { renderHook } from "tests/testSetup";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useFeePresetOptions } from "../useFeePresetOptions";

jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: {
    getFeePresetOptions: jest.fn(() => []),
  },
}));

const mockedSendFeatures = jest.mocked(sendFeatures);

describe("useFeePresetOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to sendFeatures.getFeePresetOptions with the current transaction", () => {
    const tx = { family: "bitcoin" } as unknown as Transaction;

    renderHook(() => useFeePresetOptions(undefined, tx));

    expect(mockedSendFeatures.getFeePresetOptions).toHaveBeenCalledWith(undefined, tx);
  });

  it("recomputes when the transaction changes", () => {
    const tx1 = { family: "bitcoin", amount: 1 } as unknown as Transaction;
    const tx2 = { family: "bitcoin", amount: 2 } as unknown as Transaction;

    const { rerender } = renderHook(({ tx }) => useFeePresetOptions(undefined, tx), {
      initialProps: { tx: tx1 },
    });

    expect(mockedSendFeatures.getFeePresetOptions).toHaveBeenCalledWith(undefined, tx1);

    rerender({ tx: tx2 });

    expect(mockedSendFeatures.getFeePresetOptions).toHaveBeenCalledWith(undefined, tx2);
  });
});
