import {
  RecordStore,
  openTransportReplayer,
} from "@ledgerhq/hw-transport-mocker";
import { TransportRef } from "../transports/core";

/**
 * Build a mocked TransportRef
 *
 * Not a final version, can be updated.
 */
export const aTransportRefBuilder = async (): Promise<TransportRef> => {
  const transport = await openTransportReplayer(new RecordStore());

  const transportRef = {
    current: transport,
    _refreshedCounter: 0,
    refreshTransport: Promise.resolve,
  };

  transportRef.refreshTransport = async () => {
    transportRef._refreshedCounter++;
    return Promise.resolve();
  };

  return transportRef;
};
