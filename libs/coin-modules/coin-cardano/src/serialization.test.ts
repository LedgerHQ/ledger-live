import type { Account, AccountRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCardanoAccountFixture } from "./fixtures/accounts";
import { getDelegationFixture } from "./fixtures/delegation";
import { getProtocolParamsFixture } from "./fixtures/protocolParams";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromCardanoResourceRaw,
  toCardanoResourceRaw,
} from "./serialization";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";
import type { CardanoAccount, CardanoAccountRaw, CardanoResources, Transaction } from "./types";

const buildResources = (): CardanoResources => {
  const account = getCardanoAccountFixture({ delegation: getDelegationFixture() });
  account.cardanoResources.protocolParams = getProtocolParamsFixture();
  account.cardanoResources.utxos = [
    {
      ...account.cardanoResources.utxos[0],
      tokens: [{ policyId: "a".repeat(56), assetName: "b0b1", amount: new BigNumber(42) }],
    },
  ];
  return account.cardanoResources;
};

describe("cardano resources serialization", () => {
  it("restores the resources of an account after a raw round trip", () => {
    const resources = buildResources();

    const restored = fromCardanoResourceRaw(toCardanoResourceRaw(resources));

    expect(restored).toEqual(resources);
  });

  it("serializes the amounts of the utxos, tokens and delegation rewards as strings", () => {
    const raw = toCardanoResourceRaw(buildResources());

    expect({
      utxoAmount: raw.utxos[0].amount,
      tokenAmount: raw.utxos[0].tokens[0].amount,
      rewards: raw.delegation?.rewards,
    }).toEqual({ utxoAmount: "100000000", tokenAmount: "42", rewards: "0" });
  });

  it("keeps the delegation undefined when the stake key is not delegated", () => {
    const resources = { ...buildResources(), delegation: undefined };

    const restored = fromCardanoResourceRaw(toCardanoResourceRaw(resources));

    expect(restored.delegation).toBeUndefined();
  });

  it("assigns the resources to the raw account and back to the account", () => {
    const account = getCardanoAccountFixture({ delegation: getDelegationFixture() });
    account.cardanoResources = buildResources();
    const accountRaw = {} as AccountRaw;
    const restored = {} as Account;

    assignToAccountRaw(account as Account, accountRaw);
    assignFromAccountRaw(accountRaw, restored);

    expect({
      raw: (accountRaw as CardanoAccountRaw).cardanoResources.utxos[0].amount,
      restored: (restored as CardanoAccount).cardanoResources,
    }).toEqual({ raw: "100000000", restored: account.cardanoResources });
  });

  it("does not assign anything for an account without cardano resources", () => {
    const accountRaw = {} as AccountRaw;

    assignToAccountRaw({} as Account, accountRaw);

    expect(accountRaw).toEqual({});
  });
});

describe("cardano transaction serialization", () => {
  const transaction: Transaction = {
    family: "cardano",
    mode: "delegate",
    recipient: "",
    amount: new BigNumber(0),
    fees: new BigNumber(180000),
    memo: "memo",
    poolId: "a".repeat(56),
    protocolParams: getProtocolParamsFixture(),
    useAllAmount: false,
  };

  it("restores the transaction after a raw round trip", () => {
    const restored = fromTransactionRaw(toTransactionRaw(transaction));

    expect(restored).toEqual(transaction);
  });

  it("serializes the fees as a string and leaves missing fees undefined", () => {
    expect({
      fees: toTransactionRaw(transaction).fees,
      noFees: toTransactionRaw({ ...transaction, fees: undefined }).fees,
    }).toEqual({ fees: "180000", noFees: undefined });
  });

  it("formats a send max with its recipient", () => {
    const account = getCardanoAccountFixture({});

    const formatted = formatTransaction(
      { ...transaction, mode: "send", recipient: "addr_test1xyz", useAllAmount: true },
      account,
    );

    expect(formatted.replace(/\s+/g, " ").trim()).toBe("SEND MAX TO addr_test1xyz");
  });

  it("formats a send amount in the account unit", () => {
    const account = getCardanoAccountFixture({});

    const formatted = formatTransaction(
      { ...transaction, mode: "send", recipient: "addr_test1xyz", amount: new BigNumber(2.5e6) },
      account,
    );

    expect(formatted.replace(/\s+/g, " ").trim()).toBe("SEND 2.5 ADA TO addr_test1xyz");
  });
});
