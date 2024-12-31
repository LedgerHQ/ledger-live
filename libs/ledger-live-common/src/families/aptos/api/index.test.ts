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

  describe("generateTransaction", () => {
    it("generates a transaction with the correct options", async () => {
      const payload: InputEntryFunctionData = {
        function: "0x1::coin::transfer",
        functionArguments: ["0x13", 1],
      };
      const options = {
        maxGasAmount: "100",
        gasUnitPrice: "50",
        sequenceNumber: "1",
        expirationTimestampSecs: "1735639799486",
      };

      const mockSimple = jest.fn().mockImplementation(async () => ({
        rawTransaction: null,
      }));

      mockedAptos.mockImplementation(() => {
        return {
          transaction: {
            build: {
              simple: mockSimple,
            },
          },
        };
      });

      const mockSimpleSpy = jest.spyOn({ simple: mockSimple }, "simple");

      const api = new AptosAPI("aptos");
      await api.generateTransaction(Account.APTOS_1.address, payload, options);

      const optionsArgs = mockSimpleSpy.mock.calls[0][0].options;

      expect(optionsArgs).toMatchObject({
        maxGasAmount: Number(options.maxGasAmount),
        gasUnitPrice: Number(options.gasUnitPrice),
        expireTimestamp: Number(options.expirationTimestampSecs),
        accountSequenceNumber: Number(options.sequenceNumber),
      });
    });

    it("generates a transaction with no expire timestamp option set", async () => {
      const payload: InputEntryFunctionData = {
        function: "0x1::coin::transfer",
        functionArguments: ["0x13", 1],
      };
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

      mockedAptos.mockImplementation(() => {
        return {
          transaction: {
            build: {
              simple: mockSimple,
            },
          },
          getLedgerInfo: mockGetLedgerInfo,
        };
      });

      const mockSimpleSpy = jest.spyOn({ simple: mockSimple }, "simple");

      const api = new AptosAPI("aptos");
      await api.generateTransaction(Account.APTOS_1.address, payload, options);

      const optionsArgs = mockSimpleSpy.mock.calls[0][0].options;

      expect(optionsArgs).toMatchObject({
        maxGasAmount: Number(options.maxGasAmount),
        gasUnitPrice: Number(options.gasUnitPrice),
        accountSequenceNumber: Number(options.sequenceNumber),
        expireTimestamp: 120,
      });
    });
  });
});
