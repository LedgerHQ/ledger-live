// @flow

import { disconnect as rippleApiDisconnect } from "./Ripple";
import { disconnect as polkadotApiDisconnect } from "../families/polkadot/api";

export async function disconnectAll() {
  await rippleApiDisconnect();
  await polkadotApiDisconnect();
}
