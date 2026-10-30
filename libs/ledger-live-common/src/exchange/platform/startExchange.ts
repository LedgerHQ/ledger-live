import { log } from "@ledgerhq/logs";
import { Observable, firstValueFrom, from } from "rxjs";
import type Transport from "@ledgerhq/hw-transport";
import semver from "semver";
import { ExchangeTypes, createExchange, isExchangeTypeNg } from "@ledgerhq/hw-app-exchange";
import { withDevice } from "../../hw/deviceAccess";
import type { ExchangeRequestEvent } from "../../hw/actions/startExchange";
import { StartExchangeInput } from "./types";
import { getProviderConfig, getSwapProvider } from "../providers";

const withDevicePromise = (deviceId, fn) =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(transport))));

type StartNewExchangeTransactionParams = Pick<
  StartExchangeInput,
  "exchangeType" | "appVersion" | "provider"
>;

/**
 * Asks the Exchange app of an already opened transport for a new transaction nonce.
 * Shared by the legacy `withDevice` path and the Device Intent job; it never closes the transport.
 *
 * Resolves with `undefined` when `isCancelled` turned true before the device was asked.
 */
export async function startNewExchangeTransaction(
  transport: Transport,
  { exchangeType, appVersion, provider }: StartNewExchangeTransactionParams,
  isCancelled: () => boolean = () => false,
): Promise<string | undefined> {
  let version;
  if (isCancelled()) return undefined;
  if (provider) {
    switch (exchangeType) {
      case ExchangeTypes.Swap: {
        const providerConfig = await getSwapProvider(provider);
        if (providerConfig.useInExchangeApp === false) {
          throw new Error(`Unsupported provider type ${providerConfig.type}`);
        }
        version = providerConfig.version;
        break;
      }
      default: {
        const providerConfig = await getProviderConfig(exchangeType, provider);
        version = providerConfig.version;
      }
    }
  }

  if (!checkNgPrerequisite(exchangeType, appVersion)) {
    throw new Error("Incompatible AppExchange version with NG command");
  }

  // The provider lookup is a network call: a start cancelled meanwhile must not reset the nonce
  // of the exchange that replaced it on the shared device session.
  if (isCancelled()) return undefined;

  /**
   * Note: `transactionRate` is not needed at this stage. It is only used
   * at the `completeExchange` step
   */
  const exchange = createExchange(transport, exchangeType, undefined, version);
  return exchange.startNewTransaction();
}

const startExchange = (input: StartExchangeInput): Observable<ExchangeRequestEvent> => {
  return new Observable(o => {
    let unsubscribed = false;
    const { device, exchangeType, appVersion, provider } = input;
    const startExchangeAsync = async () => {
      await withDevicePromise(device.deviceId, async transport => {
        log("exchange", `attempt to connect to ${device.deviceId}`);
        const nonce = await startNewExchangeTransaction(
          transport,
          { exchangeType, appVersion, provider },
          () => unsubscribed,
        );
        if (nonce === undefined) return;
        o.next({
          type: "start-exchange-result",
          startExchangeResult: { nonce, device },
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
          startExchangeError: { error, device },
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
