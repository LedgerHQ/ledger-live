import Eth from "@ledgerhq/hw-app-eth";
import ledgerServiceCelo from "./services/ledger";
/**
 * Heavily inspired by celo-web-wallet
 * https://github.com/celo-tools/celo-web-wallet/blob/master/src/features/ledger/CeloLedgerApp.ts
 */
export default class Celo extends Eth {
  constructor(
    transport: ConstructorParameters<typeof Eth>[0],
    scrambleKey?: ConstructorParameters<typeof Eth>[1],
    loadConfig?: ConstructorParameters<typeof Eth>[2],
  ) {
    super(transport, scrambleKey, loadConfig, ledgerServiceCelo);
  }

  async signTransaction(
    path: string,
    rawTxHex: string,
  ): Promise<{ s: string; v: string; r: string }> {
    // Resolve explicitly via the injected Celo ledger service so that
    // Eth.signTransaction does not emit its "missing resolution" deprecation
    // warning. On failure we fall back to blind signing (null), matching
    // Eth's own internal fallback behavior.
    const resolution = await this.ledgerService
      .resolveTransaction(rawTxHex, this.loadConfig, {
        externalPlugins: true,
        erc20: true,
        uniswapV3: false,
      })
      .catch(e => {
        console.warn(
          "hw-app-celo: resolveTransaction failed, falling back to blind signing: " + String(e),
        );
        return null;
      });
    return super.signTransaction(path, rawTxHex, resolution);
  }
}
