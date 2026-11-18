import { InvalidTransactionError } from "@ledgerhq/coin-module-framework/errors";
import { createMockPrepareTransferResponse } from "../../test/fixtures";
import { combine } from "../combine";

const PARTY = "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000";
const { serialized, json } = createMockPrepareTransferResponse();
const crafted = JSON.stringify({ party: PARTY, serialized, json });

describe("combine", () => {
  it("should pair the party and serialized transaction with the signature, dropping the payload", () => {
    expect(JSON.parse(combine(crafted, ["SIGNATURE"]))).toEqual({
      party: PARTY,
      serialized,
      signature: "SIGNATURE",
    });
  });

  it.each([[[]], [["one", "two"]]])("should reject %j as the signatures", signatures => {
    expect(() => combine(crafted, signatures)).toThrow(
      `Canton combine expects exactly one signature, got ${signatures.length}`,
    );
  });

  it("should reject a bare serialized transaction", () => {
    expect(() => combine(serialized, ["SIGNATURE"])).toThrow(InvalidTransactionError);
  });
});
