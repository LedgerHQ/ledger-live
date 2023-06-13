import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { Message } from "@solana/web3.js";
import { flow, isArray, isEqual, isObject, isUndefined, mapValues, omitBy } from "lodash/fp";
import { ChainAPI, Config, cached, getChainAPI, logged, queued } from "../api";
import { minutes } from "../api/cached";
import { Functions } from "../utils";
import { makeBridges } from "./bridge";
import { getMockedMethods } from "./mock-data";

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
        return function (...rawArgs: any[]) {
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

function removeUndefineds(input: any) {
  return isObject(input)
    ? isArray(input)
      ? input.map(removeUndefineds)
      : flow(omitBy(isUndefined), mapValues(removeUndefineds))(input)
    : input;
}

function preprocessArgs(method: keyof ChainAPI, args: any) {
  if (method === "getFeeForMessage") {
    // getFeeForMessage needs some args preprocessing
    if (args.length === 1 && args[0] instanceof Message) {
      return [args[0].serialize().toString("base64")];
    } else {
      throw new Error("unexpected getFeeForMessage function signature");
    }
  }
  return removeUndefineds(args);
}

// Bridge with this api will log all api calls to a file.
// The calls data can be copied to mock-data.ts from the file.
// Uncomment fs module in logged.ts
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function createMockDataForAPI() {
  const apiGetter = makeLRUCache(
    (config: Config) =>
      Promise.resolve(cached(queued(logged(getChainAPI(config), "/tmp/log"), 100))),
    config => config.endpoint,
    minutes(1000),
  );
  return {
    getAPI: apiGetter,
    getQueuedAPI: apiGetter,
    getQueuedAndCachedAPI: apiGetter,
  };
}

function getMockedAPIs() {
  const mockedAPI = mockChainAPI({ cluster: "mock" } as any);
  return {
    getAPI: (_: Config) => Promise.resolve(mockedAPI),
    getQueuedAPI: (_: Config) => Promise.resolve(mockedAPI),
    getQueuedAndCachedAPI: (_: Config) => Promise.resolve(mockedAPI),
  };
}

//export default makeBridges(createMockDataForAPI());
export default makeBridges(getMockedAPIs());
