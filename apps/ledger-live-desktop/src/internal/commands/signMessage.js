// @flow

import type { Observable } from "rxjs";
import { signMessageExec } from "@ledgerhq/live-common/hw/signMessage/index";
import type { Input } from "@ledgerhq/live-common/hw/signMessage/index";
import type { Result } from "@ledgerhq/live-common/hw/signMessage/types";

const cmd = (input: Input): Observable<Result> => signMessageExec(input);

export default cmd;
