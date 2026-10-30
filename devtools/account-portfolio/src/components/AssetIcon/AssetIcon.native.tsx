import CryptoIcon from "@ledgerhq/crypto-icons/native";

/**
 * The icon of an asset. A token has a CAL id such as `ethereum/erc20/usd_coin`, and shows its
 * network as a badge; a coin is its own network, so the network is the id.
 */
export function AssetIcon({
  network,
  calId,
  ticker,
}: Readonly<{ network: string; calId?: string; ticker?: string }>) {
  const isToken = calId?.includes("/") ?? false;
  return (
    <CryptoIcon
      ledgerId={calId ?? network}
      ticker={ticker ?? network}
      network={isToken ? network : undefined}
      size={24}
    />
  );
}
