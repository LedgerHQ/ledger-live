import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { createFixtureOperation } from "../types/bridge.fixture";
import { broadcast } from "./broadcast";

const mockSubmitExtrinsic = jest.fn();

jest.mock("../network", () => {
  return {
    submitExtrinsic: (arg: any) => mockSubmitExtrinsic(arg),
  };
});

const account = {
  currency: getCryptoCurrencyById("polkadot"),
};

describe("broadcast", () => {
  it("calls explorer for broadcast operation", async () => {
    // WHEN
    await broadcast({
      account: account as any,
      signedOperation: {
        signature: "SIGNATURE",
        operation: createFixtureOperation(),
      },
    });

    // THEN
    expect(mockSubmitExtrinsic).toHaveBeenCalledTimes(1);
    expect(mockSubmitExtrinsic.mock.lastCall[0]).toBe("SIGNATURE");
  });

  it("updates the signed operation", async () => {
    // GIVEN
    const operation = createFixtureOperation();

    // WHEN
    const result = await broadcast({
      account: account as any,
      signedOperation: { signature: "SIGNATURE", operation },
    });

    // THEN
    expect(result).not.toEqual(operation);
    expect(result.hash).not.toEqual(operation.hash);
  });
});
