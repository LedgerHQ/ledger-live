import { Subject } from "rxjs";
import getTransport, {
  GetTransportRequest,
  BidirectionalEvent,
} from "@ledgerhq/live-common/hw/getTransport";

const cmd = (input: GetTransportRequest): Subject<BidirectionalEvent> => getTransport(input);

export default cmd;
