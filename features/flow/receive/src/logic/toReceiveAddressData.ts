type Currency = Readonly<{ id: string; name: string; ticker: string }>;

export type ReceiveIcon = Readonly<{
  ledgerId: string;
  ticker: string;
  network?: string;
}>;

export type ReceiveAddressData = Readonly<{
  asset: Readonly<{ name: string; ticker: string }>;
  network: string;
  assetIcon: ReceiveIcon;
  networkIcon: ReceiveIcon;
}>;

/**
 * What the address screen shows of the asset and its network. `asset` is what the user receives
 * (a coin or a token), `network` the coin of the account it lands on (the same coin for a native
 * asset).
 */
export function toReceiveAddressData({
  asset,
  network,
}: Readonly<{ asset: Currency; network: Currency }>): ReceiveAddressData {
  return {
    asset: { name: asset.name, ticker: asset.ticker },
    network: network.name,
    assetIcon: { ledgerId: asset.id, ticker: asset.ticker, network: network.id },
    networkIcon: { ledgerId: network.id, ticker: network.ticker },
  };
}
