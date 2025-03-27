import type { CeloTx, RLPEncodedTx } from "@celo/connect";
import { LegacyEncodedTx } from "@celo/wallet-base";
import { EvmSignature, EvmSigner } from "@ledgerhq/coin-evm/lib/types/signer";
import { LedgerEthTransactionResolution } from "@ledgerhq/hw-app-eth/lib/services/types";

// export type CeloAddress = {
//   publicKey: string;
//   address: string;
// };

export interface CeloSigner extends EvmSigner{
  // getAddress(path: string, boolDisplay?: boolean): Promise<CeloAddress>;
  // signTransaction(path: string, rawTxHex: string): Promise<CeloSignature>;
  signTransaction(
    path: string,
    rawTxHex: string,
    resolution?: LedgerEthTransactionResolution | null,
  ): Promise<EvmSignature>;
  verifyTokenInfo(to: string, chainId: number): Promise<void>;
  rlpEncodedTxForLedger(txParams: CeloTx): Promise<RLPEncodedTx | LegacyEncodedTx>;
}

// NOTE: extend EvmSigner type