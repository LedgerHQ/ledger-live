import { faker } from "@faker-js/faker";
import { TypeRegistry } from "@polkadot/types";
import coinConfig from "../config";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { buildTransaction } from "./buildTransaction";

const registry = new TypeRegistry();

const mockExtrinsics = jest.fn();
const mockGetTransactionParams = jest.fn().mockResolvedValue({
  blockHash: "0xb10c4a54",
  genesisHash: "0x83835154a54",
  blockNumber: 12,
  specVersion: 42,
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
    metadataHash: () => "0x12345678",
  };
});

jest.mock("../config");
const mockGetConfig = jest.mocked(coinConfig.getCoinConfig);

describe("buildTransaction", () => {
  let spyRegistry: jest.SpyInstance | undefined;
  beforeAll(() => {
    mockGetConfig.mockImplementation((): any => {
      return {
        status: {
          type: "active",
        },
        sidecar: {
          url: "https://polkadot-sidecar.coin.ledger.com",
          credentials: "",
        },
        staking: {
          electionStatusThreshold: 25,
        },
        metadataShortener: {
          url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
        },
        metadataHash: {
          url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
        },
      };
    });
  });

  afterEach(() => {
    mockExtrinsics.mockClear();
    spyRegistry?.mockRestore();
  });

  it('returns send signed tx info: unsigned and registry when transaction has mode "send"', async () => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ mode: "send", recipient: "WHATEVER" });
    const mockCodec = jest.fn();
    spyRegistry = jest.spyOn(registry, "createType");
    spyRegistry.mockImplementation((type: string) => {
      mockCodec.mockReturnValueOnce({
        toHex: () => `HexCodec 4 ${type}`,
      });
      return new mockCodec();
    });
    const expectExtrinsicMethodHex = faker.string.hexadecimal({ length: 16 });
    const mockTransferKeepAlive = jest.fn().mockReturnValue({
      toHex: () => expectExtrinsicMethodHex,
    });
    (mockTransferKeepAlive as any).meta = {
      args: [{ name: "dest" }, { name: "value" }],
    };
    mockExtrinsics.mockReturnValue({
      balances: {
        transferKeepAlive: mockTransferKeepAlive,
      },
    });

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(spyRegistry).toHaveBeenCalledTimes(3);
    expect(spyRegistry).toHaveBeenCalledWith("ExtrinsicEra", {
      current: 12,
      period: 64,
    });
    expect(spyRegistry).toHaveBeenCalledWith("u32", 42);
    expect(spyRegistry).toHaveBeenCalledWith("u32", 22);
    expect(mockCodec).toHaveBeenCalledTimes(3);
    expect(mockExtrinsics).toHaveBeenCalledTimes(1);
    expect(mockTransferKeepAlive).toHaveBeenCalledTimes(1);
    expect(mockTransferKeepAlive.mock.calls[0][0]).toEqual("WHATEVER");
    expect(mockTransferKeepAlive.mock.calls[0][1]).toEqual(transaction.amount.toString());

    const expectedResult = {
      registry: registry,
      unsigned: {
        address: account.freshAddress,
        blockHash: "0xb10c4a54",
        genesisHash: "0x83835154a54",
        method: expectExtrinsicMethodHex,
        era: "HexCodec 4 ExtrinsicEra",
        nonce: expect.any(Number),
        mode: 1,
        metadataHash: new Uint8Array([1, 0, 18, 52, 86, 120]),
        specVersion: "HexCodec 4 u32",
        transactionVersion: "HexCodec 4 u32",
        version: 4,
      },
    };
    expect(result.unsigned).toEqual(expectedResult.unsigned);
  });

  it('returns an unsigned with all validators when transaction has mode "nominate"', async () => {
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

  it('returns an unsigned with first validator when transaction has mode "chill"', async () => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({
      mode: "chill",
    });
    const expectExtrinsicMethodHex = faker.string.hexadecimal({ length: 16 });
    const mockChill = jest.fn().mockReturnValue({
      toHex: () => expectExtrinsicMethodHex,
    });
    (mockChill as any).meta = {
      args: [],
    };
    mockExtrinsics.mockReturnValue({
      staking: {
        chill: mockChill,
      },
    });

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(mockChill).toHaveBeenCalledTimes(1);
    expect(mockChill.mock.lastCall[0]).toBeUndefined();
    expect(result.unsigned.method).toEqual(expectExtrinsicMethodHex);
  });

  it('returns an unsigned with first validator when transaction has mode "claimReward"', async () => {
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
