import { setCoinConfig } from "../config";
import { getOperations } from "./indexer";
import { getGasPrice, getStakingPositions, getValidators } from "./node";

const ACCOUNT_WITH_HISTORY = "nearkat.near";
const DELEGATOR = "81afe80a9d91c82f66122c35ef400da709bde01eada5aae8d7a63bbf68f42040";

describe("NearBlocks indexer (integration)", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      infra: {
        API_NEAR_PRIVATE_NODE: "https://near.coin.ledger.com/node",
        API_NEAR_PUBLIC_NODE: "https://rpc.mainnet.near.org",
        API_NEAR_INDEXER: "https://near.coin.ledger.com/indexer",
        API_NEARBLOCKS_INDEXER: "https://near-indexer.coin.ledger.com",
      },
    }));
  });

  it("maps a real account history into operations", async () => {
    const operations = await getOperations("accountId", ACCOUNT_WITH_HISTORY);

    expect(operations.length).toBeGreaterThan(0);
    expect(operations.length).toBeLessThanOrEqual(25);

    operations.forEach(operation => {
      expect(operation.hash).toMatch(/\S/);
      expect(operation.value.isNaN()).toBe(false);
      expect(operation.value.isNegative()).toBe(false);
      expect(operation.fee.isNaN()).toBe(false);
      expect(typeof operation.blockHeight).toBe("number");
      expect(Number.isFinite(operation.blockHeight as number)).toBe(true);
      expect(operation.blockHash).toMatch(/\S/);
      expect(operation.date.getTime()).toBeGreaterThan(new Date("2020-01-01").getTime());
      expect(operation.date.getTime()).toBeLessThan(Date.now() + 60_000);
    });
  });

  it("reads a usable gas price", async () => {
    const gasPrice = await getGasPrice();

    expect(gasPrice).toMatch(/^\d+$/);
    expect(BigInt(gasPrice) > 0n).toBe(true);
  });

  it("walks the cursor to collect the requested number of distinct validators", async () => {
    const validators = await getValidators({ total: 200 });

    expect(validators).toHaveLength(200);
    expect(new Set(validators.map(validator => validator.account_id)).size).toBe(200);

    validators.forEach(validator => {
      expect(validator.account_id).toMatch(/\S/);
      expect(validator.stake).toMatch(/^\d+$/);
      expect(Number.isInteger(validator.commission)).toBe(true);
      expect(validator.commission).toBeGreaterThanOrEqual(0);
      expect(validator.commission).toBeLessThanOrEqual(100);
    });
  });

  it("honours a total smaller than a single indexer page", async () => {
    getValidators.reset();

    const validators = await getValidators({ total: 7 });

    expect(validators).toHaveLength(7);
  });

  it("resolves the staking positions of a delegating account", async () => {
    const { stakingPositions, totalStaked, totalAvailable, totalPending } =
      await getStakingPositions(DELEGATOR);

    expect(totalStaked.isNaN()).toBe(false);
    expect(totalAvailable.isNaN()).toBe(false);
    expect(totalPending.isNaN()).toBe(false);

    stakingPositions.forEach(position => {
      expect(position.validatorId).toMatch(/\S/);
      expect(position.staked.isNaN()).toBe(false);
      expect(position.available.isNaN()).toBe(false);
      expect(position.pending.isNaN()).toBe(false);
    });
  });
});
