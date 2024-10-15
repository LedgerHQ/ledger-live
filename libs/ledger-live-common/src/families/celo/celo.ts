import Eth from "@ledgerhq/hw-app-eth";
import {
  tokenInfoByAddressAndChainId,
  legacyTokenInfoByAddressAndChainId,
} from "@celo/wallet-ledger/lib/tokens";
import {
  encode_deprecated_celo_legacy_type_only_for_temporary_ledger_compat,
  rlpEncodedTx,
  LegacyEncodedTx,
} from "@celo/wallet-base";
import type { CeloTx, RLPEncodedTx } from "@celo/connect";
import { celoKit } from "./api/sdk";

import SemVer from "semver";

export default class Celo extends Eth {
  private config?: Promise<{ version: string }>;

  // celo-spender-app below version 1.2.3 used a different private key to validate erc20 token info.
  // this legacy version of the app also only supported celo type 0 transactions.
  // if you are reading this after celo moved to op based L2 those celo type 0 transactions will no longer work
  // so you can safely remove all the legacy paths.
  async verifyTokenInfo(to: string, chainId: number): Promise<void> {
    const isModern = await this.isAppModern();
    const tokenInfo = isModern
      ? tokenInfoByAddressAndChainId(to!, chainId!)
      : legacyTokenInfoByAddressAndChainId(to!, chainId!);

    if (tokenInfo) {
      // celo-spender-app below version 1.2.3 expected unprefixed hex strings only
      const dataString = isModern
        ? `0x${tokenInfo.data.toString("hex")}`
        : tokenInfo.data.toString("hex");

      await this.provideERC20TokenInformation(dataString);
    }
  }

  async determinePrice(txParams: CeloTx): Promise<void> {
    const isModern = await this.isAppModern();
    const {
      connection: { setFeeMarketGas, gasPrice },
    } = celoKit();

    if (isModern) {
      await setFeeMarketGas(txParams);
    } else {
      txParams.gasPrice = await gasPrice();
    }
  }

  async rlpEncodedTxForLedger(txParams: CeloTx): Promise<RLPEncodedTx | LegacyEncodedTx> {
    const isModern = await this.isAppModern();

    // if the app is of minimum version it doesnt matter if chain is cel2 or not
    if (isModern) {
      return rlpEncodedTx(txParams);
    } else {
      return encode_deprecated_celo_legacy_type_only_for_temporary_ledger_compat(txParams);
    }
  }

  private async isAppModern(): Promise<boolean> {
    if (!this.config) {
      this.config = this.getAppConfiguration();
    }

    return SemVer.satisfies((await this.config).version, ">= 1.2.3");
  }
}
