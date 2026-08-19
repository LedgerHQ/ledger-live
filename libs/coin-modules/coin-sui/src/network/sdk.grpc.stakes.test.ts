import type { SuiGrpcClient } from "@mysten/sui/grpc";
import { deriveDynamicFieldID } from "@mysten/sui/utils";
import type { StakeObject } from "@mysten/sui/jsonRpc";
import { getDelegatedStakesGrpc, getSystemStateGrpc, getValidatorsGrpc } from "./sdk.grpc";

const SYSTEM_STATE_ID = `0x${"0".repeat(63)}5`;
const OWNER = `0x${"0".repeat(63)}a`;
const POOL_A = `0x${"a".repeat(64)}`;
const POOL_B = `0x${"b".repeat(64)}`;
const VALIDATOR_A = `0x${"1".repeat(64)}`;
const VALIDATOR_B = `0x${"2".repeat(64)}`;
const RATES_A = `0x${"c".repeat(64)}`;
const RATES_B = `0x${"d".repeat(64)}`;

/** Move JSON arrives as `google.protobuf.Value`; only the shapes `protoValueToJson` unwraps. */
const proto = (value: unknown): unknown => {
  const wrap = (oneofKind: string, payload: unknown) => ({
    kind: { oneofKind, [oneofKind]: payload },
  });
  if (value === null || value === undefined) return wrap("nullValue", 0);
  if (typeof value === "string") return wrap("stringValue", value);
  if (typeof value === "number") return wrap("numberValue", value);
  if (typeof value === "boolean") return wrap("boolValue", value);
  if (Array.isArray(value)) return wrap("listValue", { values: value.map(proto) });
  return wrap("structValue", {
    fields: Object.fromEntries(Object.entries(value as object).map(([k, v]) => [k, proto(v)])),
  });
};

const validator = (address: string, poolId: string, ratesId: string) => ({
  metadata: {
    sui_address: address,
    name: `validator-${address.slice(2, 6)}`,
    description: "",
    image_url: "",
    project_url: "",
  },
  staking_pool: {
    id: poolId,
    activation_epoch: "1",
    // Current rate is 2 SUI per pool token; a stake activated at 1:1 has therefore doubled.
    sui_balance: "2000000",
    pool_token_balance: "1000000",
    exchange_rates: { id: ratesId },
  },
  commission_rate: "500",
});

const systemState = {
  epoch: "500",
  validators: {
    active_validators: [
      validator(VALIDATOR_A, POOL_A, RATES_A),
      validator(VALIDATOR_B, POOL_B, RATES_B),
    ],
  },
};

const stakedSui = (poolId: string, stakedSuiId: string, activationEpoch: string) => ({
  id: stakedSuiId,
  pool_id: poolId,
  stake_activation_epoch: activationEpoch,
  principal: "1000000",
});

/** Rates are fetched by derived field id, so tests key them the same way the code looks them up. */
const rateFieldId = (ratesId: string, epoch: number) => {
  const key = new Uint8Array(8);
  new DataView(key.buffer).setBigUint64(0, BigInt(epoch), true);
  return deriveDynamicFieldID(ratesId, { u64: true }, key);
};

const rate = (sui: string, poolToken: string) =>
  proto({ name: "0", value: { sui_amount: sui, pool_token_amount: poolToken } });

/** `estimatedReward` lives only on the Active arm of the `StakeObject` union. */
const reward = (stake?: StakeObject): string | undefined =>
  stake && stake.status === "Active" ? stake.estimatedReward : undefined;

type Stub = {
  api: SuiGrpcClient;
  listDynamicFields: jest.Mock;
  getObject: jest.Mock;
  listOwnedObjects: jest.Mock;
  batchGetObjects: jest.Mock;
};

function stubApi({
  state = systemState as unknown,
  owned = [] as unknown[],
  rates = new Map<string, unknown>(),
  fieldId = "0xinner" as string | null,
}): Stub {
  const listDynamicFields = jest.fn(() =>
    Promise.resolve({ dynamicFields: fieldId === null ? [] : [{ fieldId }] }),
  );
  const getObject = jest.fn(() => ({
    response: Promise.resolve({ object: { json: proto({ value: state }) } }),
  }));
  const listOwnedObjects = jest.fn(() => ({
    response: Promise.resolve({ objects: owned.map(json => ({ json: proto(json) })) }),
  }));
  // Keyed by derived field id, so a mispaired lookup resolves to a different rate — or to nothing —
  // rather than silently returning the same value for every pool.
  const batchGetObjects = jest.fn((req: { requests: { objectId: string }[] }) => ({
    response: Promise.resolve({
      objects: req.requests.map(({ objectId }) => {
        const json = rates.get(objectId);
        // The id is echoed back, as the node does: results are attributed by id, not by position.
        return json
          ? { result: { oneofKind: "object", object: { objectId, json } } }
          : { result: { oneofKind: "error", error: { code: 5 } } };
      }),
    }),
  }));

  return {
    api: {
      core: { listDynamicFields },
      ledgerService: { getObject, batchGetObjects },
      stateService: { listOwnedObjects },
    } as unknown as SuiGrpcClient,
    listDynamicFields,
    getObject,
    listOwnedObjects,
    batchGetObjects,
  };
}

describe("getSystemStateGrpc", () => {
  it("resolves the inner state through the 0x5 wrapper's dynamic field", async () => {
    const { api, listDynamicFields, getObject } = stubApi({});

    await expect(getSystemStateGrpc(api)).resolves.toMatchObject({ epoch: "500" });
    expect(listDynamicFields).toHaveBeenCalledWith({ parentId: SYSTEM_STATE_ID });
    expect(getObject).toHaveBeenCalledWith(expect.objectContaining({ objectId: "0xinner" }));
  });

  it("fails loudly when the wrapper exposes no dynamic field", async () => {
    const { api } = stubApi({ fieldId: null });

    await expect(getSystemStateGrpc(api)).rejects.toThrow(/no dynamic field/);
  });

  // The payload nests under `value`; the root fallback exists for renderings that omit the wrapper.
  it("accepts the state at the JSON root", async () => {
    const { api } = stubApi({});
    (api.ledgerService.getObject as unknown as jest.Mock).mockReturnValueOnce({
      response: Promise.resolve({ object: { json: proto(systemState) } }),
    });

    await expect(getSystemStateGrpc(api)).resolves.toMatchObject({ epoch: "500" });
  });

  it("rejects a payload that is not a system state", async () => {
    const { api } = stubApi({ state: { nope: true } });

    await expect(getSystemStateGrpc(api)).rejects.toThrow(Error);
  });
});

describe("getValidatorsGrpc", () => {
  // Both pools currently sit at 2 SUI per pool token (see `validator`). Pool A's lookback rate is
  // 1:1, so it grew and earns an APY; pool B's is already 2:1, so it earns none. `applyValidatorApy`
  // pairs plans to rates by index, so a shifted pairing swaps these two outcomes — and an APY shown
  // against the wrong validator is what a user picks a delegate on.
  const APY_LOOKBACK_EPOCH = 470; // currentEpoch 500 − APY_LOOKBACK_EPOCHS 30

  it("derives one validator per active pool", async () => {
    const { api } = stubApi({
      rates: new Map([
        [rateFieldId(RATES_A, APY_LOOKBACK_EPOCH), rate("1000000", "1000000")],
        [rateFieldId(RATES_B, APY_LOOKBACK_EPOCH), rate("2000000", "1000000")],
      ]),
    });

    const validators = await getValidatorsGrpc(api);

    expect(validators.map(v => v.suiAddress)).toEqual([VALIDATOR_A, VALIDATOR_B]);
  });

  it("attributes each pool's APY to its own validator", async () => {
    const { api } = stubApi({
      rates: new Map([
        [rateFieldId(RATES_A, APY_LOOKBACK_EPOCH), rate("1000000", "1000000")],
        [rateFieldId(RATES_B, APY_LOOKBACK_EPOCH), rate("2000000", "1000000")],
      ]),
    });

    const byAddress = new Map((await getValidatorsGrpc(api)).map(v => [v.suiAddress, v.apy]));

    expect(byAddress.get(VALIDATOR_A)).toBeGreaterThan(0);
    expect(byAddress.get(VALIDATOR_B)).toBe(0);
  });

  // Only one rate resolves: the validator with no rate must degrade to 0 rather than inherit the
  // other's APY, which is precisely what a positional shift past a missing entry would do.
  it("degrades to a zero APY for the validator whose rate is missing", async () => {
    const { api } = stubApi({
      rates: new Map([[rateFieldId(RATES_A, APY_LOOKBACK_EPOCH), rate("1000000", "1000000")]]),
    });

    const byAddress = new Map((await getValidatorsGrpc(api)).map(v => [v.suiAddress, v.apy]));

    expect(byAddress.get(VALIDATOR_A)).toBeGreaterThan(0);
    expect(byAddress.get(VALIDATOR_B)).toBe(0);
  });
});

describe("getDelegatedStakesGrpc", () => {
  // The rate lookups are issued as one batch and paired back to stakes by array index. If that
  // alignment ever slips, one stake silently inherits another pool's exchange rate — and therefore
  // another pool's reward — with no error anywhere.
  it("pairs each pool's rate with its own stake", async () => {
    const { api, batchGetObjects } = stubApi({
      owned: [stakedSui(POOL_A, "0xstake-a", "400"), stakedSui(POOL_B, "0xstake-b", "400")],
      rates: new Map([
        // Pool A activated at 1:1 and now sits at 2:1, so its stake doubled. Pool B activated at
        // the current 2:1 rate, so its stake earned nothing.
        [rateFieldId(RATES_A, 400), rate("1000000", "1000000")],
        [rateFieldId(RATES_B, 400), rate("2000000", "1000000")],
      ]),
    });

    const groups = await getDelegatedStakesGrpc(api, OWNER);
    const byPool = new Map(groups.map(g => [g.stakingPool, g.stakes]));

    // Pool A's activation rate is half the current rate, so its stake accrued rewards; pool B's
    // rate is unchanged, so its stake accrued none. Swapped pairing inverts both.
    expect(reward(byPool.get(POOL_A)?.[0])).not.toBe("0");
    expect(reward(byPool.get(POOL_B)?.[0])).toBe("0");
    // One batch, both pools in it.
    expect(batchGetObjects).toHaveBeenCalledTimes(1);
    expect(batchGetObjects.mock.calls[0][0].requests).toHaveLength(2);
  });

  it("attributes each stake to its validator", async () => {
    const { api } = stubApi({
      owned: [stakedSui(POOL_B, "0xstake-b", "400")],
      rates: new Map([[rateFieldId(RATES_B, 400), rate("2000000", "1000000")]]),
    });

    const [group] = await getDelegatedStakesGrpc(api, OWNER);

    expect(group.validatorAddress).toBe(VALIDATOR_B);
    expect(group.stakes[0].stakedSuiId).toBe("0xstake-b");
  });

  // A rate that cannot be resolved must degrade to a zero reward, never drop the stake: the
  // principal is real money and has to stay visible in the account.
  it("keeps the stake with a zero reward when its rate cannot be fetched", async () => {
    const { api } = stubApi({
      owned: [stakedSui(POOL_A, "0xstake-a", "400")],
      rates: new Map(),
    });

    const [group] = await getDelegatedStakesGrpc(api, OWNER);

    expect(group.stakes).toHaveLength(1);
    expect(reward(group.stakes[0])).toBe("0");
    expect(group.stakes[0].principal).toBe("1000000");
  });

  it("skips malformed owned objects without failing the sync", async () => {
    const { api } = stubApi({
      owned: [stakedSui(POOL_B, "0xstake-b", "400"), { not: "a stake" }],
      rates: new Map([[rateFieldId(RATES_B, 400), rate("2000000", "1000000")]]),
    });

    const groups = await getDelegatedStakesGrpc(api, OWNER);

    expect(groups.flatMap(g => g.stakes)).toHaveLength(1);
  });

  it("returns nothing when the owner holds no StakedSui", async () => {
    const { api } = stubApi({ owned: [] });

    await expect(getDelegatedStakesGrpc(api, OWNER)).resolves.toEqual([]);
  });

  // A stake activating in a future epoch has no activation rate yet, so it must trigger no lookup
  // and carry no `estimatedReward` — the JSON-RPC convention the other transports also follow.
  it("marks a future-epoch stake Pending without fetching a rate", async () => {
    const { api, batchGetObjects } = stubApi({
      owned: [stakedSui(POOL_A, "0xstake-a", "501")],
      rates: new Map([[rateFieldId(RATES_A, 400), rate("1000000", "1000000")]]),
    });

    const [group] = await getDelegatedStakesGrpc(api, OWNER);

    expect(batchGetObjects).not.toHaveBeenCalled();
    expect(group.stakes[0].status).toBe("Pending");
    expect(group.stakes[0]).not.toHaveProperty("estimatedReward");
  });
});
