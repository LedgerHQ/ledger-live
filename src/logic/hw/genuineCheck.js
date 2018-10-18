// @flow
// Perform a genuine check. error is fails. complete on success.

import Transport from "@ledgerhq/hw-transport";
import { Observable } from "rxjs";

export default (transport: Transport<*>): Observable<void> =>
  Observable.create(o => {
    transport.send(0, 0, 0, 0).then(
      () => {
        // NB potentially we could emit progress events
        setTimeout(() => {
          o.complete();
        }, 2000);
      },
      e => o.error(e),
    );
    return () => {
      // cancel things
    };
  });
