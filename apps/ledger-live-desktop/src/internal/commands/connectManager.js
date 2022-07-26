// @flow

import type { Observable } from "rxjs";
import { from } from "rxjs";
import connectManager from "@ledgerhq/live-common/hw/connectManager";
import type { Input, ConnectManagerEvent } from "@ledgerhq/live-common/hw/connectManager";

const cmd = (input: Input): Observable<ConnectManagerEvent> => from(connectManager(input));

cmd.inferSentryTransaction = input => ({ data: input });

export default cmd;
