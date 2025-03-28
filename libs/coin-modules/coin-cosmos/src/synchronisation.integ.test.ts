import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { SyncConfig } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAccountShape } from "./synchronisation";
import { CosmosAccount } from "./types";

describe("Testing synchronisation", () => {
  const testAccounts = [
    { id: "cosmos", unit: "uatom", address: "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq" },
    { id: "injective", unit: "inj", address: "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq" },
  ];

  async function fetchAccountShape(id: string, unit: string, address: string) {
    return getAccountShape(
      {
        address,
        currency: {
          id,
          units: [{}, { code: unit }],
        } as CryptoCurrency,
        index: 0,
        derivationMode: "",
      } as AccountShapeInfo<CosmosAccount>,
      {} as SyncConfig,
    );
  }

  it.each(testAccounts)("should synchronize %s", async ({ id, unit, address }) => {
    const result = await fetchAccountShape(id, unit, address);

    expect(result).toBeDefined();
    expect(result.balance?.isGreaterThanOrEqualTo(0)).toBeTruthy();
    expect(result.blockHeight).toBeGreaterThanOrEqual(0);
    expect(result.id).toEqual(`js:2:${id}:${address}:`);
  });

  it.each(testAccounts)(
    "should validate delegated balance for %s",
    async ({ id, unit, address }) => {
      const result = await fetchAccountShape(id, unit, address);

      expect(result).toBeDefined();
      expect(result.balance?.isGreaterThanOrEqualTo(0)).toBeTruthy();
      expect(result.blockHeight).toBeGreaterThanOrEqual(0);
      expect(result.id).toEqual(`js:2:${id}:${address}:`);

      if (result.cosmosResources) {
        const { cosmosResources } = result;
        expect(cosmosResources.delegatedBalance).toEqual(
          cosmosResources.delegations
            .map(d => d.amount)
            .reduce((acc, curr) => acc.plus(curr), BigNumber(0)),
        );

        expect(cosmosResources.pendingRewardsBalance.isGreaterThanOrEqualTo(0)).toBeTruthy();
        expect(cosmosResources.sequence).toBeGreaterThanOrEqual(0);

        expect(cosmosResources.unbondingBalance).toEqual(
          cosmosResources.unbondings
            .map(u => u.amount)
            .reduce((acc, curr) => acc.plus(curr), BigNumber(0)),
        );

        expect(cosmosResources.withdrawAddress).toBeDefined();
      }

      if (result.operations) {
        expect(result.operationsCount).toEqual(result.operations.length);
        validateOperations(result.operations, address, id);
      }

      expect(result.spendableBalance?.isGreaterThanOrEqualTo(0)).toBeTruthy();
      expect(result.xpub).toEqual(address);
    },
  );

  function validateOperations(operations: any[], address: string, id: string) {
    operations.forEach(operation => {
      expect(operation.accountId).toBeDefined();
      expect(operation.blockHeight).toBeGreaterThanOrEqual(0);
      expect(operation.date).toBeDefined();
      expect(operation.fee.isGreaterThanOrEqualTo(0)).toBeTruthy();
      expect(operation.hasFailed).toBeDefined();
      expect(operation.hash).toBeDefined();
      expect(operation.id).toContain(`js:2:${id}:${address}:`);
      expect(operation.type).toMatch(
        /IN|REWARD|DELEGATE|UNDELEGATE|CLAIMREWARD|SEND|MULTISEND|FAILURE/,
      );
      expect(operation.value.isGreaterThanOrEqualTo(0)).toBeTruthy();
      expect(operation.transactionSequenceNumber).toBeDefined();

      if (operation.type === "IN") {
        expect(operation.recipients.length).toBeGreaterThan(0);
        expect(operation.recipients.every((r: any) => r)).toBeTruthy();
        expect(operation.senders.length).toBeGreaterThan(0);
        expect(operation.senders.every((s: any) => s)).toBeTruthy();
      }

      if (["REWARD", "DELEGATE", "UNDELEGATE", "CLAIMREWARD"].includes(operation.type)) {
        expect(operation.recipients).toHaveLength(0);
        expect(operation.senders).toHaveLength(0);

        const extra = operation.extra as { validators: { address: string; amount: BigNumber }[] };
        extra.validators.forEach(validator => {
          expect(validator.address).toBeDefined();
          expect(validator.amount.isGreaterThanOrEqualTo(0)).toBeTruthy();
        });
      }

      if (operation.type === "FAILURE") {
        expect(operation.recipients).toBeDefined();
        expect(operation.senders).toBeDefined();
        expect(operation.value.isEqualTo(0)).toBeTruthy();
      }
    });
  }
});
