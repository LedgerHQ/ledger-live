import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation, SyncConfig } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAccountShape } from "./synchronisation";
import { CeloAccount } from "../types";

const testAccounts = {
  id: "celo",
  unit: "CELO",
  address: "0xcFF22f4D2D1EcABaFD62aE15A8e2EaB9093F3f96",
};

describe("Testing synchronisation", () => {
  let operations: Operation[];
  let result: Partial<CeloAccount>;

  beforeAll(async () => {
    result = await getAccountShape(
      {
        address: testAccounts.address,
        currency: {
          id: testAccounts.id,
          units: [{}, { code: testAccounts.unit }],
        } as CryptoCurrency,
        index: 0,
        derivationMode: "",
      } as AccountShapeInfo<CeloAccount>,
      {} as SyncConfig,
    );
    if (result.operations) {
      operations = result.operations;
    }
  }, 30000);

  it("should return valid value", async () => {
    expect(result).toBeDefined();
    expect(result.balance?.isGreaterThanOrEqualTo(0)).toBe(true);
    expect(result.blockHeight).toBeGreaterThanOrEqual(0);
    expect(result.id).toEqual(`js:2:${testAccounts.id}:${testAccounts.address}:`);

    if (!result.celoResources) {
      fail();
    }

    if (result.operations) {
      expect(result.operationsCount).toEqual(result.operations.length);
      result.operations.forEach(operation => {
        expect(operation.accountId).toContain(testAccounts.id);
        expect(operation.blockHeight).toBeGreaterThanOrEqual(0);
        expect(operation.fee.isGreaterThanOrEqualTo(0)).toBe(true);
        expect(operation.id).toContain(`js:2:${testAccounts.id}:${testAccounts.address}:`);
        expect(operation.value.isGreaterThanOrEqualTo(0)).toBe(true);
        if (["REWARD", "DELEGATE", "UNDELEGATE", "CLAIMREWARD"].includes(operation.type)) {
          expect(operation.recipients).toHaveLength(0);
          expect(operation.senders).toHaveLength(0);

          const extra = operation.extra as { validators: { address: string; amount: BigNumber }[] };
          extra.validators.forEach(validator => {
            expect(validator.address).toBeDefined();
            expect(validator.amount.isGreaterThanOrEqualTo(0)).toBe(true);
          });
        }

        if (operation.type.toString() === "FAILURE") {
          expect(operation.hasFailed).toBe(true);
          expect(operation.recipients).toBeDefined();
          expect(operation.senders).toBeDefined();
          expect(operation.value.isEqualTo(0)).toBe(true);
        }
      });
    }

    expect(result.spendableBalance?.isGreaterThanOrEqualTo(0)).toBe(true);
  });

  it("should fetch operations successfully", async () => {
    expect(Array.isArray(operations)).toBeDefined();
  });

  it("WITHDRAW", () => {
    const txHash = "0xd2024c8f13a8af7148de99af5b7213cff115fd532bd9a903493b7baa3fa200c5";
    const operation = operations.find(op => op.hash === txHash);
    expect(operation).toBeDefined();
    expect(operation!.fee.isEqualTo(BigNumber(542352000000000))).toBe(true);
    expect(operation!.accountId).toContain("js:2:celo:0xcFF22f4D2D1EcABaFD62aE15A8e2EaB9093F3f96:");
    expect(operation!.hasFailed).toBe(false);
    expect(operation?.senders[0]).toContain("0xcff22f4d2d1ecabafd62ae15a8e2eab9093f3f96");
    expect(operation?.value.isEqualTo(BigNumber(1000000000000000))).toBe(true);
  });

  it("OUT", () => {
    const txHash = "0xabb2853312a12efd7cb6ffb24eedd1ccab9fda0ec2724a5332fc49ed32a9e013";
    const operation = operations.find(op => op.hash === txHash);
    expect(operation).toBeDefined();
    expect(operation!.fee.isEqualTo(BigNumber(630021000000000))).toBe(true);
    expect(operation!.accountId).toContain("js:2:celo:0xcFF22f4D2D1EcABaFD62aE15A8e2EaB9093F3f96:");
    expect(operation!.hasFailed).toBe(false);
    expect(operation?.value.isEqualTo(BigNumber(500000000000000000))).toBe(true);
  });

  it("IN", () => {
    const txHash = "0x3667faa6374911dfde2dfa8f034dd20264e12b49ea2c9dc3a970aa9a578c1b1c";
    const operation = operations.find(op => op.hash === txHash);
    expect(operation).toBeDefined();
    expect(operation!.fee.isEqualTo(BigNumber(630021000000000))).toBe(true);
    expect(operation!.accountId).toContain("js:2:celo:0xcFF22f4D2D1EcABaFD62aE15A8e2EaB9093F3f96:");
    expect(operation!.hasFailed).toBe(false);
    expect(Array.isArray(operation?.extra)).toBeDefined();
    expect(operation?.value.isEqualTo(BigNumber(1000000000000000000))).toBe(true);
  });
});
