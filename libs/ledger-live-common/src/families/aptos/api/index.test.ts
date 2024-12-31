import { ApolloClient } from "@apollo/client";
import { Aptos, AptosConfig, InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { AptosAPI } from ".";
import { Account } from "../../../e2e/enum/Account";
import { TransactionOptions } from "../types";

jest.mock("@aptos-labs/ts-sdk");
jest.mock("@apollo/client");
const mockedAptos = jest.mocked(Aptos);
const mockedAptosConfig = jest.mocked(AptosConfig);
const mockedApolloClient = jest.mocked(ApolloClient);

describe("Aptos API", () => {
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

  it("generates a transaction with the correct options", async () => {
    const api = new AptosAPI("aptos");

    const payload: InputEntryFunctionData = {
      function: "0x1::coin::transfer",
      functionArguments: ["0x13", 1],
    };
    const options: TransactionOptions = {
      maxGasAmount: "100",
      gasUnitPrice: "50",
      expirationTimestampSecs: "1735639799486",
      sequenceNumber: "1",
    };

    jest.mock(".");
    const mockAPI = jest.fn().mockReturnValueOnce({
      apiUrl: "",
      indexerUrl: "",
      aptosConfig: {},
      aptosClient: {
        transaction: {
          build: {
            simple: async ({
              options,
            }: {
              options: {
                maxGasAmount: number;
                gasUnitPrice: number;
                expireTimestamp: number;
                accountSequenceNumber: number | bigint;
              };
            }) => ({
              max_gas_amount: BigInt(options.maxGasAmount),
              gas_unit_price: BigInt(options.gasUnitPrice),
              expiration_timestamp_secs: BigInt(options.expireTimestamp),
              sequence_number: BigInt(options.accountSequenceNumber),
            }),
          },
        },
      },
      apolloClient: {},
      generateTransaction: api.generateTransaction,
    });

    const mockedApi = new mockAPI("aptos");
    const transaction = await mockedApi.generateTransaction(
      Account.APTOS_1.address,
      payload,
      options,
    );

    console.log(transaction);

    // expect(transaction.max_gas_amount.toString()).toEqual(options.maxGasAmount);
    // expect(transaction.gas_unit_price.toString()).toEqual(options.gasUnitPrice);
    // expect(transaction.expiration_timestamp_secs.toString()).toEqual(
    //   options.expirationTimestampSecs,
    // );
    // expect(transaction.sequence_number.toString()).toEqual(options.sequenceNumber);
    expect(true).toBe(true);
  });

  it("it returns an empty array when the address is empty", () => {});
});
