import {
  fromOperationRaw,
  toOperationRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization/index";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  ICPAccount,
  ICPAccountRaw,
  ICPNeuron,
  InternetComputerOperation,
  InternetComputerOperationExtra,
  InternetComputerOperationExtraRaw,
  NeuronsData,
  NeuronState,
} from "../types";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";

const neuron: ICPNeuron = {
  id: 7n,
  accountIdentifier: "ab".repeat(32),
  state: NeuronState.Locked,
  dissolveDelaySeconds: 63_115_200n,
  ageSeconds: 0n,
  cachedNeuronStakeE8s: 500_000_000n,
  neuronFeesE8s: 0n,
  maturityE8sEquivalent: 0n,
  stakedMaturityE8sEquivalent: 0n,
  createdTimestampSeconds: 0n,
  dissolveState: { DissolveDelaySeconds: 63_115_200n },
  hotKeys: [],
  followees: [],
  autoStakeMaturity: false,
};

describe("account neuron (de)serialization", () => {
  it("serializes neurons to raw and restores them, preserving bigints", () => {
    const account = { neurons: new NeuronsData([neuron], 1_720_000_000_000) } as ICPAccount;
    const raw = {} as AccountRaw;

    assignToAccountRaw(account, raw);
    expect((raw as ICPAccountRaw).neuronsData?.lastUpdated).toBe(1_720_000_000_000);

    const restored = {} as ICPAccount;
    assignFromAccountRaw(raw, restored);
    expect(restored.neurons.fullNeurons).toEqual([neuron]);
    expect(restored.neurons.lastUpdatedMSecs).toBe(1_720_000_000_000);
  });

  it("restores an empty portfolio when the raw account carries no neuron data", () => {
    const restored = {} as ICPAccount;
    assignFromAccountRaw({} as AccountRaw, restored);
    expect(restored.neurons.fullNeurons).toEqual([]);
  });

  it("skips serialization for an account without neurons", () => {
    const raw = {} as AccountRaw;
    assignToAccountRaw({} as Account, raw);
    expect((raw as ICPAccountRaw).neuronsData).toBeUndefined();
  });
});

describe("operation extra (de)serialization", () => {
  it("is JSON-safe once converted, which is the whole point of the pair", () => {
    // A neuron snapshot reaches `extra` from a list_neurons broadcast, and the apps persist an
    // account by running its raw form through JSON.stringify. Unconverted, the bigints throw there
    // and the whole namespace save fails, silently.
    const extra: InternetComputerOperationExtra = { neurons: [neuron], methodName: "list_neurons" };

    expect(() => JSON.stringify(extra)).toThrow(TypeError);
    expect(() => JSON.stringify(toOperationExtraRaw(extra))).not.toThrow();
  });

  it("round-trips a neuron snapshot with its bigints intact", () => {
    const raw = toOperationExtraRaw({ neurons: [neuron] });

    expect(typeof (raw as InternetComputerOperationExtraRaw).neurons).toBe("string");
    // Through a real persistence round trip, not just the converter pair.
    const revived = fromOperationExtraRaw(JSON.parse(JSON.stringify(raw)));
    expect((revived as InternetComputerOperationExtra).neurons).toEqual([neuron]);
  });

  it("round-trips the scalar fields untouched", () => {
    const extra: InternetComputerOperationExtra = {
      memo: "42",
      createdNeuronId: "7",
      outcome: { maturityE8s: "0", stakedMaturityE8s: "100" },
      methodName: "stake_maturity",
    };

    expect(fromOperationExtraRaw(toOperationExtraRaw(extra))).toEqual(extra);
  });

  it("keeps an empty snapshot, which is a real answer and not a missing one", () => {
    const revived = fromOperationExtraRaw(toOperationExtraRaw({ neurons: [] }));
    expect((revived as InternetComputerOperationExtra).neurons).toEqual([]);
  });

  it("drops a key it does not know, rather than passing it through unconverted", () => {
    const raw = toOperationExtraRaw({
      memo: "1",
      somethingNew: 9n,
    } as InternetComputerOperationExtra);

    expect(raw).toEqual({ memo: "1" });
    expect(() => JSON.stringify(raw)).not.toThrow();
  });

  it("returns an empty extra for anything that is not an ICP extra", () => {
    expect(toOperationExtraRaw(undefined)).toEqual({});
    expect(toOperationExtraRaw("nonsense")).toEqual({});
    expect(fromOperationExtraRaw(null)).toEqual({});
    expect(fromOperationExtraRaw({ unrelated: true })).toEqual({});
  });

  it("falls back to an empty snapshot when the persisted neurons are corrupt", () => {
    const revived = fromOperationExtraRaw({ neurons: "{ not valid json" });
    expect((revived as InternetComputerOperationExtra).neurons).toEqual([]);
  });
});

describe("operation extra through the framework's own serialization", () => {
  const accountId = "js:2:internet_computer:pubkey:";
  const operation: InternetComputerOperation = {
    id: `${accountId}-req-NONE`,
    hash: "req",
    type: "NONE",
    senders: [],
    recipients: [],
    accountId,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    blockHash: null,
    blockHeight: null,
    date: new Date("2026-08-26T00:00:00.000Z"),
    extra: { neurons: [neuron], methodName: "list_neurons" },
  };

  it("throws without the converter — this is the regression being guarded", () => {
    // What the framework does when a family registers no converter: `extra` is copied into the raw
    // operation by reference, and the bigints inside it reach the persistence layer's JSON.stringify.
    expect(() => JSON.stringify(toOperationRaw(operation))).toThrow(TypeError);
  });

  it("survives a full persist/restore round trip with the converter registered", () => {
    const raw = toOperationRaw(operation, undefined, toOperationExtraRaw);
    const persisted = JSON.parse(JSON.stringify(raw));

    const revived = fromOperationRaw(
      persisted,
      accountId,
      undefined,
      fromOperationExtraRaw,
    ) as InternetComputerOperation;

    expect(revived.extra.neurons).toEqual([neuron]);
    expect(revived.extra.methodName).toBe("list_neurons");
  });
});
