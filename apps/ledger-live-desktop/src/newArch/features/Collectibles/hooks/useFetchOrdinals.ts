import { useFetchOrdinals as fetchOrdinalsFromSimpleHash } from "@ledgerhq/live-nft-react";
import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";

type Props = {
  account: BitcoinAccount;
};

const useFetchOrdinals = ({ account }: Props) => {
  const utxosAddresses = account.bitcoinResources?.utxos?.map(utxo => utxo.address).join(",") || "";
  return fetchOrdinalsFromSimpleHash({
    addresses: utxosAddresses,
    threshold: 0,
  });
};

export default useFetchOrdinals;
