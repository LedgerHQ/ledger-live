import { Observable, from } from "rxjs";
import staxLoadImage, {
  LoadImageEvent,
  LoadImageRequest,
} from "@ledgerhq/live-common/hw/staxLoadImage";
const cmd = (input: LoadImageRequest): Observable<LoadImageEvent> => from(staxLoadImage(input));

export default cmd;
