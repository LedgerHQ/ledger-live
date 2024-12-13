import { ApolloClient } from "@apollo/client";
import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { AptosAPI } from ".";

jest.mock("@aptos-labs/ts-sdk");
jest.mock("@apollo/client");
const mockedAptos = jest.mocked(Aptos);
const mockedAptosConfig = jest.mocked(AptosConfig);
const mockedApolloClient = jest.mocked(ApolloClient);

describe("Aptos API", () => {
  let api: AptosAPI;
  const currencyId = "aptos";

  beforeAll(() => {
    api = new AptosAPI(currencyId);
  });

  it("builds the client properly", () => {
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

    expect(mockedAptos).toHaveBeenCalledTimes(1);
    expect(mockedAptosConfig).toHaveBeenCalledTimes(1);
    expect(mockedApolloClient).toHaveBeenCalledTimes(1);
  });

  // it("fetches the account information", () => {
  //   let spy = jest.spyOn(api, 'sayMyName').mockImplementation(() => 'Hello');
  // });
});
