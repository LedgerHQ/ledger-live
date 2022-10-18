import { Observable, from } from "rxjs";
import installLanguage, {
  LoadImageEvent,
  LoadImageRequest,
} from "@ledgerhq/live-common/hw/ftsLoadImage";
const cmd = (input: LoadImageRequest): Observable<LoadImageEvent> => from(installLanguage(input));

export default cmd;
