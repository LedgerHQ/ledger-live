import { useMemo } from "react";
import type { CryptoOrTokenCurrency, CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import { useReceiveNetwork } from "../../hooks/useReceiveNetwork";
import { useReceiveAddressCopy, type ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { toReceiveAddressData, type ReceiveAddressData } from "../../logic/toReceiveAddressData";

export type ReceiveAddressHeader = Readonly<{
  title: string;
  networkLabel: string;
  data: ReceiveAddressData | undefined;
  /** The asset received, once known: what the family config reads of it. */
  asset: Pick<CryptoOrTokenCurrency, "id" | "type"> | undefined;
  network: Pick<CryptoOrTokenCurrency, "id"> | undefined;
  copy: ReceiveAddressCopy;
}>;

/** The asset and network the screen receives on: empty labels until the currencies are known. */
export function useReceiveAddressHeader(assetId: CryptoOrTokenCurrencyId): ReceiveAddressHeader {
  const { asset, network } = useReceiveNetwork(assetId);
  const data = useMemo(
    () => (asset && network ? toReceiveAddressData({ asset, network }) : undefined),
    [asset, network],
  );
  const copy = useReceiveAddressCopy({
    assetTicker: data?.asset.ticker ?? "",
    networkName: data?.network ?? "",
  });

  return {
    title: data ? copy.title : "",
    networkLabel: data ? copy.networkLabel : "",
    data,
    asset,
    network,
    copy,
  };
}
