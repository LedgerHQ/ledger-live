import type { ReceiveAddressProps } from "../types";

type Currency = Readonly<{ id: string; name: string; ticker: string }>;

export type ReceiveAddressData = Pick<
  ReceiveAddressProps,
  "address" | "asset" | "network" | "assetIcon" | "networkIcon"
>;

/**
 * Display data of the address screen. `asset` is what the user receives (a coin or a token),
 * `network` the coin of the account it lands on (the same coin for a native asset).
 */
export function toReceiveAddressData({
  asset,
  network,
  address,
}: Readonly<{ asset: Currency; network: Currency; address: string }>): ReceiveAddressData {
  return {
    address,
    asset: { name: asset.name, ticker: asset.ticker },
    network: network.name,
    assetIcon: { ledgerId: asset.id, ticker: asset.ticker, network: network.id },
    networkIcon: { ledgerId: network.id, ticker: network.ticker },
  };
}
