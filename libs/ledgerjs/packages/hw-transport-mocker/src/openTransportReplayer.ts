import { Subject, firstValueFrom, map } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import type { RecordStore } from "./RecordStore";

export class TransportReplayer extends Transport {
  recordStore: RecordStore;
  artificialExchangeDelay = 0;
  exchangeBlocker: null | Subject<number>;

  constructor(recordStore: RecordStore) {
    super();
    this.recordStore = recordStore;
    this.exchangeBlocker = null;
  }

  static isSupported = () => Promise.resolve(true);
  static list = () => Promise.resolve([null]);
  static listen = o => {
    let unsubscribed;
    setTimeout(() => {
      if (unsubscribed) return;
      o.next({
        type: "add",
        descriptor: null,
      });
      o.complete();
    }, 0);
    return {
      unsubscribe: () => {
        unsubscribed = true;
      },
    };
  };
  static open = (recordStore: RecordStore) => Promise.resolve(new TransportReplayer(recordStore));

  setArtificialExchangeDelay(delay: number): void {
    this.artificialExchangeDelay = delay;
  }

  setScrambleKey() {}

  close() {
    return Promise.resolve();
  }

  /**
   * Sets an observable blocking an exchange until `unblockExchange` is called
   */
  enableExchangeBlocker() {
    this.exchangeBlocker = new Subject();
  }

  /**
   * Unblock exchange by emitting an event (if enabled), and remove the exchange blocker
   */
  unblockExchange() {
    if (this.exchangeBlocker) {
      this.exchangeBlocker.next(1);
      this.exchangeBlocker = null;
    }
  }

  exchange(apdu: Buffer): Promise<Buffer> {
    log("apdu", apdu.toString("hex"));

    try {
      const buffer = this.recordStore.replayExchange(apdu);
      log("apdu", buffer.toString("hex"));

      if (this.artificialExchangeDelay) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(buffer);
            this.setArtificialExchangeDelay(0);
          }, this.artificialExchangeDelay);
        });
      } else if (this.exchangeBlocker) {
        return firstValueFrom(
          // The exchange is unblocked once `exchangeBlocker` emits a value
          this.exchangeBlocker.pipe(
            map(_ => {
              return buffer;
            }),
          ),
        );
      } else {
        return Promise.resolve(buffer);
      }
    } catch (e) {
      log("apdu-error", String(e));
      return Promise.reject(e);
    }
  }
}

/**
 * create a transport replayer with a record store.
 * @param recordStore
 */
const openTransportReplayer = (recordStore: RecordStore): Promise<TransportReplayer> => {
  return TransportReplayer.open(recordStore);
};

export default openTransportReplayer;
