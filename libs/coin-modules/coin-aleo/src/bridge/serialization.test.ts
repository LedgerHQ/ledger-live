import BigNumber from "bignumber.js";
import type { AleoOperationExtra, AleoOperationExtraRaw } from "../types/bridge";
import { fromOperationExtraRaw, toOperationExtraRaw } from "./serialization";

describe("operation extra serialization", () => {
  it("round-trips staking amount fields through toOperationExtraRaw/fromOperationExtraRaw", () => {
    const extra: AleoOperationExtra = {
      functionId: "unbond_public",
      transactionType: "public",
      estimatedUnbondedAmount: new BigNumber("123456789"),
    };

    const raw = toOperationExtraRaw(extra);
    expect(raw).toEqual({
      functionId: "unbond_public",
      transactionType: "public",
      estimatedUnbondedAmount: "123456789",
    });

    const roundTripped = fromOperationExtraRaw(raw);
    expect((roundTripped as AleoOperationExtra).estimatedUnbondedAmount?.toString()).toBe(
      "123456789",
    );
  });

  it("omits staking amount fields when absent", () => {
    const extra: AleoOperationExtra = { functionId: "transfer_public", transactionType: "public" };
    const raw: AleoOperationExtraRaw = toOperationExtraRaw(extra);
    expect(raw.estimatedBondedAmount).toBeUndefined();
    expect(raw.estimatedUnbondedAmount).toBeUndefined();
    expect(raw.estimatedWithdrawUnbondedAmount).toBeUndefined();
  });
});
