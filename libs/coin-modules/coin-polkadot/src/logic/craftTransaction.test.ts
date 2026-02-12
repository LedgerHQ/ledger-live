import { faker } from "@faker-js/faker";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { TypeRegistry } from "@polkadot/types";
import { createFixtureAccount } from "../types/bridge.fixture";
import { craftTransaction, defaultExtrinsicArg } from "./craftTransaction";

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
    getTransactionParams: (currency?: CryptoCurrency, { force } = { force: false }) =>
      mockGetTransactionParams(currency, force),
    metadataHash: () => "0x12345678",
  };
});

describe("craftTransaction", () => {
  let spyRegistry: jest.SpyInstance | undefined;

  afterEach(() => {
    mockExtrinsics.mockClear();
    spyRegistry?.mockRestore();
    mockGetTransactionParams.mockClear();
  });

  it('returns send signed tx info (unsigned and registry) when transaction has mode "send"', async () => {
    // GIVEN
    const { freshAddress: address } = createFixtureAccount();
    const recipient = "WHATEVER";
    const amount = BigInt(0);
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
    const result = (await craftTransaction(address, 0, defaultExtrinsicArg(amount, recipient)))
      .unsigned;

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
    expect(mockTransferKeepAlive.mock.lastCall[0]).toEqual(recipient);
    expect(mockTransferKeepAlive.mock.lastCall[1]).toEqual(amount.toString());

    expect(mockGetTransactionParams).toHaveBeenCalledTimes(1);
    expect(mockGetTransactionParams.mock.lastCall[0]).toEqual(undefined);
    expect(mockGetTransactionParams.mock.lastCall[1]).toEqual(false);

    const expectedResult = {
      address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
      blockHash: "0xb10c4a54",
      era: "HexCodec 4 ExtrinsicEra",
      genesisHash: "0x83835154a54",
      method: expectExtrinsicMethodHex,
      nonce: 0,
      transactionVersion: "HexCodec 4 u32",
      specVersion: "HexCodec 4 u32",
      version: 4,
      metadataHash: new Uint8Array([1, 0, 18, 52, 86, 120]),
      mode: 1,
    };
    expect(result).toEqual(expectedResult);
  });

  it('returns send signed tx info (unsigned and registry) when transaction has mode "send" with useAllAmount', async () => {
    // GIVEN
    const { freshAddress: address } = createFixtureAccount();
    const recipient = "WHATEVER";
    const amount = BigInt(0);
    const expectExtrinsicMethodHex = faker.string.hexadecimal({ length: 16 });
    const mockTransferAllowDeath = jest.fn().mockReturnValue({
      toHex: () => expectExtrinsicMethodHex,
    });
    (mockTransferAllowDeath as any).meta = {
      args: [{ name: "dest" }, { name: "value" }],
    };
    mockExtrinsics.mockReturnValue({
      balances: {
        transferAllowDeath: mockTransferAllowDeath,
      },
    });

    // WHEN
    const extrinsicArg = defaultExtrinsicArg(amount, recipient);
    extrinsicArg.useAllAmount = true;
    const result = await craftTransaction(address, 0, extrinsicArg);

    // THEN
    expect(mockTransferAllowDeath).toHaveBeenCalledTimes(1);
    expect(mockTransferAllowDeath.mock.lastCall[0]).toEqual(recipient);
    expect(mockTransferAllowDeath.mock.lastCall[1]).toEqual(amount.toString());
    expect(result.unsigned.method).toEqual(expectExtrinsicMethodHex);

    expect(mockGetTransactionParams).toHaveBeenCalledTimes(1);
    expect(mockGetTransactionParams.mock.lastCall[0]).toEqual(undefined);
    expect(mockGetTransactionParams.mock.lastCall[1]).toEqual(false);
  });

  it.each([
    { txNumSlashingSpans: 12, extrinsicNumSlashingSpans: 12 },
    { txNumSlashingSpans: undefined, extrinsicNumSlashingSpans: 0 },
  ])(
    'returns an unsigned with first validator when transaction has mode "withdrawUnbonded" and numSplashingSpans $txNumSlashingSpans',
    async ({ txNumSlashingSpans, extrinsicNumSlashingSpans }) => {
      // GIVEN
      const { freshAddress: address } = createFixtureAccount();
      const recipient = "WHATEVER";
      const amount = BigInt(0);
      const expectExtrinsicMethodHex = faker.string.hexadecimal({ length: 16 });
      const mockWithdrawUnbonded = jest.fn().mockReturnValue({
        toHex: () => expectExtrinsicMethodHex,
      });
      (mockWithdrawUnbonded as any).meta = {
        args: [{ name: "numSlashingSpans" }],
      };
      mockExtrinsics.mockReturnValue({
        staking: {
          withdrawUnbonded: mockWithdrawUnbonded,
        },
      });

      // WHEN
      const extrinsicArg = defaultExtrinsicArg(amount, recipient);
      extrinsicArg.mode = "withdrawUnbonded";
      extrinsicArg.numSlashingSpans = txNumSlashingSpans;
      const result = await craftTransaction(address, 0, extrinsicArg);

      // THEN
      expect(mockWithdrawUnbonded).toHaveBeenCalledTimes(1);
      expect(mockWithdrawUnbonded.mock.lastCall[0]).toEqual(extrinsicNumSlashingSpans);
      expect(result.unsigned.method).toEqual(expectExtrinsicMethodHex);

      expect(mockGetTransactionParams).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionParams.mock.lastCall[0]).toEqual(undefined);
      expect(mockGetTransactionParams.mock.lastCall[1]).toEqual(false);
    },
  );

  it('returns an unsigned with first validator when transaction has mode "setController"', async () => {
    // GIVEN
    const { freshAddress: address } = createFixtureAccount();
    const recipient = "WHATEVER";
    const amount = BigInt(0);
    const expectExtrinsicMethodHex = faker.string.hexadecimal({ length: 16 });
    const mockSetController = jest.fn().mockReturnValue({
      toHex: () => expectExtrinsicMethodHex,
    });
    (mockSetController as any).meta = {
      args: [],
    };
    mockExtrinsics.mockReturnValue({
      staking: {
        setController: mockSetController,
      },
    });

    // WHEN
    const extrinsicArg = defaultExtrinsicArg(amount, recipient);
    extrinsicArg.mode = "setController";
    const result = await craftTransaction(address, 0, extrinsicArg);

    // THEN
    expect(mockSetController).toHaveBeenCalledTimes(1);
    expect(mockSetController.mock.lastCall[0]).toBeUndefined();
    expect(result.unsigned.method).toEqual(expectExtrinsicMethodHex);

    expect(mockGetTransactionParams).toHaveBeenCalledTimes(1);
    expect(mockGetTransactionParams.mock.lastCall[0]).toEqual(undefined);
    expect(mockGetTransactionParams.mock.lastCall[1]).toEqual(false);
  });

  it('returns an unsigned with first validator when transaction has mode "chill"', async () => {
    // GIVEN
    const { freshAddress: address } = createFixtureAccount();
    const recipient = "WHATEVER";
    const amount = BigInt(0);
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
    const extrinsicArg = defaultExtrinsicArg(amount, recipient);
    extrinsicArg.mode = "chill";
    const result = await craftTransaction(address, 0, extrinsicArg);

    // THEN
    expect(mockChill).toHaveBeenCalledTimes(1);
    expect(mockChill.mock.lastCall[0]).toBeUndefined();
    expect(result.unsigned.method).toEqual(expectExtrinsicMethodHex);

    expect(mockGetTransactionParams).toHaveBeenCalledTimes(1);
    expect(mockGetTransactionParams.mock.lastCall[0]).toEqual(undefined);
    expect(mockGetTransactionParams.mock.lastCall[1]).toEqual(false);
  });
});
