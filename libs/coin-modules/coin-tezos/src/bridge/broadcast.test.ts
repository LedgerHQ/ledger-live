import { SignedOperation } from "@ledgerhq/types-live";
import { createFixtureOperation } from "../types/bridge.fixture";
import config, { type TezosCoinConfig } from "../config";
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
  beforeAll(() => {
    config.setCoinConfig(
      (): TezosCoinConfig => ({
        status: { type: "active" },
        baker: {
          url: "https://httpbin.org",
        },
        explorer: {
          url: "https://httpbin.org",
          maxTxQuery: 100,
        },
        node: {
          url: "https://httpbin.org",
        },
      }),
    );
  });

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
