import { Observable } from "rxjs";
import TransportNodeHidSingleton, {
  ListenDescriptorEvent,
} from "@ledgerhq/hw-transport-node-hid-singleton";

// Listen to HID/USB-connected devices
const cmd = (): Observable<ListenDescriptorEvent> =>
  new Observable(TransportNodeHidSingleton.listen);

export default cmd;
