import { log } from "@ledgerhq/logs";
import { from } from "rxjs";
import Exchange from "@ledgerhq/hw-app-exchange";
import { Observable } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";
import type { ExchangeRequestEvent } from "../../hw/actions/startExchange";
const withDevicePromise = (deviceId, fn) =>
  withDevice(deviceId)((transport) => from(fn(transport))).toPromise();

type StartExchangeInput = {
  deviceId: string;
  exchangeType: number;
};

const startExchange = (
  input: StartExchangeInput
): Observable<ExchangeRequestEvent> => {
  return new Observable((o) => {
    let unsubscribed = false;
    const { deviceId, exchangeType } = input;

    const startExchangeAsync = async () => {
      await withDevicePromise(deviceId, async (transport) => {
        log("exchange", `attempt to connect to ${deviceId}`);
        if (unsubscribed) return;
        /**
         * Note: `transactionRate` is not needed at this stage. It is only used
         * at the `completeExchange` step
         */
        const exchange = new Exchange(transport, exchangeType);
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
      (error) => {
        o.next({
          type: "start-exchange-error",
          error,
        });
        o.complete();
        unsubscribed = true;
      }
    );
    return () => {
      unsubscribed = true;
    };
  });
};

export default startExchange;
