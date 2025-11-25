/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { ChainAPI, Config, getChainAPI, logged } from "@ledgerhq/coin-solana/network/index";
import { getEnv } from "@ledgerhq/live-env";
import { Functions } from "@ledgerhq/coin-solana/utils";
import { makeBridges } from "@ledgerhq/coin-solana/bridge/bridge";
import { PubKeyDisplayMode, SolanaSigner } from "@ledgerhq/coin-solana/signer";
import { Message, MessageV0 } from "@solana/web3.js";
import { flow, isArray, isEqual, isObject, isUndefined, mapValues, omitBy } from "lodash/fp";
import { getMockedMethods } from "./mock-data";
import { scanAccounts, sync } from "../../../bridge/mockHelpers";

function mockChainAPI(config: Config): ChainAPI {
  const mockedMethods = getMockedMethods();
  const api = new Proxy(
    { config },
    {
      get(_, propKey) {
        if (propKey in api) {
          return api[propKey];
        }
        if (propKey === "then") {
          return undefined;
        }
        const method: Functions<ChainAPI> = propKey.toString() as any;
        const mocks = mockedMethods.filter(mock => mock.method === method);
        if (mocks.length === 0) {
          throw new Error(`no mock found for api method: ${method}`);
        }
        return function (...rawArgs: unknown[]) {
          const args = preprocessArgs(method, rawArgs);
          const mock = mocks.find(({ params: mockArgs }) => isEqual(args)(mockArgs));
          if (mock === undefined) {
            const argsJson = JSON.stringify(args);
            throw new Error(`no mock found for api method ${method} with args ${argsJson}`);
          }
          return Promise.resolve(mock.answer);
        };
      },
    },
  );
  return api as ChainAPI;
}

function removeUndefineds(input: unknown): unknown {
  return isObject(input)
    ? isArray(input)
      ? input.map(removeUndefineds)
      : flow(omitBy(isUndefined), mapValues(removeUndefineds))(input)
    : input;
}

function preprocessArgs(method: keyof ChainAPI, args: unknown[]) {
  if (method === "getFeeForMessage") {
    // getFeeForMessage needs some args preprocessing
    if (args.length === 1 && (args[0] instanceof Message || args[0] instanceof MessageV0)) {
      return [Buffer.from(args[0].serialize()).toString("base64")];
    } else {
      throw new Error("unexpected getFeeForMessage function signature");
    }
  }
  if (method === "getSimulationComputeUnits") {
    // getSimulationComputeUnits needs args preprocessing
    // args[0] is instructions array, args[1] is payer PublicKey
    if (args.length === 2) {
      const instructions = args[0] as unknown[];
      const payer = args[1];

      // Serialize the payer PublicKey to string
      const serializedPayer = (payer as { toString?: () => string })?.toString?.() ?? payer;

      // Serialize PublicKey objects in instruction keys to strings
      const serializedInstructions =
        instructions?.map?.(instruction => {
          const inst = instruction as Record<string, unknown>;
          return {
            ...inst,
            keys:
              (inst.keys as unknown[])?.map?.(key => {
                const k = key as Record<string, unknown>;
                return {
                  ...k,
                  pubkey: (k.pubkey as { toString?: () => string })?.toString?.() ?? k.pubkey,
                };
              }) || inst.keys,
            programId:
              (inst.programId as { toString?: () => string })?.toString?.() ?? inst.programId,
          };
        }) || instructions;

      return [serializedInstructions, serializedPayer];
    }
  }
  return removeUndefineds(args);
}

const APP_VERSION = "1.7.1";
const signature = "fakeSignatureTlaowosfpqwkpofqkpqwpoesHQv6xHyYwDsrPJvqcSKRJGBLrbE";
const signer = {
  getAppConfiguration: () =>
    Promise.resolve({
      version: APP_VERSION,
      blindSigningEnabled: false,
      pubKeyDisplayMode: PubKeyDisplayMode.LONG,
    }),
  getAddress: (_path: string, _display?: boolean) =>
    Promise.resolve({ address: Buffer.from("fakeAddress") }),
  signTransaction: (_path: string, _txBuffer: Buffer) =>
    Promise.resolve({ signature: Buffer.from(signature) }),
  signMessage: (_path: string, _messageHex: string) =>
    Promise.resolve({ signature: Buffer.from(signature) }),
};
const signerContext = <T>(
  _deviceId: string,
  fn: (signer: SolanaSigner) => Promise<T>,
): Promise<T> => fn(signer);

// Bridge with this api will log all api calls to a file.
// The calls data can be copied to mock-data.ts from the file.
// Uncomment fs module in logged.ts
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function createMockDataForAPI() {
  const chainAPICache = new Map<string, ReturnType<typeof getChainAPI>>();
  return {
    getAPI: (config: Config) => {
      const endpoint = config.endpoint;
      if (!chainAPICache.has(endpoint)) {
        chainAPICache.set(endpoint, logged(getChainAPI(config), "/tmp/log"));
      }
      return chainAPICache.get(endpoint)!;
    },
    signerContext,
  };
}

function getMockedAPIs() {
  const mockedAPI = mockChainAPI({ cluster: "mock" } as any);
  return {
    getAPI: (_: Config) => mockedAPI,
    signerContext,
  };
}

// const bridges = makeBridges(createMockDataForAPI());
const bridges = makeBridges(getMockedAPIs());

export default getEnv("PLAYWRIGHT_RUN") || getEnv("DETOX")
  ? {
      accountBridge: {
        ...bridges.accountBridge,
        sync,
      },
      currencyBridge: {
        ...bridges.currencyBridge,
        preload: () => Promise.resolve({}),
        hydrate: () => {},
        scanAccounts,
      },
    }
  : bridges;
