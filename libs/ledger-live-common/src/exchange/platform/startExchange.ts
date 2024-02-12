import { log } from "@ledgerhq/logs";
import { Observable, firstValueFrom, from } from "rxjs";
import semver from "semver";
import { ExchangeTypes, createExchange, isExchangeTypeNg } from "@ledgerhq/hw-app-exchange";
import { withDevice } from "../../hw/deviceAccess";
import type { ExchangeRequestEvent } from "../../hw/actions/startExchange";
import { StartExchangeInput } from "./types";
import { getProviderConfig } from "../swap";

const withDevicePromise = (deviceId, fn) =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(transport))));

const startExchange = (input: StartExchangeInput): Observable<ExchangeRequestEvent> => {
  return new Observable(o => {
    let unsubscribed = false;
    const { deviceId, exchangeType, appVersion, provider } = input;
    const startExchangeAsync = async () => {
      await withDevicePromise(deviceId, async transport => {
        log("exchange", `attempt to connect to ${deviceId}`);
        let version;
        if (unsubscribed) return;
        if (provider) {
          const providerConfig = getProviderConfig(provider);
          if (providerConfig.type !== "CEX") {
            throw new Error(`Unsupported provider type ${providerConfig.type}`);
          }
          version = providerConfig.version;
        }

        if (!checkNgPrerequisite(exchangeType, appVersion)) {
          throw new Error("Incompatible AppExchange version with NG command");
        }

        /**
         * Note: `transactionRate` is not needed at this stage. It is only used
         * at the `completeExchange` step
         */
        const exchange = createExchange(transport, exchangeType, undefined, version);
        const nonce: string = await exchange.startNewTransaction();
        o.next({
          type: "start-exchange-result",
          nonce,
        });
      });
    };

    startExchangeAsync().then(
      () => {
        o.complete();
        unsubscribed = true;
      },
      error => {
        o.next({
          type: "start-exchange-error",
          error,
        });
        o.complete();
        unsubscribed = true;
      },
    );
    return () => {
      unsubscribed = true;
    };
  });
};

// AppExchange Min version supporting NG types
const MIN_APP_EXCHANGE_NG = "3.3.0";

/**
 * If the App-Exchnage version is not high enough, "NG" type can't worked
 */
function checkNgPrerequisite(exchangeType: ExchangeTypes, appVersion?: string) {
  if (isExchangeTypeNg(exchangeType) && appVersion && semver.lt(appVersion, MIN_APP_EXCHANGE_NG)) {
    return false;
  }

  return true;
}

export default startExchange;
