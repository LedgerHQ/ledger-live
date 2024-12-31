import { Aptos, InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { AptosAPI } from ".";
import { Account } from "../../../e2e/enum/Account";

jest.mock("@aptos-labs/ts-sdk");
let mockedAptos;

describe("Aptos API", () => {
  beforeEach(() => {
    mockedAptos = jest.mocked(Aptos);
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
      mockedAptos.mockImplementation(() => {
        return {
          getAccountInfo: mockGetAccountInfo,
        };
      });

      const mockSimpleSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

      const api = new AptosAPI("aptos");
      await api.getAccount(Account.APTOS_1.address);

      expect(mockSimpleSpy).toHaveBeenCalledWith({
        accountAddress: Account.APTOS_1.address,
      });
    });
  });

  // describe("getAccountInfo", () => {
  //   it("calls getBalance, fetchTransactions and getHeight", async () => {
  //     mockedAptos.mockImplementation(() => ({
  //       view: jest.fn().mockReturnValue(["123"]),
  //       getTransactionByVersion: jest.fn().mockReturnValue({
  //         type: "user_transaction",
  //         version: "v1",
  //         hash: "82e93d80a60d0054261741990d072b02cdd3e614afb7573499d3d86b599388ec",
  //         state_change_hash: "82e93d80a60d0054261741990d072b02cdd3e614afb7573499d3d86b599388ec",
  //         event_root_hash: "82e93d80a60d0054261741990d072b02cdd3e614afb7573499d3d86b599388ec",
  //         state_checkpoint_hash: null,
  //         gas_used: "10",
  //         success: true,
  //         vm_status: "good",
  //         accumulator_root_hash: "82e93d80a60d0054261741990d072b02cdd3e614afb7573499d3d86b599388ec",
  //         // changes: Array<WriteSetChange>;
  //         // sender: string;
  //         // sequence_number: string;
  //         // max_gas_amount: string;
  //         // gas_unit_price: string;
  //         // expiration_timestamp_secs: string;
  //         // payload: TransactionPayloadResponse;
  //         // signature?: TransactionSignature;
  //         // events: Array<Event>;
  //         timestamp: "0",
  //       }),
  //       getBlockByVersion: jest.fn().mockReturnValue({
  //         block_height: "1",
  //         block_hash: "83ca6d000a92893befe216e3bbc268d9df623fb3d822c6e72f5111e95e15f942",
  //         // block_timestamp: "12398723492",
  //         // first_version: "1",
  //         // last_version: "1",
  //       }),
  //     }));

  //     jest.mock("@apollo/client");
  //     const mockedApolloClient = jest.mocked(ApolloClient);
  //     mockedApolloClient.mockImplementation(() => ({
  //       query: async () => ({
  //         data: {
  //           address_version_from_move_resources: [{ transaction_version: "v1" }],
  //         },
  //         loading: false,
  //         networkStatus: NetworkStatus.ready,
  //       }),
  //     }));

  //     const api = new AptosAPI("aptos");
  //     const accountInfo = await api.getAccountInfo(Account.APTOS_1.address, "0");

  //     expect(accountInfo.balance).toEqual(123);
  //   });
  // });

  describe("generateTransaction", () => {
    const payload: InputEntryFunctionData = {
      function: "0x1::coin::transfer",
      functionArguments: ["0x13", 1],
    };

    it("generates a transaction with the correct options", async () => {
      const options = {
        maxGasAmount: "100",
        gasUnitPrice: "50",
        sequenceNumber: "1",
        expirationTimestampSecs: "1735639799486",
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
      await api.generateTransaction(Account.APTOS_1.address, payload, options);

      expect(mockSimpleSpy).toHaveBeenCalledWith({
        data: payload,
        options: {
          maxGasAmount: Number(options.maxGasAmount),
          gasUnitPrice: Number(options.gasUnitPrice),
          accountSequenceNumber: Number(options.sequenceNumber),
          expireTimestamp: Number(options.expirationTimestampSecs),
        },
        sender: Account.APTOS_1.address,
      });
    });

    it("generates a transaction with no expire timestamp option set", async () => {
      const options = {
        maxGasAmount: "100",
        gasUnitPrice: "50",
        sequenceNumber: "1",
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
      await api.generateTransaction(Account.APTOS_1.address, payload, options);

      expect(mockSimpleSpy).toHaveBeenCalledWith({
        data: payload,
        options: {
          maxGasAmount: Number(options.maxGasAmount),
          gasUnitPrice: Number(options.gasUnitPrice),
          accountSequenceNumber: Number(options.sequenceNumber),
          expireTimestamp: 120,
        },
        sender: Account.APTOS_1.address,
      });
    });

    it("throws an error when failing to build a transaction", async () => {
      const options = {
        maxGasAmount: "100",
        gasUnitPrice: "50",
        sequenceNumber: "1",
        expirationTimestampSecs: "1735639799486",
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
        async () => await api.generateTransaction(Account.APTOS_1.address, payload, options),
      ).rejects.toThrow();
    });
  });
});
