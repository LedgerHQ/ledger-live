import BigNumber from "bignumber.js";
import { CardanoInvalidProtoParams } from "../errors";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import type { CardanoAccount, Transaction } from "../types";
import { getDelegateTransactionStatus } from "./delegate";

const accountWithDeposit = (stakeKeyDeposit: string) =>
  ({
    spendableBalance: new BigNumber(0),
    cardanoResources: {
      protocolParams: { ...getProtocolParamsFixture(), stakeKeyDeposit },
      delegation: undefined,
    },
  }) as unknown as CardanoAccount;

const delegateTx = {
  family: "cardano",
  mode: "delegate",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(1),
  poolId: "invalid",
} as Transaction;

describe("getDelegateTransactionStatus", () => {
  it("reports the stake key deposit error when the balance cannot cover it", async () => {
    const { errors } = await getDelegateTransactionStatus(
      accountWithDeposit("2000000"),
      delegateTx,
    );

    expect(errors.amount.name).toBe("CardanoStakeKeyDepositError");
  });

  it.each(["abc", ""])(
    "reports invalid protocol params instead of throwing on a %p deposit",
    async stakeKeyDeposit => {
      const { errors } = await getDelegateTransactionStatus(
        accountWithDeposit(stakeKeyDeposit),
        delegateTx,
      );

      expect(errors.amount).toBeInstanceOf(CardanoInvalidProtoParams);
    },
  );

  it("reads the deposit from the transaction's fresh protocol params over the cached ones", async () => {
    const { errors } = await getDelegateTransactionStatus(accountWithDeposit("abc"), {
      ...delegateTx,
      protocolParams: getProtocolParamsFixture(),
    } as Transaction);

    expect(errors.amount.name).toBe("CardanoStakeKeyDepositError");
  });

  it("keeps the invalid protocol params error over the stake key deposit one", async () => {
    const { errors } = await getDelegateTransactionStatus(accountWithDeposit("2000000"), {
      ...delegateTx,
      poolId: "a".repeat(56),
      protocolParams: { ...getProtocolParamsFixture(), minFeeRefScriptCostPerByte: "abc" },
    } as Transaction);

    expect(errors.amount).toBeInstanceOf(CardanoInvalidProtoParams);
  });

  it("reports invalid protocol params when building with a valid pool id fails on them", async () => {
    const { errors } = await getDelegateTransactionStatus(accountWithDeposit("abc"), {
      ...delegateTx,
      poolId: "a".repeat(56),
      protocolParams: { ...getProtocolParamsFixture(), stakeKeyDeposit: "abc" },
    } as Transaction);

    expect(errors.amount).toBeInstanceOf(CardanoInvalidProtoParams);
  });
});
