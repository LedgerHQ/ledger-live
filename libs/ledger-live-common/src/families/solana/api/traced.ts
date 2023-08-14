import { log } from "@ledgerhq/logs";
import { getEnv } from "../../../env";
import { ChainAPI } from "./chain";

export function traced(api: ChainAPI): ChainAPI {
  const state = {
    reqId: 0,
    reqStartTime: new Map<number, number>(),
  };

  const startReqTrace = () => {
    state.reqId += 1;
    state.reqStartTime.set(state.reqId, Date.now());
    return state.reqId;
  };

  const stopReqTrace = (reqId: number) => {
    const reqStartTime = state.reqStartTime.get(reqId);
    if (reqStartTime === undefined) {
      log("warn", `request start time not found for request id <${reqId}>`);
      return {
        duration: 0,
      };
    }
    state.reqStartTime.delete(reqId);
    return {
      duration: Date.now() - reqStartTime,
    };
  };

  const proxy: ChainAPI = new Proxy(api, {
    get(target, propKey, receiver) {
      if (typeof propKey === "symbol") {
        throw new Error("symbols not supported");
      }
      const targetValue = Reflect.get(target, propKey, receiver);
      if (typeof targetValue === "function") {
        return function (...args: unknown[]) {
          const reqId = startReqTrace();
          log("network", formatMsg({ reqId, msg: `calling <${propKey}>` }), {
            args,
          });
          const result = targetValue.apply(this, args);
          if (result instanceof Promise) {
            return result
              .then(answer => {
                const { duration } = stopReqTrace(reqId);
                log(
                  "network-success",
                  formatMsg({ reqId, msg: "success", duration }),
                  getEnv("DEBUG_HTTP_RESPONSE") ? { answer } : undefined,
                );
                return answer;
              })
              .catch(error => {
                const { duration } = stopReqTrace(reqId);
                log("network-error", formatMsg({ reqId, msg: "error", duration }), { error });
                throw error;
              });
          } else {
            const { duration } = stopReqTrace(reqId);
            log(
              "info",
              formatMsg({ reqId, msg: "sync result", duration }),
              getEnv("DEBUG_HTTP_RESPONSE") ? { result } : undefined,
            );
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

function formatMsg({ reqId, msg, duration }: { reqId: number; msg?: string; duration?: number }) {
  const parts = [
    `solana req id: ${reqId}`,
    msg ?? "",
    duration === undefined ? "" : `took ${duration.toFixed(0)}ms`,
  ];

  return parts.join(", ");
}
