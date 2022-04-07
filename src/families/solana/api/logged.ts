import { ChainAPI } from "./chain";

//import fs from "fs";
import { PublicKey } from "@solana/web3.js";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function write(file: string, str: string) {
  // fs is not available on mobile
  //fs.appendFileSync(file, str);
}

export function logged(api: ChainAPI, file: string): ChainAPI {
  const proxy: ChainAPI = new Proxy(api, {
    get(target, propKey, receiver) {
      if (typeof propKey === "symbol") {
        throw new Error("symbols not supported");
      }
      const targetValue = Reflect.get(target, propKey, receiver);
      if (typeof targetValue === "function") {
        return function (...args: unknown[]) {
          const result = targetValue.apply(this, args);
          const log = (answer: unknown) => {
            const summary = {
              method: propKey,
              params: args,
              answer,
            };
            const publicKeytoJSON = PublicKey.prototype.toJSON;
            // @ts-expect-error hack to temporary remove toJSON so it doesn't affect JSON.stringify
            delete PublicKey.prototype.toJSON;
            const summaryJson = JSON.stringify(summary).replace(
              /{"_bn":(".*?")}/g,
              "new PublicKey(Buffer.from($1, 'hex'))"
            );
            PublicKey.prototype.toJSON = publicKeytoJSON;
            write(file, summaryJson + ",\n");
          };
          if (result instanceof Promise) {
            return result.then((answer) => {
              log(answer);
              return answer;
            });
          } else {
            log(result);
            return result;
          }
        };
      } else {
        return targetValue;
      }
    },
  });

  return proxy;
}
