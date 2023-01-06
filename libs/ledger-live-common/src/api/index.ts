import { disconnect as polkadotApiDisconnect } from "@ledgerhq/coin-polkadot/api/index";

export async function disconnectAll(): Promise<void> {
  await polkadotApiDisconnect();
}
