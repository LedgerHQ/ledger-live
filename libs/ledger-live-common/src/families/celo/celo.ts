import Eth from "@ledgerhq/hw-app-eth";
import {
  tokenInfoByAddressAndChainId,
  legacyTokenInfoByAddressAndChainId,
} from "@celo/wallet-ledger/lib/tokens";

import SemVer from "semver";

export default class Celo extends Eth {
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

  private async isAppModern(): Promise<boolean> {
    const { version } = await this.getAppConfiguration();

    return SemVer.statisfy(version, ">= 1.2.3");
  }
}
