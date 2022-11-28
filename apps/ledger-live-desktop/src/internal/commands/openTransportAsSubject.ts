import { Subject } from "rxjs";
import openTransportAsSubject, {
  OpenTransportAsSubjectRequest,
  BidirectionalEvent,
} from "@ledgerhq/live-common/hw/openTransportAsSubject";

const cmd = (input: OpenTransportAsSubjectRequest): Subject<BidirectionalEvent> =>
  openTransportAsSubject(input);

export default cmd;
