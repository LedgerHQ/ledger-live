import { Message, PublicKey } from "@solana/web3.js";
import { ChainAPI, LATEST_BLOCKHASH_MOCK } from "./chain";

function write(_file: string, _str: string) {
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
        const method: keyof ChainAPI = propKey as any;
        return function (...args: unknown[]) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: TS-2683
          const result = targetValue.apply(this, args);
          const log = (answer: unknown) => {
            if (method === "getLatestBlockhash") {
              // add getLatestBlockhash manually to mock data to with mocked block hash
              return;
            }

            if (method === "getFeeForMessage") {
              // getFeeForMessage arg message must be serialized since it's a class
              if (args.length === 1 && args[0] instanceof Message) {
                args[0].recentBlockhash = LATEST_BLOCKHASH_MOCK;
                (args as any) = [args[0].serialize().toString("base64")];
              } else {
                throw new Error("unexpected getFeeForMessage function signature");
              }
            }
            const paramsJson = JSON.stringify(args);
            const publicKeytoJSON = PublicKey.prototype.toJSON;
            // @ts-expect-error hack to temporary remove toJSON so it doesn't affect JSON.stringify
            delete PublicKey.prototype.toJSON;
            const answerJson = JSON.stringify(answer).replace(
              /{"_bn":(".*?")}/g,
              "new PublicKey(Buffer.from($1, 'hex'))",
            );
            PublicKey.prototype.toJSON = publicKeytoJSON;
            const summaryJson = `{"method":"${method}", "params":${paramsJson},"answer":${answerJson}}`;
            write(file, summaryJson + ",\n");
          };
          if (result instanceof Promise) {
            return result.then(answer => {
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
