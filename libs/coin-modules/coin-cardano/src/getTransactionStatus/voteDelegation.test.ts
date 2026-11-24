import BigNumber from "bignumber.js";
import { getCardanoAccountFixture } from "../fixtures/accounts";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import { getVoteDelegationTransactionStatus } from "./voteDelegation";

const voteDelegationTarget = { type: "alwaysAbstain" as const };

describe("getVoteDelegationTransactionStatus", () => {
  it("should include the prepared stake-key deposit in outgoing amount when registering", async () => {
    const account = getCardanoAccountFixture({ delegation: undefined });
    account.cardanoResources.protocolParams = {
      ...getProtocolParamsFixture(),
      stakeKeyDeposit: 3_000_000,
    };
    const protocolParams = getProtocolParamsFixture();

    const status = await getVoteDelegationTransactionStatus(account, {
      family: "cardano",
      mode: "voteDelegation",
      recipient: "",
      amount: new BigNumber(0),
      fees: new BigNumber(100_000),
      poolId: undefined,
      protocolParams,
      voteDelegationTarget,
    });

    expect(status.totalSpent).toEqual(new BigNumber(2_100_000));
  });

  it("should return the dedicated error for an invalid DRep ID", async () => {
    const account = getCardanoAccountFixture({ delegation: { status: true } });
    account.cardanoResources.protocolParams = getProtocolParamsFixture();

    const status = await getVoteDelegationTransactionStatus(account, {
      family: "cardano",
      mode: "voteDelegation",
      recipient: "",
      amount: new BigNumber(0),
      fees: new BigNumber(100_000),
      poolId: undefined,
      protocolParams: getProtocolParamsFixture(),
      voteDelegationTarget: { type: "drep", drepId: "drep1legacy" },
    });

    expect(status.errors.voteDelegationTarget?.name).toBe("CardanoInvalidDRepId");
  });
});
