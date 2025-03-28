import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { SyncConfig } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAccountShape } from "./synchronisation";
import { CosmosAccount } from "./types";

describe("Testing synchronisation", () => {
  it("should test", async () => {
    const addressId = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";
    const result = await getAccountShape(
      {
        address: addressId,
        currency: {
          id: "cosmos",
          units: [{}, { code: "uatom" }],
        } as CryptoCurrency,
        index: 0,
        derivationMode: "",
      } as AccountShapeInfo<CosmosAccount>,
      {} as SyncConfig,
    );

    expect(result).not.toBeUndefined();
    expect(result.balance?.isGreaterThanOrEqualTo(0)).toBeTruthy();
    expect(result.blockHeight).toBeGreaterThanOrEqual(0);
    expect(result.id).toEqual("js:2:cosmos:" + addressId + ":");

    if (result.cosmosResources) {
      expect(result.cosmosResources.delegatedBalance).toEqual(
        result.cosmosResources.delegations
          .map(delegation => delegation.amount)
          .reduce((accumulator, currentValue) => accumulator.plus(currentValue), BigNumber(0)),
      );

      expect(result.cosmosResources.pendingRewardsBalance.isGreaterThanOrEqualTo(0)).toBeTruthy();
      expect(result.cosmosResources.sequence).toBeGreaterThanOrEqual(0); // Check definition

      expect(result.cosmosResources.unbondingBalance).toEqual(
        result.cosmosResources.unbondings
          .map(unbounding => unbounding.amount)
          .reduce((accumulator, currentValue) => accumulator.plus(currentValue), BigNumber(0)),
      );

      expect(result.cosmosResources.withdrawAddress).not.toBeUndefined();
    }

    if (result.operations) {
      expect(result.operationsCount).toEqual(result.operations.length);
      result.operations.forEach(operation => {
        expect(operation.accountId).not.toBeUndefined();
        expect(operation.blockHeight).toBeGreaterThanOrEqual(0);
        expect(operation.date).not.toBeUndefined();
        expect(operation.fee.isGreaterThanOrEqualTo(0)).toBeTruthy();
        expect(operation.hasFailed).not.toBeUndefined();
        expect(operation.hash).not.toBeUndefined();
        // need to be tested ?
        // expect(operation.blockHash).not.toBeUndefined();
        // expect((operation.extra as { memo: string }).memo).not.toBeUndefined();

        expect(operation.id).toContain("js:2:cosmos:" + addressId + ":");
        expect(operation.type).toMatch(/IN|REWARD|DELEGATE/);
        expect(operation.value.isGreaterThanOrEqualTo(0)).toBeTruthy();
        expect(operation.transactionSequenceNumber).not.toBeUndefined();

        //TODO do we need to check transactionRaw
        //expect(operation.transactionRaw).not.toBeUndefined();

        if (operation.type === "IN") {
          expect(operation.recipients.length).toBeGreaterThan(0);
          expect(operation.recipients.every(recipient => recipient !== undefined)).toBeTruthy();

          expect(operation.senders.length).toBeGreaterThan(0);
          expect(operation.senders.every(sender => sender !== undefined)).toBeTruthy();
        }

        if (operation.type === "REWARD" || operation.type === "DELEGATE") {
          expect(operation.recipients).toHaveLength(0);
          expect(operation.senders).toHaveLength(0);

          const extra = operation.extra as { validators: { address: string; amount: BigNumber }[] };
          extra.validators.forEach(validator => {
            expect(validator.address).not.toBeUndefined();
            expect(validator.amount.isGreaterThanOrEqualTo(0)).toBeTruthy(); // Check if >= 0
          });
        }
      });
    }

    expect(result.spendableBalance?.isGreaterThanOrEqualTo(0)).toBeTruthy();
    expect(result.xpub).toEqual(addressId);
  });
});
