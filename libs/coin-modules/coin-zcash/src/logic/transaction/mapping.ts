import type { BuildTransactionArgs, SpendableNote } from "../../network/types";
import type { BitcoinOutput, Transaction, ZcashAccount } from "../../types/bridge";
import { ZcashUtxoNotInAccount } from "../../types/errors";
import { getWalletAccount } from "../getWalletAccount";

type OrchardSpendInputJs = BuildTransactionArgs["spends"][number];
type TransparentInputJs = BuildTransactionArgs["transparentInputs"][number];
type OutputRequestJs = BuildTransactionArgs["outputs"][number];

export function mapSpends(notes: SpendableNote[]): OrchardSpendInputJs[] {
  return notes.map(note => ({
    recipient: note.recipient,
    valueZat: note.amount.toFixed(0),
    rho: note.rho,
    rseed: note.rseed,
    cmx: note.cmx,
    position: note.position,
  }));
}

/**
 * Maps wallet UTXOs to the transparent-input shape the PCZT builder expects.
 *
 * The txid is byte-reversed from big-endian (display order, as stored in
 * BitcoinOutput.hash) to little-endian (internal order, as required by the
 * native builder).
 */
export async function mapTransparentInputs(
  account: ZcashAccount,
  utxos: BitcoinOutput[],
): Promise<TransparentInputJs[]> {
  if (utxos.length === 0) return [];

  const walletAccount = getWalletAccount(account);
  const { xpub, crypto } = walletAccount.xpub;

  const [receiveAddrs, changeAddrs] = await Promise.all([
    walletAccount.xpub.getAccountAddresses(0),
    walletAccount.xpub.getAccountAddresses(1),
  ]);

  const addrMap = new Map<string, { account: number; index: number }>();
  for (const addr of [...receiveAddrs, ...changeAddrs]) {
    addrMap.set(addr.address, { account: addr.account, index: addr.index });
  }

  return Promise.all(
    utxos.map(async utxo => {
      const address = utxo.address;
      if (address === null || address === undefined || address === "") {
        throw new ZcashUtxoNotInAccount(
          "Can't sign this transaction: one of your Zcash coins is missing address data. Please re-sync your account and try again.",
          { txid: utxo.hash, vout: utxo.outputIndex },
        );
      }
      const derivInfo = addrMap.get(address);
      if (!derivInfo) {
        throw new ZcashUtxoNotInAccount(
          "Can't sign this transaction: one of your Zcash coins isn't recognized by this account yet. Please re-sync your account and try again.",
          { txid: utxo.hash, vout: utxo.outputIndex },
        );
      }
      const pubkeyBuf = await crypto.getPubkeyAt(xpub, derivInfo.account, derivInfo.index);
      const scriptPubKey = crypto.toOutputScript(address);
      return {
        txid: Buffer.from(utxo.hash, "hex").reverse().toString("hex"),
        vout: utxo.outputIndex,
        scriptPubKey: scriptPubKey.toString("hex"),
        valueZat: utxo.value.toFixed(0),
        pubkey: pubkeyBuf.toString("hex"),
        derivationScope: derivInfo.account,
        addressIndex: derivInfo.index,
      };
    }),
  );
}

export function mapOutputs(tx: Transaction): OutputRequestJs[] {
  return [
    {
      address: tx.recipient,
      valueZat: tx.amount.toFixed(0),
      ...(tx.memo !== undefined && { memo: tx.memo }),
    },
  ];
}
