import { BigNumber } from "bignumber.js";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { ICrypto } from "@ledgerhq/wallet-btc/crypto/types";
import { PickingStrategy } from "@ledgerhq/wallet-btc/pickingstrategies/types";
import type { Output } from "@ledgerhq/wallet-btc/storage/types";
import type Xpub from "@ledgerhq/wallet-btc/xpub";
import { ZcashPreparedBuildMismatch } from "../types/errors";

export type Outpoint = { hash: string; outputIndex: number };

/**
 * Spends exactly the inputs it is given, at the fee and change it is given.
 *
 * The selection the user reviewed is made before any device is connected, over
 * the whole bounded UTXO set; wallet-btc's own strategies would pick a different
 * set and price a different fee. Feeding wallet-btc this strategy keeps its
 * input fetching and derivation lookups while pinning what gets signed.
 */
export class FixedSelection extends PickingStrategy {
  constructor(
    crypto: ICrypto,
    derivationMode: string,
    private readonly outpoints: Outpoint[],
    private readonly fee: BigNumber,
    private readonly needChangeOutput: boolean,
  ) {
    super(crypto, derivationMode, []);
  }

  async selectUnspentUtxosToUse(
    _logger: Logger,
    xpub: Xpub,
    _outputs: unknown[],
    _feePerByte: number,
  ): Promise<{
    unspentUtxos: Output[];
    totalValue: BigNumber;
    fee: number;
    needChangeoutput: boolean;
  }> {
    const addresses = await xpub.getXpubAddresses();
    const available = (
      await Promise.all(addresses.map(address => xpub.storage.getAddressUnspentUtxos(address)))
    )
      .flat()
      .filter(
        utxo =>
          !this.excludedUTXOs.some(
            excluded =>
              excluded.hash === utxo.output_hash && excluded.outputIndex === utxo.output_index,
          ),
      );

    const unspentUtxos = this.outpoints.map(({ hash, outputIndex }) => {
      const found = available.find(
        utxo => utxo.output_hash === hash && utxo.output_index === outputIndex,
      );
      if (!found) throw new ZcashPreparedBuildMismatch();
      return found;
    });

    const totalValue = unspentUtxos.reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0));

    return {
      unspentUtxos,
      totalValue,
      fee: this.fee.toNumber(),
      needChangeoutput: this.needChangeOutput,
    };
  }
}
