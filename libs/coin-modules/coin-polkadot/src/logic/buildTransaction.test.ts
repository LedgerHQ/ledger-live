import { TypeRegistry } from "@polkadot/types";
import { buildTransaction } from "./buildTransaction";
import { createFixtureAccount, createFixtureTransaction } from "../types/model.fixture";
import { faker } from "@faker-js/faker";

const registry = new TypeRegistry();

const mockExtrinsics = jest.fn();
const mockGetTransactionParams = jest.fn().mockResolvedValue({
  blockHash: "0xb10c4a54",
  genesisHash: "0x83835154a54",
  blockNumber: 12,
  specVersion: 42,
  tip: 8,
  transactionVersion: 22,
});

jest.mock("../network", () => {
  return {
    getRegistry: () =>
      Promise.resolve({
        registry: registry,
        extrinsics: mockExtrinsics(),
      }),
    getTransactionParams: () => mockGetTransactionParams(),
  };
});

describe("buildTransaction", () => {
  afterEach(() => {
    mockExtrinsics.mockClear();
  });

  it("returns unsigned and registry", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ mode: "send" });
    const mockCodec = jest.fn();
    const spyRegistry = jest.spyOn(registry, "createType");
    spyRegistry.mockImplementation((type: string) => {
      mockCodec.mockReturnValueOnce({
        toHex: () => `HexCodec 4 ${type}`,
      });
      return new mockCodec();
    });
    const expectExtrinsicMethodHex = faker.string.hexadecimal({ length: 16 });
    const transferKeepAlive = () => ({
      toHex: () => expectExtrinsicMethodHex,
    });
    transferKeepAlive.meta = {
      args: [],
    };
    mockExtrinsics.mockReturnValue({
      balances: {
        transferKeepAlive,
      },
    });

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(spyRegistry).toHaveBeenCalledTimes(6);
    expect(spyRegistry).toHaveBeenCalledWith("BlockNumber", 12);
    expect(spyRegistry).toHaveBeenCalledWith("ExtrinsicEra", {
      current: 12,
      period: 64,
    });
    expect(spyRegistry).toHaveBeenCalledWith("u32", 42);
    expect(spyRegistry).toHaveBeenCalledWith("Compact<Balance>", 8);
    expect(spyRegistry).toHaveBeenCalledWith("u32", 22);
    expect(mockCodec).toHaveBeenCalledTimes(6);
    expect(mockExtrinsics).toHaveBeenCalledTimes(1);
    const expectedResult = {
      registry: registry,
      unsigned: {
        address: account.freshAddress,
        blockHash: "0xb10c4a54",
        genesisHash: "0x83835154a54",
        method: expectExtrinsicMethodHex,
        signedExtensions: [
          "CheckVersion",
          "CheckGenesis",
          "CheckEra",
          "CheckNonce",
          "CheckWeight",
          "ChargeTransactionPayment",
          "CheckBlockGasLimit",
        ],
        blockNumber: "HexCodec 4 BlockNumber",
        era: "HexCodec 4 ExtrinsicEra",
        nonce: "HexCodec 4 Compact<Index>",
        specVersion: "HexCodec 4 u32",
        tip: "HexCodec 4 Compact<Balance>",
        transactionVersion: "HexCodec 4 u32",
        version: 4,
      },
    };
    expect(result).toEqual(expectedResult);
  });

  it("returns an unsigned with all validators when transaction has mode nominate", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({
      mode: "nominate",
      validators: ["validator name", "2nd validator name"],
    });
    const expectExtrinsicMethodHex = faker.string.hexadecimal({ length: 16 });
    const mockNominate = jest.fn().mockReturnValue({
      toHex: () => expectExtrinsicMethodHex,
    });
    (mockNominate as any).meta = {
      args: [{ name: "targets" }],
    };
    mockExtrinsics.mockReturnValue({
      staking: {
        nominate: mockNominate,
      },
    });

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(mockNominate).toHaveBeenCalledTimes(1);
    expect(mockNominate.mock.lastCall[0]).toEqual(["validator name", "2nd validator name"]);
    expect(result.unsigned.method).toEqual(expectExtrinsicMethodHex);
  });

  it("returns an unsigned with first validator when transaction has mode claimReward", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({
      mode: "claimReward",
      validators: ["validator name", "2nd validator name"],
      era: "era value",
    });
    const expectExtrinsicMethodHex = faker.string.hexadecimal({ length: 16 });
    const mockPayoutStakers = jest.fn().mockReturnValue({
      toHex: () => expectExtrinsicMethodHex,
    });
    (mockPayoutStakers as any).meta = {
      args: [{ name: "validatorStash" }, { name: "era" }],
    };
    mockExtrinsics.mockReturnValue({
      staking: {
        payoutStakers: mockPayoutStakers,
      },
    });

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(mockPayoutStakers).toHaveBeenCalledTimes(1);
    expect(mockPayoutStakers.mock.lastCall[0]).toEqual("validator name");
    expect(mockPayoutStakers.mock.lastCall[1]).toEqual("era value");
    expect(result.unsigned.method).toEqual(expectExtrinsicMethodHex);
  });
});
