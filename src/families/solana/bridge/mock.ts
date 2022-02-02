import { flow, isArray, isEqual, isObject } from "lodash/fp";
import { isUndefined, mapValues, omitBy } from "lodash/fp";
import { cached, ChainAPI, Config, getChainAPI, logged, queued } from "../api";
import { makeBridges } from "./bridge";
import { makeLRUCache } from "../../../cache";
import { getMockedMethods } from "./mock-data";
import { minutes } from "../api/cached";

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
        const method = propKey.toString();
        const mocks = mockedMethods.filter((mock) => mock.method === method);
        if (mocks.length === 0) {
          throw new Error(`no mock found for api method: ${method}`);
        }
        return function (...args: any[]) {
          const definedArgs = removeUndefineds(args);
          const mock = mocks.find(({ params }) => isEqual(definedArgs)(params));
          if (mock === undefined) {
            const argsJson = JSON.stringify(args);
            throw new Error(
              `no mock found for api method ${method} with args ${argsJson}`
            );
          }
          return Promise.resolve(mock.answer);
        };
      },
    }
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

// Bridge with this api will log all api calls to a file.
// The calls data can be copied to mock-data.ts from the file.
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function createMockDataForAPI() {
  const apiGetter = makeLRUCache(
    (config: Config) =>
      Promise.resolve(
        cached(queued(logged(getChainAPI(config), "/tmp/log"), 100))
      ),
    (config) => config.endpoint,
    minutes(1000)
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
