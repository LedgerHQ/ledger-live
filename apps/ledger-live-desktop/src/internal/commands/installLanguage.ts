import { Observable, from } from "rxjs";
import installLanguage, {
  InstallLanguageRequest,
  InstallLanguageEvent,
} from "@ledgerhq/live-common/hw/installLanguage";
const cmd = (input: InstallLanguageRequest): Observable<InstallLanguageEvent> =>
  from(installLanguage(input));

export default cmd;
