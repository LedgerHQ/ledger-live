import invariant from "invariant";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { registerTransportModule } from "../../hw";
let idCounter = 0;
const transports = {};
const recordStores = {};
export function releaseMockDevice(id: string) {
  const store = recordStores[id];
  invariant(store, "MockDevice does not exist (%s)", id);
  try {
    store.ensureQueueEmpty();
  } catch (e: any) {
    e && console.error(e.message);
    throw e;
  } finally {
    delete recordStores[id];
    delete transports[id];
  }
}
export async function mockDeviceWithAPDUs(apdus: string, opts?: { autoSkipUnknownApdu: boolean }) {
  const id = `mock:${++idCounter}`;
  const store = RecordStore.fromString(apdus, opts);
  recordStores[id] = store;
  transports[id] = await openTransportReplayer(store);
  return id;
}
registerTransportModule({
  id: "mock",
  open: id => {
    if (id in transports) {
      const Tr = transports[id];
      return Tr;
    }
  },
  disconnect: () => Promise.resolve(),
});
