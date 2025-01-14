import { SyncConfig } from "@ledgerhq/types-live";
import { Observable } from "rxjs";

export function sync<A>(
  // eslint-disable-next-line
  initialAccount: A,
  // eslint-disable-next-line
  syncConfig: SyncConfig,
  // @ts-expect-error to be implemented
): Observable<(arg0: A) => A> {}
