import { useFetchOrdinals as fetchOrdinalsFromSimpleHash } from "@ledgerhq/live-nft-react";
import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";

type Props = {
  account: BitcoinAccount;
};

const useFetchOrdinals = ({ account }: Props) => {
  const utxosAddresses = account.bitcoinResources?.utxos?.map(utxo => utxo.address).join(",") || "";
  const { rareSats, inscriptions, isLoading, isError, isFetched } = fetchOrdinalsFromSimpleHash({
    addresses: utxosAddresses,
    threshold: 0,
  });

  return { rareSats, inscriptions, isLoading, isError, isFetched };
};

export default useFetchOrdinals;
