import { toAccountRaw } from "@ledgerhq/ledger-wallet-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { PolkadotOperationExtra, PolkadotResources } from "../types";
import { createFixtureAccount } from "../types/bridge.fixture";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";

const VALIDATOR = "13jAJfhpFkRZj1TSSdFopaiFeKnof2q7g4GNdcxcg8Lvx6QN";
const STASH = "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV";

const resources: PolkadotResources = {
  controller: STASH,
  stash: STASH,
  nonce: 12,
  lockedBalance: new BigNumber(50_000_000_000),
  unlockedBalance: new BigNumber(1_000_000),
  unlockingBalance: new BigNumber(10_000_000_000),
  unlockings: [{ amount: new BigNumber(10_000_000_000), completionDate: new Date("2030-01-01") }],
  nominations: [
    {
      address: VALIDATOR,
      value: new BigNumber(40_000_000_000),
      status: "active",
      isRegistered: true,
    },
  ],
  numSlashingSpans: 2,
};

const resourcesRaw = {
  controller: STASH,
  stash: STASH,
  nonce: 12,
  lockedBalance: "50000000000",
  unlockedBalance: "1000000",
  unlockingBalance: "10000000000",
  unlockings: [{ amount: "10000000000", completionDate: "2030-01-01T00:00:00.000Z" }],
  nominations: [{ address: VALIDATOR, value: "40000000000", status: "active", isRegistered: true }],
  numSlashingSpans: 2,
};

describe("polkadot account serialization", () => {
  const withoutResources = (): Account => {
    const { polkadotResources: _resources, ...account } = createFixtureAccount();
    return account;
  };

  it("serializes the polkadot resources of an account", () => {
    const account = createFixtureAccount({ polkadotResources: resources });
    const accountRaw = toAccountRaw(withoutResources());

    assignToAccountRaw(account, accountRaw);

    expect(accountRaw).toMatchObject({ polkadotResources: resourcesRaw });
  });

  it("deserializes the polkadot resources of an account", () => {
    const account = withoutResources();
    const accountRaw = { ...toAccountRaw(account), polkadotResources: resourcesRaw };

    assignFromAccountRaw(accountRaw, account);

    expect(account).toMatchObject({ polkadotResources: resources });
  });

  it("keeps the missing optional resources undefined", () => {
    const original = createFixtureAccount();
    const accountRaw = toAccountRaw(withoutResources());
    assignToAccountRaw(original, accountRaw);
    const restored = withoutResources();

    assignFromAccountRaw(accountRaw, restored);

    expect(restored).toMatchObject({ polkadotResources: original.polkadotResources });
  });

  it("leaves the raw account untouched without polkadot resources", () => {
    const accountRaw = toAccountRaw(withoutResources());
    const untouched = { ...accountRaw };

    assignToAccountRaw(withoutResources(), accountRaw);

    expect(accountRaw).toEqual(untouched);
  });

  it("leaves the account untouched without raw polkadot resources", () => {
    const account = withoutResources();
    const untouched = { ...account };

    assignFromAccountRaw(toAccountRaw(account), account);

    expect(account).toEqual(untouched);
  });
});

describe("polkadot operation extra serialization", () => {
  const extra: PolkadotOperationExtra = {
    palletMethod: "staking.bond",
    transferAmount: new BigNumber(1),
    bondedAmount: new BigNumber(2),
    unbondedAmount: new BigNumber(3),
    withdrawUnbondedAmount: new BigNumber(4),
    validatorStash: STASH,
    validators: [VALIDATOR],
  };

  const extraRaw = {
    palletMethod: "staking.bond",
    transferAmount: "1",
    bondedAmount: "2",
    unbondedAmount: "3",
    withdrawUnbondedAmount: "4",
    validatorStash: STASH,
    validators: [VALIDATOR],
  };

  it("serializes every amount of an operation extra", () => {
    expect(toOperationExtraRaw(extra)).toEqual(extraRaw);
  });

  it("deserializes every amount of an operation extra", () => {
    expect(fromOperationExtraRaw(extraRaw)).toEqual(extra);
  });

  it("serializes only the amounts that are set", () => {
    expect(toOperationExtraRaw({ palletMethod: "balances.transfer" })).toEqual({
      palletMethod: "balances.transfer",
      validatorStash: undefined,
      validators: undefined,
    });
  });

  it("deserializes only the amounts that are set", () => {
    expect(fromOperationExtraRaw({ palletMethod: "balances.transfer" })).toEqual({
      palletMethod: "balances.transfer",
      validatorStash: undefined,
      validators: undefined,
    });
  });

  it("rejects an operation extra from another family", () => {
    expect(() => toOperationExtraRaw({ unrelated: true })).toThrow("Unsupported OperationExtra");
  });

  it("rejects a raw operation extra from another family", () => {
    expect(() => fromOperationExtraRaw({ unrelated: true })).toThrow(
      "Unsupported OperationExtraRaw",
    );
  });
});
