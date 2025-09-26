import Eth from "@ledgerhq/hw-app-eth";
import { rlpEncodedTx, LegacyEncodedTx } from "@celo/wallet-base";
import type { CeloTx, RLPEncodedTx } from "@celo/connect";

/**
 * Heavily inspiried by celo-web-wallet
 * https://github.com/celo-tools/celo-web-wallet/blob/master/src/features/ledger/CeloLedgerApp.ts
 */
export default class Celo extends Eth {
  async signTransaction(
    path: string,
    rawTxHex: string,
  ): Promise<{ s: string; v: string; r: string }> {
    return super.signTransaction(path, rawTxHex);
  }

  async rlpEncodedTxForLedger(txParams: CeloTx): Promise<RLPEncodedTx | LegacyEncodedTx> {
    return rlpEncodedTx(txParams);
  }
}
