// @flow
// Perform a genuine check. error is fails. complete on success.
// NB potentially we could emit progress events

import Transport from "@ledgerhq/hw-transport";
import { Observable } from "rxjs";
import { delay } from "../promise";
import { hookRejections } from "../../components/DebugRejectSwitch";

export default (transport: Transport<*>): Observable<void> =>
  Observable.create(o => {
    hookRejections(transport.send(0, 0, 0, 0).then(() => delay(2000))).then(
      () => o.complete(),
      e => o.error(e),
    );
    return () => {
      // cancel things
    };
  });
