import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation, SyncConfig } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAccountShape } from "./synchronisation";
import { CosmosAccount } from "./types";
import * as cryptoFactoryModule from "./chain/chain";

const testAccounts = [
  {
    id: "cosmos",
    unit: "uatom",
    address: "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq",
    lcd: "https://cosmoshub4.coin.ledger.com",
    version: "v1beta1",
  },
  {
    id: "injective",
    unit: "inj",
    address: "inj1vmzrwxhgllkjaswzawaue7m7f9qcrc0rfth2v2",
    lcd: "https://injective-rest.publicnode.com",
    version: "v1beta1",
  },
];

describe.each(testAccounts)("Testing synchronisation", ({ id, unit, address, lcd, version }) => {
  let result: Partial<CosmosAccount>;
  beforeEach(async () => {
    jest.spyOn(cryptoFactoryModule, "default").mockReturnValue({
      lcd,
      stakingDocUrl: "",
      unbondingPeriod: 0,
      ledgerValidator: undefined,
      validatorPrefix: "",
      prefix: "",
      defaultPubKeyType: "",
      defaultGas: 0,
      minGasPrice: 0,
      version,
    });
    result = await getAccountShape(
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
  }, 30000);

  function sumOf(amounts: BigNumber[]): BigNumber {
    return amounts.reduce((acc, curr) => acc.plus(curr), BigNumber(0));
  }

  it("should validate delegated balance for %s", async () => {
    expect(result).toBeDefined();
    expect(result.balance?.isGreaterThanOrEqualTo(0)).toBe(true);
    expect(result.blockHeight).toBeGreaterThanOrEqual(0);
    expect(result.id).toEqual(`js:2:${id}:${address}:`);

    if (!result.cosmosResources) {
      fail();
    }
    const { cosmosResources } = result;
    expect(cosmosResources.delegatedBalance).toEqual(
      sumOf(cosmosResources.delegations.map(d => d.amount)),
    );

    expect(cosmosResources.pendingRewardsBalance.isGreaterThanOrEqualTo(0)).toBe(true);
    expect(cosmosResources.sequence).toBeGreaterThanOrEqual(0);

    expect(cosmosResources.unbondingBalance).toEqual(
      sumOf(cosmosResources.unbondings.map(d => d.amount)),
    );

    expect(cosmosResources.withdrawAddress).toBeDefined();

    if (result.operations) {
      expect(result.operationsCount).toEqual(result.operations.length);
      result.operations.forEach(operation => {
        expect(operation.accountId).toContain(id);
        expect(operation.blockHeight).toBeGreaterThanOrEqual(0);
        expect(operation.fee.isGreaterThanOrEqualTo(0)).toBe(true);
        expect(operation.id).toContain(`js:2:${id}:${address}:`);
        expect(operation.type).toMatch(
          /IN|OUT|REWARD|DELEGATE|UNDELEGATE|CLAIMREWARD|SEND|MULTISEND|FAILURE/,
        );
        expect(operation.value.isGreaterThanOrEqualTo(0)).toBe(true);
        expect(operation.transactionSequenceNumber).toBeDefined();

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
    expect(result.xpub).toEqual(address);
  });
});

describe("Testing CosmosHub opperation", () => {
  let operations: Operation[];

  beforeAll(async () => {
    jest.spyOn(cryptoFactoryModule, "default").mockReturnValue({
      lcd: "https://cosmoshub4.coin.ledger.com",
      stakingDocUrl: "",
      unbondingPeriod: 0,
      ledgerValidator: undefined,
      validatorPrefix: "",
      prefix: "",
      defaultPubKeyType: "",
      defaultGas: 0,
      minGasPrice: 0,
      version: "v1beta1",
    });
    const result = await getAccountShape(
      {
        address: testAccounts[0].address,
        currency: {
          id: testAccounts[0].id,
          units: [{}, { code: testAccounts[0].unit }],
        } as CryptoCurrency,
        index: 0,
        derivationMode: "",
      } as AccountShapeInfo<CosmosAccount>,
      {} as SyncConfig,
    );
    if (result.operations) {
      operations = result.operations;
    }
  }, 30000);

  it("should fetch operations successfully", async () => {
    expect(Array.isArray(operations)).toBeDefined();
  });

  it("IN", () => {
    // https://www.mintscan.io/cosmos/tx/E41F77C766C9403D5CA1975AC5F97AA969D860C2CFE691603023FD2EF16AC715
    const txHash = "E41F77C766C9403D5CA1975AC5F97AA969D860C2CFE691603023FD2EF16AC715";
    const operation = operations.find(op => op.hash === txHash);
    expect(operation).toBeDefined();
    expect(operation!.fee.isEqualTo(BigNumber(2000))).toBe(true);
    expect(operation!.accountId).toContain(
      "js:2:cosmos:cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq:",
    );
    expect(operation!.hasFailed).toBe(false);
    expect(operation?.senders).toContain("cosmos15xnxjw7cumpmtfnk9mgrelh7xnc32wv6h38rz9");
    expect(operation?.value.isEqualTo(BigNumber(2000000))).toBe(true);
  });

  it("REWARD", () => {
    // https://www.mintscan.io/cosmos/tx/5C01CCC7EF8FF6540FE5F3D652EB3D618F1E8C60E775EFC43884C2946CDCBE1C
    const txHash = "5C01CCC7EF8FF6540FE5F3D652EB3D618F1E8C60E775EFC43884C2946CDCBE1C";
    const operation = operations.find(op => op.hash === txHash);
    expect(operation).toBeDefined();
    expect(operation!.fee.isEqualTo(BigNumber(3500))).toBe(true);
    expect(operation!.accountId).toContain(
      "js:2:cosmos:cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq:",
    );
    expect(operation!.hasFailed).toBe(false);
    expect(operation?.value.isEqualTo(BigNumber(169068502))).toBe(true);
  });

  it("DELEGATE", () => {
    // https://www.mintscan.io/cosmos/tx/54B9DA62586F76D761801AA7ADBE7E292882F08CAB4F0D5D24A91D54401C16DB
    const txHash = "54B9DA62586F76D761801AA7ADBE7E292882F08CAB4F0D5D24A91D54401C16DB";
    const operation = operations.find(op => op.hash === txHash);
    expect(operation).toBeDefined();
    expect(operation!.fee.isEqualTo(BigNumber(6250))).toBe(true);
    expect(operation!.accountId).toContain(
      "js:2:cosmos:cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq:",
    );
    expect(operation!.hasFailed).toBe(false);
    expect(Array.isArray(operation?.extra)).toBeDefined();
    if (operation && Array.isArray(operation.extra)) {
      expect(operation.extra.length).toEqual(1);
      expect(operation.extra[0].validators[0].amount.isEqualTo(BigNumber(10100000000))).toBe(true);
      expect(operation.extra[0].validators[0].address).toContain(
        "cosmosvaloper1ey69r37gfxvxg62sh4r0ktpuc46pzjrm873ae8",
      );
    }
  });
});

describe("Testing Injective opperation", () => {
  let operations: Operation[];

  beforeAll(async () => {
    jest.spyOn(cryptoFactoryModule, "default").mockReturnValue({
      lcd: "https://injective-rest.publicnode.com",
      stakingDocUrl: "",
      unbondingPeriod: 0,
      ledgerValidator: undefined,
      validatorPrefix: "",
      prefix: "",
      defaultPubKeyType: "",
      defaultGas: 0,
      minGasPrice: 0,
      version: "v1beta1",
    });
    const result = await getAccountShape(
      {
        address: testAccounts[1].address,
        currency: {
          id: testAccounts[1].id,
          units: [{}, { code: testAccounts[1].unit }],
        } as CryptoCurrency,
        index: 0,
        derivationMode: "",
      } as AccountShapeInfo<CosmosAccount>,
      {} as SyncConfig,
    );
    if (result.operations) {
      operations = result.operations;
    }
  }, 30000);

  it("should fetch operations successfully", async () => {
    expect(Array.isArray(operations)).toBeDefined();
  });

  // We do not use a full archive node on Injective, so history is partial
  it.skip("IN", () => {
    // https://www.mintscan.io/injective/tx/112C82608F1D08D8AF60323BBEDBCD21066B9E1406B57BD2FC11904BD1FA7FF7
    const txHash = "112C82608F1D08D8AF60323BBEDBCD21066B9E1406B57BD2FC11904BD1FA7FF7";
    const operation = operations.find(op => op.hash === txHash);
    expect(operation).toBeDefined();
    expect(operation?.recipients[0]).toMatch("inj1k6dn0f8mfgvtxfv0ja8ld6049xkjv3a3nyf2tl");
    expect(operation!.fee.isEqualTo(BigNumber(143370000000000))).toBe(true);
    expect(operation!.accountId).toContain("inj1vmzrwxhgllkjaswzawaue7m7f9qcrc0rfth2v2");
    expect(operation!.hasFailed).toBe(false);
    expect(operation?.value.isEqualTo(BigNumber(100000000000000000).plus(operation!.fee))).toBe(
      true,
    );
  });
});
