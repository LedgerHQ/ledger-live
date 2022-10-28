import { Observable, from } from "rxjs";
import ftsLoadImage, {
  LoadImageEvent,
  LoadImageRequest,
} from "@ledgerhq/live-common/hw/ftsLoadImage";
const cmd = (input: LoadImageRequest): Observable<LoadImageEvent> => from(ftsLoadImage(input));

export default cmd;
