import type { CeloTx, RLPEncodedTx, LegacyEncodedTx } from "../types";
import { EvmSignature, EvmSigner } from "@ledgerhq/coin-evm/lib/types/signer";
import { LedgerEthTransactionResolution } from "@ledgerhq/hw-app-eth/lib/services/types";
export interface CeloSigner extends EvmSigner {
  signTransaction(
    path: string,
    rawTxHex: string,
    resolution?: LedgerEthTransactionResolution | null,
  ): Promise<EvmSignature>;
  verifyTokenInfo(to: string, chainId: number): Promise<void>;
  rlpEncodedTxForLedger(txParams: CeloTx): Promise<RLPEncodedTx | LegacyEncodedTx>;
}
