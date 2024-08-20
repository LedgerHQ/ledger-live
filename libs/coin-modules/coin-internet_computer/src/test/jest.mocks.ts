import {
  SAMPLE_ACCOUNT_ID,
  SAMPLE_PUBLIC_KEY,
  SAMPLE_ICP_ADDRESS,
  SAMPLE_BALANCE,
  SAMPLE_BLOCK_HEIGHT,
  createMockAgentResponse,
  SAMPLE_GET_ACCOUNT_TRANSACTIONS_RESPONSE,
  SAMPLE_BALANCE_RESPONSE,
  SAMPLE_QUERY_BLOCKS_RESPONSE,
} from "./__fixtures__";
import BigNumber from "bignumber.js";
import { ListNeuronsResponse, ManageNeuronResponse } from "@zondax/ledger-live-icp";

// Define types for mock implementations
interface MockAPI {
  fetchBalance: jest.MockedFunction<() => Promise<BigNumber>>;
  fetchBlockHeight: jest.MockedFunction<() => Promise<BigNumber>>;
  fetchTxns: jest.MockedFunction<() => Promise<unknown[]>>;
  broadcastTxn: jest.MockedFunction<() => Promise<void>>;
}

interface MockFramework {
  encodeAccountId: jest.MockedFunction<() => string>;
  decodeAccountId: jest.MockedFunction<() => { xpubOrAddress: string }>;
  encodeOperationId: jest.MockedFunction<(accountId: string, hash: string, type: string) => string>;
}

interface MockUtils {
  fromNullable: jest.MockedFunction<(value: unknown) => unknown>;
  deriveAddressFromPubkey: jest.MockedFunction<() => string>;
  derivePrincipalFromPubkey: jest.MockedFunction<() => string>;
  hashTransaction: jest.MockedFunction<() => string>;
  normalizeEpochTimestamp: jest.MockedFunction<(timestamp: string) => number>;
}

interface MockNeurons {
  NeuronsData: {
    deserialize: jest.MockedFunction<() => { fullNeurons: unknown[]; neuronInfos: unknown[] }>;
    empty: jest.MockedFunction<() => { fullNeurons: unknown[] }>;
  };
}

interface AgentQueryOptions {
  methodName: string;
  [key: string]: unknown;
}

interface ZondaxIcpMocks {
  decodeCanisterIdlFunc: jest.MockedFunction<
    (func: unknown, data: unknown) => [ListNeuronsResponse] | [ManageNeuronResponse] | unknown[]
  >;
  Cbor: {
    encode: jest.MockedFunction<(data: unknown) => Buffer>;
  };
  GovernanceCanister: {
    create: jest.MockedFunction<
      (options: { agent: unknown }) => {
        claimOrRefreshNeuronFromAccount: jest.MockedFunction<() => Promise<bigint>>;
        claimOrRefreshNeuron: jest.MockedFunction<() => Promise<void>>;
      }
    >;
  };
}

interface AgentMocks {
  pollForReadState: jest.MockedFunction<() => Promise<ArrayBuffer>>;
}

interface MockBridgeHelpers {
  addresses: {
    getAddress: jest.MockedFunction<
      () => {
        derivationPath: string;
        address: string;
      }
    >;
  };
  buildOptimisticOperation: {
    buildOptimisticSendOperation: jest.MockedFunction<any>;
  };
}

// Store mock implementations for access in tests
let apiMocks: MockAPI = {} as MockAPI;
let frameworkMocks: MockFramework = {} as MockFramework;
let utilsMocks: MockUtils = {} as MockUtils;
let neuronsMocks: MockNeurons = {} as MockNeurons;
let zondaxIcpMocks: ZondaxIcpMocks = {} as ZondaxIcpMocks;
let agentMocks: AgentMocks = {} as AgentMocks;
let bridgeHelpersMocks: MockBridgeHelpers = {} as MockBridgeHelpers;

export const setup = () => {
  let currentMethodName = "";
  const claimOrRefreshNeuronFromAccountMock = jest.fn();
  const claimOrRefreshNeuronMock = jest.fn();
  const governanceCanisterCreateMock = jest.fn().mockReturnValue({
    claimOrRefreshNeuronFromAccount: claimOrRefreshNeuronFromAccountMock,
    claimOrRefreshNeuron: claimOrRefreshNeuronMock,
  });

  agentMocks = {
    pollForReadState: jest.fn(),
  };

  zondaxIcpMocks = {
    decodeCanisterIdlFunc: jest.fn(),
    Cbor: {
      encode: jest.fn(),
    },
    GovernanceCanister: {
      create: governanceCanisterCreateMock,
    },
  };

  // Mock the agent module
  jest.mock("@zondax/ledger-live-icp/agent", () => ({
    ...jest.requireActual("@zondax/ledger-live-icp/agent"),
    Cbor: {
      encode: jest.fn().mockImplementation(data => Buffer.from(JSON.stringify(data))),
    },
    Expiry: class Expiry {
      constructor(_t: any) {
        // no-op
      }
    },
    SubmitRequestType: {
      Call: "call",
    },
    getAgent: jest.fn().mockResolvedValue({
      query: jest
        .fn()
        .mockImplementation((_canisterId: string, { methodName }: AgentQueryOptions) => {
          currentMethodName = methodName;
          if (methodName === "query_blocks") {
            return createMockAgentResponse(SAMPLE_QUERY_BLOCKS_RESPONSE);
          }
          if (methodName === "get_account_identifier_balance") {
            return createMockAgentResponse(SAMPLE_BALANCE_RESPONSE);
          }
          if (methodName === "get_account_identifier_transactions") {
            return createMockAgentResponse(SAMPLE_GET_ACCOUNT_TRANSACTIONS_RESPONSE);
          }
          return createMockAgentResponse({});
        }),
      status: jest.fn().mockResolvedValue({
        ok: true,
        result: "success",
      }),
    }),
    pollForReadState: agentMocks.pollForReadState,
  }));

  const decodeCanisterIdlFuncMock = jest.fn((_func: unknown, _data: unknown) => {
    if (currentMethodName === "query_blocks") {
      return [SAMPLE_QUERY_BLOCKS_RESPONSE];
    }
    if (currentMethodName === "get_account_identifier_balance") {
      return [SAMPLE_BALANCE_RESPONSE];
    }
    if (currentMethodName === "get_account_identifier_transactions") {
      return [SAMPLE_GET_ACCOUNT_TRANSACTIONS_RESPONSE];
    }
    // Default return
    return [SAMPLE_QUERY_BLOCKS_RESPONSE];
  });
  zondaxIcpMocks.decodeCanisterIdlFunc = decodeCanisterIdlFuncMock;

  jest.mock("@zondax/ledger-live-icp", () => ({
    ledgerIdlFactory: jest.fn(),
    indexIdlFactory: jest.fn(),
    governanceIdlFactory: jest.fn(),
    getCanisterIdlFunc: jest.fn().mockReturnValue({
      name: "mock_function",
      type: "query",
    }),
    Principal: {
      fromText: jest.fn().mockImplementation((text: string) => ({
        toText: () => text,
        toString: () => text,
      })),
    },
    encodeCanisterIdlFunc: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
    decodeCanisterIdlFunc: decodeCanisterIdlFuncMock,
    GovernanceCanister: zondaxIcpMocks.GovernanceCanister,
    GetAccountIdentifierTransactionsResponse: {},
    TransactionWithId: {},
  }));

  // Create and store API mocks
  apiMocks = {
    fetchBalance: jest.fn().mockResolvedValue(new BigNumber(SAMPLE_BALANCE.toString())),
    fetchBlockHeight: jest.fn().mockResolvedValue(new BigNumber(SAMPLE_BLOCK_HEIGHT.toString())),
    fetchTxns: jest.fn().mockResolvedValue([]),
    broadcastTxn: jest.fn().mockResolvedValue(undefined),
  };

  // Mock the API functions
  jest.mock("../api", () => apiMocks);

  // Create and store framework mocks
  frameworkMocks = {
    encodeAccountId: jest.fn().mockReturnValue(SAMPLE_ACCOUNT_ID),
    decodeAccountId: jest.fn().mockReturnValue({ xpubOrAddress: SAMPLE_PUBLIC_KEY }),
    encodeOperationId: jest
      .fn()
      .mockImplementation(
        (accountId: string, hash: string, type: string) => `${accountId}_${hash}_${type}`,
      ),
  };

  // Mock the framework functions
  jest.mock("@ledgerhq/coin-framework/account/index", () => ({
    encodeAccountId: frameworkMocks.encodeAccountId,
    decodeAccountId: frameworkMocks.decodeAccountId,
  }));

  jest.mock("@ledgerhq/coin-framework/operation", () => ({
    encodeOperationId: frameworkMocks.encodeOperationId,
  }));

  // Create and store utils mocks
  utilsMocks = {
    fromNullable: jest.fn().mockImplementation((value: unknown) => {
      // Return the value if it exists, otherwise undefined
      if (value === null || value === undefined) {
        return undefined;
      }
      // For arrays, return the first element (as expected by the API)
      if (Array.isArray(value) && value.length > 0) {
        return value[0];
      }
      // For our test cases, return the value as is
      return value;
    }),
    deriveAddressFromPubkey: jest.fn().mockReturnValue(SAMPLE_ICP_ADDRESS),
    derivePrincipalFromPubkey: jest.fn().mockReturnValue("mock_principal"),
    hashTransaction: jest.fn().mockReturnValue("mock_transaction_hash"),
    normalizeEpochTimestamp: jest
      .fn()
      .mockImplementation((timestamp: string) => parseInt(timestamp) / 1000000),
  };

  jest.mock("@zondax/ledger-live-icp/utils", () => {
    const originalModule = jest.requireActual("@zondax/ledger-live-icp/utils");
    return {
      ...originalModule,
      getTimeUntil: jest.fn().mockReturnValue({ days: 0, hours: 0, minutes: 0 }),
      fromNullable: utilsMocks.fromNullable,
      deriveAddressFromPubkey: utilsMocks.deriveAddressFromPubkey,
      derivePrincipalFromPubkey: utilsMocks.derivePrincipalFromPubkey,
      hashTransaction: utilsMocks.hashTransaction,
      createUnsignedSendTransaction: jest.fn(),
      createUnsignedListNeuronsTransaction: jest.fn(),
      createUnsignedNeuronCommandTransaction: jest.fn(),
      createReadStateRequest: jest.fn(),
      pubkeyToDer: jest.fn(),
      getSubAccountIdentifier: jest.fn(),
    };
  });

  const NeuronsDataMock = jest.fn().mockImplementation(() => ({
    fullNeurons: [],
    neuronInfos: [],
  }));
  (NeuronsDataMock as any).deserialize = jest
    .fn()
    .mockReturnValue({ fullNeurons: [], neuronInfos: [] });
  (NeuronsDataMock as any).empty = jest.fn().mockReturnValue({ fullNeurons: [] });

  // Create and store neurons mocks
  neuronsMocks = {
    NeuronsData: NeuronsDataMock as unknown as {
      deserialize: jest.MockedFunction<() => { fullNeurons: unknown[]; neuronInfos: unknown[] }>;
      empty: jest.MockedFunction<() => { fullNeurons: unknown[] }>;
    },
  };

  jest.mock(
    "@zondax/ledger-live-icp/neurons",
    () => ({
      votingPowerNeedsRefresh: jest.fn().mockReturnValue({
        needsRefresh: false,
        minDays: 0,
        minHours: 0,
        minMinutes: 0,
      }),
      NeuronsData: NeuronsDataMock,
      MAINNET_GOVERNANCE_CANISTER_ID: "rrkah-fqaaa-aaaaa-aaaaq-cai",
      MAINNET_LEDGER_CANISTER_ID: "ryjl3-tyaaa-aaaaa-aaaba-cai",
      MAINNET_INDEX_CANISTER_ID: "qhbym-qaaaa-aaaaa-aaafq-cai",
    }),
    { virtual: true },
  );

  jest.mock("../common-logic/utils", () => ({
    ...jest.requireActual("../common-logic/utils"),
    normalizeEpochTimestamp: utilsMocks.normalizeEpochTimestamp,
    getPath: (path: string) => path,
  }));

  // Mock global fetch
  global.fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    clone: () => ({
      status: 200,
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    }),
  });

  bridgeHelpersMocks = {
    addresses: {
      getAddress: jest.fn(),
    },
    buildOptimisticOperation: {
      buildOptimisticSendOperation: jest.fn(),
    },
  };

  jest.mock(
    "../bridge/bridgeHelpers/addresses",
    () => ({
      getAddress: bridgeHelpersMocks.addresses.getAddress,
    }),
    { virtual: true },
  );

  jest.mock(
    "../bridge/buildOptimisticOperation",
    () => ({
      buildOptimisticSendOperation:
        bridgeHelpersMocks.buildOptimisticOperation.buildOptimisticSendOperation,
    }),
    { virtual: true },
  );
};

// Export the mocked modules for use in tests
export const getMockedAPI = (): MockAPI => {
  return apiMocks;
};

export const getMockedFramework = (): MockFramework => {
  return frameworkMocks;
};

export const getMockedUtils = (): MockUtils => {
  return utilsMocks;
};

export const getMockedNeurons = (): MockNeurons => {
  return neuronsMocks;
};

export const getMockedZondaxIcp = (): ZondaxIcpMocks => {
  return zondaxIcpMocks;
};

export const getMockedAgent = (): AgentMocks => {
  return agentMocks;
};

export const getMockedBridgeHelpers = (): MockBridgeHelpers => {
  return bridgeHelpersMocks;
};
