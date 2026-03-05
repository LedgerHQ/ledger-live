import Eth from "@ledgerhq/hw-app-eth";
import { rlpEncodedTx, LegacyEncodedTx } from "@celo/wallet-base";
import type { CeloTx, RLPEncodedTx } from "@celo/connect";
import type Transport from "@ledgerhq/hw-transport";
import ledgerServiceCelo from "./services/ledger";
/**
 * Heavily inspiried by celo-web-wallet
 * https://github.com/celo-tools/celo-web-wallet/blob/master/src/features/ledger/CeloLedgerApp.ts
 */
export default class Celo extends Eth {
  constructor(transport: Transport) {
    super(transport, undefined, undefined, ledgerServiceCelo);
  }

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
