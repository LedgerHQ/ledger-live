import { useMemo } from "react";
import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import { useCryptoCurrencyById, useCurrencyById } from "@features/platform-currencies";
import { useReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { toReceiveAddressData, type ReceiveAddressData } from "../../logic/toReceiveAddressData";

export type ReceiveAddressHeader = Readonly<{
  title: string;
  networkLabel: string;
  data: ReceiveAddressData | undefined;
}>;

/** The asset and network the screen receives on: empty labels until the currencies are known. */
export function useReceiveAddressHeader(
  descriptor: AccountDescriptor | undefined,
  assetId: CryptoOrTokenCurrencyId,
): ReceiveAddressHeader {
  const { currency: asset } = useCurrencyById(assetId);
  const network = useCryptoCurrencyById(
    descriptor ? currencyIdFromNetwork(descriptor.network) : undefined,
  );
  const data = useMemo(
    () => (asset && network ? toReceiveAddressData({ asset, network }) : undefined),
    [asset, network],
  );
  const { title, networkLabel } = useReceiveAddressCopy({
    assetTicker: data?.asset.ticker ?? "",
    networkName: data?.network ?? "",
  });

  return { title: data ? title : "", networkLabel: data ? networkLabel : "", data };
}
