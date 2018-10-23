// @flow

import type { Observable } from "rxjs";
import type Transport from "@ledgerhq/hw-transport";

// meta object are accumulated over steps
export type Step = {
  icon: React$Node,
  title: React$Node,
  description: React$Node,
  run: (transport: Transport<*>, meta: Object) => Observable<Object>,
};
