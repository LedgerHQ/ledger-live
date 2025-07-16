import Eth from "@ledgerhq/hw-app-eth";
import { tokenInfoByAddressAndChainId } from "@celo/wallet-ledger/lib/tokens";
import { rlpEncodedTx, LegacyEncodedTx } from "@celo/wallet-base";
import type { CeloTx, RLPEncodedTx } from "@celo/connect";
import { LedgerEthTransactionResolution } from "@ledgerhq/hw-app-eth/lib/services/types";

/**
 * Heavily inspiried by celo-web-wallet
 * https://github.com/celo-tools/celo-web-wallet/blob/master/src/features/ledger/CeloLedgerApp.ts
 */
export default class Celo extends Eth {
  async signTransaction(
    path: string,
    rawTxHex: string,
    resolution?: LedgerEthTransactionResolution | null,
  ): Promise<{ s: string; v: string; r: string }> {
    return super.signTransaction(path, rawTxHex, resolution);
  }

  // celo-spender-app below version 1.2.3 used a different private key to validate erc20 token info.
  // this legacy version of the app also only supported celo type 0 transactions.
  // if you are reading this after celo moved to op based L2 those celo type 0 transactions will no longer work
  // so you can safely remove all the legacy paths.
  async verifyTokenInfo(to: string, chainId: number): Promise<void> {
    const tokenInfo = tokenInfoByAddressAndChainId(to, chainId);

    if (tokenInfo) {
      // celo-spender-app below version 1.2.3 expected unprefixed hex strings only
      const dataString = `0x${tokenInfo.data.toString("hex")}`;
      await this.provideERC20TokenInformation(dataString);
    }
  }

  async rlpEncodedTxForLedger(txParams: CeloTx): Promise<RLPEncodedTx | LegacyEncodedTx> {
    return rlpEncodedTx(txParams);
  }
}
