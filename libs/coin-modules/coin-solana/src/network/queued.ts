import { asyncQueue } from "../utils";
import { ChainAPI } from "./chain";

export function queued(api: ChainAPI, delayBetweenRuns = 100): ChainAPI {
  const q = asyncQueue({
    delayBetweenRuns,
  });

  const proxy: ChainAPI = new Proxy(api, {
    get(target, propKey, receiver) {
      const targetValue = Reflect.get(target, propKey, receiver);
      if (typeof targetValue === "function") {
        return function (...args: unknown[]) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: TS-2683
          return q.submit(() => targetValue.apply(this, args));
        };
      } else {
        return targetValue;
      }
    },
  });

  return proxy;
}
