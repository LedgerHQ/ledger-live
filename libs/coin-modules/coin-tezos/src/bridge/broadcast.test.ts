import { SignedOperation } from "@ledgerhq/types-live";
import { createFixtureOperation } from "../types/bridge.fixture";
import config, { type TezosCoinConfig } from "../config";
import { broadcast } from "./broadcast";
import { mockConfig } from "../test/config";

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
    config.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
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
