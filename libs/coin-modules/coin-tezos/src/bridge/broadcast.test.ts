import { SignedOperation } from "@ledgerhq/types-live";
import { createFixtureOperation } from "../types/bridge.fixture";
import { broadcast } from "./broadcast";

const mockInjectOperation = jest.fn();
jest.mock("@taquito/taquito", () => ({
  TezosToolkit: jest.fn().mockReturnValue({
    rpc: {
      injectOperation: () => mockInjectOperation(),
    },
  }),
}));

describe("broadcast", () => {
  it("calls 'injectOperation' from TezosToolkit and returns its hash computation", async () => {
    // GIVEN
    const signedOperation: SignedOperation = {
      operation: createFixtureOperation(),
      signature: "SIGNATURE",
    };
    mockInjectOperation.mockResolvedValue("SIGN_HASH");

    // WHEN
    const op = await broadcast({ signedOperation, account: {} as any });

    // THEN
    expect(mockInjectOperation).toHaveBeenCalledTimes(1);
    expect(op.hash).toEqual("SIGN_HASH");
  });
});
