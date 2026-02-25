import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation, SyncConfig } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import cryptoFactory from "./chain/chain";
import { getAccountShape } from "./synchronisation";
import { CosmosAccount } from "./types";

// Mock the cryptoFactory module
jest.mock("./chain/chain", () => {
  const actual = jest.requireActual("./chain/chain");
  return {
    __esModule: true,
    default: jest.fn(actual.default),
  };
});

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
    (cryptoFactory as jest.Mock).mockReturnValue({
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
    } as any);
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

  afterEach(() => {
    (cryptoFactory as jest.Mock).mockClear();
  });

  function sumOf(amounts: BigNumber[]): BigNumber {
    return amounts.reduce((acc, curr) => acc.plus(curr), BigNumber(0));
  }

  it("should validate delegated balance for %s", async () => {
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

    expect(cosmosResources.withdrawAddress).toEqual(address);

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
        expect(operation.transactionSequenceNumber?.isGreaterThanOrEqualTo(0)).toBe(true);

        if (["REWARD", "DELEGATE", "UNDELEGATE", "CLAIMREWARD"].includes(operation.type)) {
          expect(operation.recipients).toHaveLength(0);
          expect(operation.senders).toHaveLength(0);

          const extra = operation.extra as { validators: { address: string; amount: BigNumber }[] };
          extra.validators.forEach(validator => {
            expect(validator.address).toMatch(/^cosmos/);
            expect(validator.amount.isGreaterThanOrEqualTo(0)).toBe(true);
          });
        }

        if (operation.type.toString() === "FAILURE") {
          expect(operation.hasFailed).toBe(true);
          expect(operation.recipients).toEqual(expect.any(Array));
          expect(operation.senders).toEqual(expect.any(Array));
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
    (cryptoFactory as jest.Mock).mockReturnValue({
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
    } as any);
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

  afterAll(() => {
    (cryptoFactory as jest.Mock).mockClear();
  });

  it("should fetch operations successfully", async () => {
    expect(operations).toBeInstanceOf(Array);
  });

  it("IN", () => {
    // https://www.mintscan.io/cosmos/tx/E41F77C766C9403D5CA1975AC5F97AA969D860C2CFE691603023FD2EF16AC715
    const txHash = "E41F77C766C9403D5CA1975AC5F97AA969D860C2CFE691603023FD2EF16AC715";
    const operation = operations.find(op => op.hash === txHash);
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
    expect(operation!.fee.isEqualTo(BigNumber(6250))).toBe(true);
    expect(operation!.accountId).toContain(
      "js:2:cosmos:cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq:",
    );
    expect(operation!.hasFailed).toBe(false);
    expect(operation?.extra).toEqual({ validators: expect.any(Array), memo: "" });
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
    (cryptoFactory as jest.Mock).mockReturnValue({
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
    } as any);
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

  afterAll(() => {
    (cryptoFactory as jest.Mock).mockClear();
  });

  it("should fetch operations successfully", async () => {
    expect(operations).toBeInstanceOf(Array);
  });

  // We do not use a full archive node on Injective, so history is partial
  it.skip("IN", () => {
    // https://www.mintscan.io/injective/tx/112C82608F1D08D8AF60323BBEDBCD21066B9E1406B57BD2FC11904BD1FA7FF7
    const txHash = "112C82608F1D08D8AF60323BBEDBCD21066B9E1406B57BD2FC11904BD1FA7FF7";
    const operation = operations.find(op => op.hash === txHash);
    expect(operation?.recipients[0]).toMatch("inj1k6dn0f8mfgvtxfv0ja8ld6049xkjv3a3nyf2tl");
    expect(operation!.fee.isEqualTo(BigNumber(143370000000000))).toBe(true);
    expect(operation!.accountId).toContain("inj1vmzrwxhgllkjaswzawaue7m7f9qcrc0rfth2v2");
    expect(operation!.hasFailed).toBe(false);
    expect(operation?.value.isEqualTo(BigNumber(100000000000000000).plus(operation!.fee))).toBe(
      true,
    );
  });
});
