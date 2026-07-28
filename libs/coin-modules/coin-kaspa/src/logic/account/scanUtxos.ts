import { BigNumber } from "bignumber.js";
import { getUtxosForAddresses } from "../../network";
import { AccountAddress, AccountAddresses, KaspaUtxo } from "../../types";
import { normalizeToKaspaPrefix } from "../kaspaAddresses";
import { scanAddresses } from "./scanAddresses";

export async function scanUtxos(
  compressedPublicKey: Buffer,
  chainCode: Buffer,
): Promise<{ utxos: KaspaUtxo[]; accountAddresses: AccountAddresses }> {
  const accountAddresses: AccountAddresses = await scanAddresses(compressedPublicKey, chainCode, 0);

  const allUsedAddresses = [
    ...accountAddresses.usedReceiveAddresses,
    ...accountAddresses.usedChangeAddresses,
  ];

  const utxoResponse = await getUtxosForAddresses(allUsedAddresses.map(addrObj => addrObj.address));

  const kaspaUtxos = utxoResponse.map(utxo => {
    return {
      ...utxo,
      ...getTypeAndIndexFromAccountAddresses(allUsedAddresses, utxo.address),
    };
  });

  // Convert utxoEntry.amount to BigNumber
  kaspaUtxos.forEach(utxo => {
    utxo.utxoEntry.amount = BigNumber(utxo.utxoEntry.amount);
  });

  return {
    utxos: kaspaUtxos as KaspaUtxo[],
    accountAddresses: accountAddresses,
  };
}

function getTypeAndIndexFromAccountAddresses(accountAddreses: AccountAddress[], address: string) {
  // Normalize to kaspa: prefix before comparing so kaspasim: (simnet) and kaspa: (mainnet)
  // UTXOs resolve to the same account address. The bech32 checksum encodes the prefix, so
  // string-stripping the prefix is insufficient — we decode the pubkey and re-encode.
  const normalized = normalizeToKaspaPrefix(address);
  const foundAddress = accountAddreses.find(
    addr => normalizeToKaspaPrefix(addr.address) === normalized,
  );
  if (foundAddress) {
    return { accountType: foundAddress.type, accountIndex: foundAddress.index };
  } else {
    throw new Error(`Address ${address} not found in addresses set.`);
  }
}
