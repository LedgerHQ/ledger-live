import { ApolloClient } from "@apollo/client";
import {
  AccountAddress,
  Aptos,
  ChainId,
  Ed25519PublicKey,
  Hex,
  InputEntryFunctionData,
  RawTransaction,
  Serializable,
  postAptosFullNode,
} from "@aptos-labs/ts-sdk";
import network from "@ledgerhq/live-network";
import BigNumber from "bignumber.js";
import { AptosAPI } from "../../network";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("@aptos-labs/ts-sdk", () => {
  const originalModule = jest.requireActual("@aptos-labs/ts-sdk");
  const partialMockedModule = Object.keys(originalModule).reduce(
    (pre: { [key: string]: jest.Mock }, methodName) => {
      pre[methodName] = jest.fn();
      return pre;
    },
    {} as { [key: string]: jest.Mock },
  );
  return {
    ...partialMockedModule,
    // mock all except these
    Hex: originalModule.Hex,
    MimeType: originalModule.MimeType,
  };
});
jest.mock("@apollo/client");
let mockedAptos: jest.Mocked<any>;
let mockedApolloClient: jest.Mocked<any>;
let mockedPost = jest.fn();

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);

describe("Aptos API", () => {
  beforeEach(() => {
    mockedAptos = jest.mocked(Aptos);
    mockedApolloClient = jest.mocked(ApolloClient);
    mockedPost = jest.mocked(postAptosFullNode);
  });

  afterEach(() => jest.clearAllMocks());

  it("builds the client properly for mainnet", () => {
    const api = new AptosAPI("aptos");

    expect(api.broadcast).toBeDefined();
    expect(typeof api.broadcast).toBe("function");
    expect(api.estimateGasPrice).toBeDefined();
    expect(typeof api.estimateGasPrice).toBe("function");
    expect(api.generateTransaction).toBeDefined();
    expect(typeof api.generateTransaction).toBe("function");
    expect(api.getAccount).toBeDefined();
    expect(typeof api.getAccount).toBe("function");
    expect(api.getAccountInfo).toBeDefined();
    expect(typeof api.getAccountInfo).toBe("function");
    expect(api.simulateTransaction).toBeDefined();
    expect(typeof api.simulateTransaction).toBe("function");
  });

  it("builds the client properly for testnet", () => {
    const api = new AptosAPI("aptos_testnet");

    expect(api.broadcast).toBeDefined();
    expect(typeof api.broadcast).toBe("function");
    expect(api.estimateGasPrice).toBeDefined();
    expect(typeof api.estimateGasPrice).toBe("function");
    expect(api.generateTransaction).toBeDefined();
    expect(typeof api.generateTransaction).toBe("function");
    expect(api.getAccount).toBeDefined();
    expect(typeof api.getAccount).toBe("function");
    expect(api.getAccountInfo).toBeDefined();
    expect(typeof api.getAccountInfo).toBe("function");
    expect(api.simulateTransaction).toBeDefined();
    expect(typeof api.simulateTransaction).toBe("function");
  });

  describe("getAccount", () => {
    it("calls getAccountInfo", async () => {
      const mockGetAccountInfo = jest.fn();
      mockedAptos.mockImplementation(() => ({
        getAccountInfo: mockGetAccountInfo,
      }));

      const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

      const api = new AptosAPI("aptos");
      await api.getAccount("address");

      expect(mockGetAccountSpy).toHaveBeenCalledWith({
        accountAddress: "address",
      });
    });
  });

  describe("getBalance", () => {
    let token: TokenCurrency;

    beforeEach(() => {
      token = {
        type: "TokenCurrency",
        id: "aptos_token",
        name: "Aptos Token",
        ticker: "APT",
        units: [{ name: "APT", code: "APT", magnitude: 6 }],
        contractAddress: "APTOS_1_ADDRESS",
        tokenType: "fungible_asset",
        parentCurrency: {
          type: "CryptoCurrency",
          id: "aptos",
          name: "Aptos",
          ticker: "APT",
          units: [{ name: "APT", code: "APT", magnitude: 6 }],
          color: "#000000",
          family: "aptos",
          scheme: "aptos",
          explorerViews: [],
          managerAppName: "Aptos",
          coinType: 637,
        },
      };
    });

    it("get coin balance", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockReturnValue(["1234"]),
      }));

      token.tokenType = "coin";
      const api = new AptosAPI("aptos");
      const balance = await api.getBalance("address", token);

      expect(balance).toEqual(new BigNumber(1234));
    });

    it("get fungible assets balance", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockReturnValue(["12345"]),
      }));

      token.tokenType = "fungible_asset";

      const api = new AptosAPI("aptos");
      const balance = await api.getBalance("address", token);

      expect(balance).toEqual(new BigNumber(12345));
    });

    it("return 0 balace if could not retrieve proper balance of fungible assets", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockImplementation(() => {
          throw new Error("error");
        }),
      }));

      token.tokenType = "fungible_asset";

      const api = new AptosAPI("aptos");
      const balance = await api.getBalance("address", token);

      expect(balance).toEqual(new BigNumber(0));
    });
  });

  describe("getAccountInfo", () => {
    it("calls getCoinBalance, fetchTransactions and getHeight", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockReturnValue(["123"]),
        getTransactionByVersion: jest.fn().mockReturnValue({
          type: "user_transaction",
          version: "v1",
        }),
        getBlockByVersion: jest.fn().mockReturnValue({
          block_height: "1",
          block_hash: "83ca6d",
        }),
      }));

      mockedNetwork.mockResolvedValue(
        Promise.resolve({
          data: {
            account: {
              account_number: 1,
              sequence: 0,
              pub_key: { key: "k", "@type": "type" },
              base_account: {
                account_number: 2,
                sequence: 42,
                pub_key: { key: "k2", "@type": "type2" },
              },
            },
            block_height: "999",
          },
          status: 200,
          headers: {} as any,
          statusText: "",
          config: {
            headers: {} as any,
          },
        }),
      );

      mockedApolloClient.mockImplementation(() => ({
        query: async () => ({
          data: {
            account_transactions: [{ transaction_version: 1 }],
          },
          loading: false,
          networkStatus: 7,
        }),
      }));

      const api = new AptosAPI("aptos");
      const accountInfo = await api.getAccountInfo("APTOS_1_ADDRESS", "1");

      expect(accountInfo.balance).toEqual(new BigNumber(123));
      expect(accountInfo.transactions).toEqual([
        {
          type: "user_transaction",
          version: "v1",
          block: {
            height: 1,
            hash: "83ca6d",
          },
        },
      ]);
      expect(accountInfo.blockHeight).toEqual(999);
    });

    it("return balance = 0 if it fails to fetch balance", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockImplementation(() => {
          throw new Error("error");
        }),
        getTransactionByVersion: jest.fn().mockReturnValue({
          type: "user_transaction",
          version: "v1",
        }),
        getBlockByVersion: jest.fn().mockReturnValue({
          block_height: "1",
          block_hash: "83ca6d",
        }),
      }));

      mockedNetwork.mockResolvedValue(
        Promise.resolve({
          data: {
            account: {
              account_number: 1,
              sequence: 0,
              pub_key: { key: "k", "@type": "type" },
              base_account: {
                account_number: 2,
                sequence: 42,
                pub_key: { key: "k2", "@type": "type2" },
              },
            },
            block_height: "999",
          },
          status: 200,
          headers: {} as any,
          statusText: "",
          config: {
            headers: {} as any,
          },
        }),
      );

      mockedApolloClient.mockImplementation(() => ({
        query: async () => ({
          data: {
            account_transactions: [{ transaction_version: 1 }],
          },
          loading: false,
          networkStatus: 7,
        }),
      }));

      const api = new AptosAPI("aptos");
      const accountInfo = await api.getAccountInfo("APTOS_1_ADDRESS", "1");

      expect(accountInfo.balance).toEqual(new BigNumber(0));
      expect(accountInfo.transactions).toEqual([
        {
          type: "user_transaction",
          version: "v1",
          block: {
            height: 1,
            hash: "83ca6d",
          },
        },
      ]);
      expect(accountInfo.blockHeight).toEqual(999);
    });

    it("returns no transactions if it the address is empty", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockReturnValue(["123"]),
        getTransactionByVersion: jest.fn().mockReturnValue({
          type: "user_transaction",
          version: "v1",
        }),
        getBlockByVersion: jest.fn().mockReturnValue({
          block_height: "1",
          block_hash: "83ca6d",
        }),
      }));

      mockedNetwork.mockResolvedValue(
        Promise.resolve({
          data: {
            account: {
              account_number: 1,
              sequence: 0,
              pub_key: { key: "k", "@type": "type" },
              base_account: {
                account_number: 2,
                sequence: 42,
                pub_key: { key: "k2", "@type": "type2" },
              },
            },
            block_height: "999",
          },
          status: 200,
          headers: {} as any,
          statusText: "",
          config: {
            headers: {} as any,
          },
        }),
      );

      mockedApolloClient.mockImplementation(() => ({
        query: async () => ({
          data: {
            account_transactions: [{ transaction_version: 1 }],
          },
          loading: false,
          networkStatus: 7,
        }),
      }));

      const api = new AptosAPI("aptos");
      const accountInfo = await api.getAccountInfo("", "1");

      expect(accountInfo.balance).toEqual(new BigNumber(123));
      expect(accountInfo.transactions).toEqual([]);
      expect(accountInfo.blockHeight).toEqual(999);
    });

    it("returns a null transaction if it fails to getTransactionByVersion", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockReturnValue(["123"]),
        getTransactionByVersion: jest.fn().mockImplementation(() => {
          throw new Error("error");
        }),
        getBlockByVersion: jest.fn().mockReturnValue({
          block_height: "1",
          block_hash: "83ca6d",
        }),
      }));

      mockedNetwork.mockResolvedValue(
        Promise.resolve({
          data: {
            account: {
              account_number: 1,
              sequence: 0,
              pub_key: { key: "k", "@type": "type" },
              base_account: {
                account_number: 2,
                sequence: 42,
                pub_key: { key: "k2", "@type": "type2" },
              },
            },
            block_height: "999",
          },
          status: 200,
          headers: {} as any,
          statusText: "",
          config: {
            headers: {} as any,
          },
        }),
      );

      mockedApolloClient.mockImplementation(() => ({
        query: async () => ({
          data: {
            account_transactions: [{ transaction_version: 1 }],
          },
          loading: false,
          networkStatus: 7,
        }),
      }));

      const api = new AptosAPI("aptos");
      const accountInfo = await api.getAccountInfo("APTOS_1_ADDRESS", "1");

      expect(accountInfo.balance).toEqual(new BigNumber(123));
      expect(accountInfo.transactions).toEqual([null]);
      expect(accountInfo.blockHeight).toEqual(999);
    });
  });

  describe("estimateGasPrice", () => {
    it("estimates the gas price", async () => {
      const gasEstimation = { gas_estimate: 100 };
      mockedAptos.mockImplementation(() => ({
        getGasPriceEstimation: jest.fn().mockReturnValue(gasEstimation),
      }));

      const api = new AptosAPI("aptos");
      const gasPrice = await api.estimateGasPrice();

      expect(gasPrice.gas_estimate).toEqual(100);
    });
  });

  describe("generateTransaction", () => {
    const payload: InputEntryFunctionData = {
      function: "0x1::coin::transfer",
      functionArguments: ["0x13", 1],
    };

    it("generates a transaction without expireTimestamp", async () => {
      const options = {
        maxGasAmount: "100",
        gasUnitPrice: "50",
      };

      const mockSimple = jest.fn().mockImplementation(async () => ({
        rawTransaction: null,
      }));
      mockedAptos.mockImplementation(() => ({
        transaction: {
          build: {
            simple: mockSimple,
          },
        },
      }));

      const mockSimpleSpy = jest.spyOn({ simple: mockSimple }, "simple");

      const api = new AptosAPI("aptos");
      await api.generateTransaction("APTOS_1_ADDRESS", payload, options);

      expect(mockSimpleSpy).toHaveBeenCalledWith({
        data: payload,
        options: {
          maxGasAmount: Number(options.maxGasAmount),
          gasUnitPrice: Number(options.gasUnitPrice),
        },
        sender: "APTOS_1_ADDRESS",
      });
    });

    it("generates a transaction with default expireTimestamp", async () => {
      const options = {
        maxGasAmount: "100",
        gasUnitPrice: "50",
      };

      const mockSimple = jest.fn().mockImplementation(async () => ({
        rawTransaction: null,
      }));
      const mockGetLedgerInfo = jest.fn().mockImplementation(async () => ({
        ledger_timestamp: "0",
      }));
      mockedAptos.mockImplementation(() => ({
        transaction: {
          build: {
            simple: mockSimple,
          },
        },
        getLedgerInfo: mockGetLedgerInfo,
      }));

      const mockSimpleSpy = jest.spyOn({ simple: mockSimple }, "simple");

      const api = new AptosAPI("aptos");
      await api.generateTransaction("APTOS_1_ADDRESS", payload, options);

      expect(mockSimpleSpy).toHaveBeenCalledWith({
        data: payload,
        options: {
          maxGasAmount: Number(options.maxGasAmount),
          gasUnitPrice: Number(options.gasUnitPrice),
          expireTimestamp: 120,
        },
        sender: "APTOS_1_ADDRESS",
      });
    });

    it("throws an error when failing to build a transaction", async () => {
      const options = {
        maxGasAmount: "100",
        gasUnitPrice: "50",
      };

      const mockSimple = jest.fn().mockImplementation(async () => null);
      mockedAptos.mockImplementation(() => ({
        transaction: {
          build: {
            simple: mockSimple,
          },
        },
      }));

      const api = new AptosAPI("aptos");
      expect(
        async () => await api.generateTransaction("APTOS_1_ADDRESS", payload, options),
      ).rejects.toThrow();
    });
  });

  describe("simulateTransaction", () => {
    it("simulates a transaction with the correct options", async () => {
      const mockSimple = jest.fn().mockImplementation(async () => ({
        rawTransaction: null,
      }));
      mockedAptos.mockImplementation(() => ({
        transaction: {
          simulate: {
            simple: mockSimple,
          },
        },
      }));

      const mockSimpleSpy = jest.spyOn({ simple: mockSimple }, "simple");

      const api = new AptosAPI("aptos");
      const address = new Ed25519PublicKey("APTOS_1_ADDRESS");
      const tx = new RawTransaction(
        new AccountAddress(Uint8Array.from(Buffer.from("APTOS_2_ADDRESS"))),
        BigInt(1),
        "" as unknown as Serializable,
        BigInt(100),
        BigInt(50),
        BigInt(1),
        { chainId: 1 } as ChainId,
      );
      await api.simulateTransaction(address, tx);

      expect(mockSimpleSpy).toHaveBeenCalledWith({
        signerPublicKey: address,
        transaction: { rawTransaction: tx },
        options: {
          estimateGasUnitPrice: true,
          estimateMaxGasAmount: true,
          estimatePrioritizedGasUnitPrice: false,
        },
      });
    });
  });
  describe("broadcast", () => {
    it("broadcasts the transaction", async () => {
      mockedPost.mockImplementation(async () => ({ data: { hash: "ok" } }));
      const mockedPostSpy = jest.spyOn({ postAptosFullNode: mockedPost }, "postAptosFullNode");

      mockedAptos.mockImplementation(() => ({
        config: "config",
      }));

      const api = new AptosAPI("aptos");

      const signedTransaction =
        "0x6aee3f5731475b98ca82fe40498a6d7486c1ccb1c252a6b11e0a4b2b6b8b6e2a00000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e740e7472616e736665725f636f696e73010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220eb590233a1a5ebf083d6d37ff7e1ba2cc852311ba08d5e9c0ca5e341a8e991b9080a00000000000000400d0300000000006400000000000000c6191e6800000000b70020507808b24fba3d09c1b47d6b424d0e05edc57a8d341c26ffbd3852d66794a4a440e2f267756cad8345b72f162ad5ae2c28b7f847195c9a130104bbb2281ddddc310a751f8412a4364fc725e2bb8493b83f7d4cd4d277ce7a14b3714e8f6dc20e04";
      await api.broadcast(signedTransaction);

      expect(mockedPostSpy).toHaveBeenCalledWith({
        aptosConfig: "config",
        body: Hex.fromHexString(signedTransaction).toUint8Array(),
        path: "transactions",
        originMethod: "",
        contentType: "application/x.aptos.signed_transaction+bcs",
      });
    });
  });
});
