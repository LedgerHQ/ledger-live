// @flow
import type { SatStackStatus } from "@ledgerhq/live-common/families/bitcoin/satstack";
import { statusObservable } from "@ledgerhq/live-common/families/bitcoin/satstack";
import type { Observable } from "rxjs";

const cmd = (): Observable<SatStackStatus> => statusObservable;

export default cmd;
