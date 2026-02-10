import { ApolloClient } from "@apollo/client";
import { Aptos } from "@aptos-labs/ts-sdk";
import BigNumber from "bignumber.js";
import { getValidators } from "../../network/validators";

jest.mock("@aptos-labs/ts-sdk");
let mockedAptos: jest.Mocked<any>;

jest.mock("@apollo/client");
let mockedApolloClient: jest.Mocked<any>;

describe("getValidators", () => {
  beforeEach(() => {
    mockedAptos = jest.mocked(Aptos);
    mockedApolloClient = jest.mocked(ApolloClient);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const current_delegator_balances = [
    {
      __typename: "current_delegator_balances",
      current_pool_balance: {
        __typename: "current_delegated_staking_pool_balances",
        total_coins: 211045219713562,
        operator_commission_percentage: 900,
        staking_pool_address: "0x001232f58b963938486a11f88c1c36d61d82738b1828625a95a1e85b4c8d1282",
        total_shares: 200020456320587.72,
      },
      shares: 94692342176,
      delegator_address: "0xb1a1d4624c5163445c993d9db9cd5bd3fc6b2c5e85a14216c3781d04d4f92d08",
      staking_pool_metadata: {
        __typename: "current_staking_pool_voter",
        operator_aptos_name: [],
      },
    },
    {
      __typename: "current_delegator_balances",
      current_pool_balance: {
        __typename: "current_delegated_staking_pool_balances",
        total_coins: 116781362397133,
        operator_commission_percentage: 499,
        staking_pool_address: "0x05dece2ed08c68f8730527e9b3ebb3536efc3361f4ef37ba0b16a3310db836af",
        total_shares: 115552903623705.77,
      },
      shares: 15149284011,
      delegator_address: "0x4ee1f2b7a1069a09b7d9c800928bfe851bc7649a0fb4e0d918554e0d445db4bc",
      staking_pool_metadata: {
        __typename: "current_staking_pool_voter",
        operator_aptos_name: [
          {
            __typename: "current_aptos_names",
            domain_with_suffix: "cryptomolot.apt",
            is_active: true,
          },
        ],
      },
    },
  ];

  const expectedResponse = [
    {
      activeStake: BigNumber(211045219713562),
      address: "0x001232f58b963938486a11f88c1c36d61d82738b1828625a95a1e85b4c8d1282",
      commission: BigNumber(9),
      name: "0x001232f58b963938486a11f88c1c36d61d82738b1828625a95a1e85b4c8d1282",
      nextUnlockTime: "32d 5h 26m",
      shares: 200020456320587.72,
      wwwUrl:
        "https://explorer.aptoslabs.com/account/0x001232f58b963938486a11f88c1c36d61d82738b1828625a95a1e85b4c8d1282?network=mainnet",
    },
    {
      activeStake: BigNumber(116781362397133),
      address: "0x05dece2ed08c68f8730527e9b3ebb3536efc3361f4ef37ba0b16a3310db836af",
      commission: BigNumber(4.99),
      name: "cryptomolot.apt",
      nextUnlockTime: "32d 5h 26m",
      shares: 115552903623705.77,
      wwwUrl:
        "https://explorer.aptoslabs.com/account/0x05dece2ed08c68f8730527e9b3ebb3536efc3361f4ef37ba0b16a3310db836af?network=mainnet",
    },
  ];

  it("returns the correct information and caches the 2nd call", async () => {
    mockedAptos.mockImplementation(() => ({
      getAccountResource: async () => ({ locked_until_secs: "1750051574" }),
    }));

    const mockedGetValidatorsQuery = jest.fn().mockImplementation(async () => ({
      data: {
        current_delegator_balances,
      },
    }));
    mockedApolloClient.mockImplementation(() => ({
      query: mockedGetValidatorsQuery,
    }));

    jest.useFakeTimers().setSystemTime(new Date("2025-05-15"));

    const validators1 = await getValidators("aptos");
    const validators2 = await getValidators("aptos");

    expect(validators1).toMatchObject(expectedResponse);
    expect(validators1).toMatchObject(validators2);
    expect(mockedGetValidatorsQuery.mock.calls.length).toBe(1);
  });
});
