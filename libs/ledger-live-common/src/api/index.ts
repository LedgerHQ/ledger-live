import { disconnect as polkadotApiDisconnect } from "@ledgerhq/coin-polkadot/lib/api";

export async function disconnectAll(): Promise<void> {
  await polkadotApiDisconnect();
}
