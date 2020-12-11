// @flow

import { disconnect as rippleApiDisconnect } from "./Ripple";

export async function disconnectAll() {
  await rippleApiDisconnect();
}
