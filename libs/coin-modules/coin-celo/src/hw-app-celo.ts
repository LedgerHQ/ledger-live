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
import { decode, encode } from "rlp";

import SemVer from "semver";
import { LedgerEthTransactionResolution } from "@ledgerhq/hw-app-eth/lib/services/types";

/**
 * Heavily inspiried by celo-web-wallet
 * https://github.com/celo-tools/celo-web-wallet/blob/master/src/features/ledger/CeloLedgerApp.ts
 */
export default class Celo extends Eth {
  private config?: Promise<{ version: string }>;

  async signTransaction(
    path: string,
    rawTxHex: string,
    resolution?: LedgerEthTransactionResolution | null,
  ): Promise<{ s: string; v: string; r: string }> {
    if (await this.isAppModern()) {
      return super.signTransaction(path, rawTxHex, resolution);
    }
    return this.__dangerous__signTransactionLegacy(path, rawTxHex);
  }

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

  async determineFees(txParams: CeloTx): Promise<void> {
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

  /*
    @dev refers to if the app signing supports modern transactions like eip1559. if not it only can sign
        old celo-legacy transactions that no longer work on celo post L2 transition
   */
  async isAppModern(): Promise<boolean> {
    if (!this.config) {
      this.config = this.getAppConfiguration();
    }

    return SemVer.satisfies((await this.config).version, ">= 1.2.3");
  }

  // this works for celo-legacy
  // this is code written a long time ago in a galaxy far far away
  // do not touch (pretty please)
  // CAN BE REMOVED AFTER FEB 2025 (CELO L2 transition)
  private async __dangerous__signTransactionLegacy(
    path: string,
    rawTxHex: string,
  ): Promise<{
    s: string;
    v: string;
    r: string;
  }> {
    const paths = splitPath(path);
    const rawTx = Buffer.from(rawTxHex, "hex");
    let offset = 0;
    let response;

    const rlpTx = decode(rawTx);
    let rlpOffset = 0;
    // this seem specific to tx type
    if (rlpTx.length > 6) {
      const rlpVrs = encode(rlpTx.slice(-3));
      rlpOffset = rawTx.length - (rlpVrs.length - 1);
    }

    while (offset !== rawTx.length) {
      const first = offset === 0;
      const maxChunkSize = first ? 150 - 1 - paths.length * 4 : 150;
      let chunkSize = offset + maxChunkSize > rawTx.length ? rawTx.length - offset : maxChunkSize;
      if (rlpOffset != 0 && offset + chunkSize == rlpOffset) {
        // Make sure that the chunk doesn't end right on the EIP 155 marker if set
        chunkSize--;
      }
      const buffer = Buffer.alloc(first ? 1 + paths.length * 4 + chunkSize : chunkSize);
      if (first) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        rawTx.copy(buffer, 1 + 4 * paths.length, offset, offset + chunkSize);
      } else {
        rawTx.copy(buffer, 0, offset, offset + chunkSize);
      }
      response = await this.transport
        .send(0xe0, 0x04, first ? 0x00 : 0x80, 0x00, buffer)
        .catch(e => {
          throw e;
        });

      offset += chunkSize;
    }

    const v = response.slice(0, 1).toString("hex");
    const r = response.slice(1, 1 + 32).toString("hex");
    const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
    return { v, r, s };
  }
}

function splitPath(path: string): number[] {
  const result: number[] = [];
  const components = path.split("/");
  components.forEach(element => {
    let number = parseInt(element, 10);
    if (isNaN(number)) {
      return; // FIXME shouldn't it throws instead?
    }
    if (element.length > 1 && element[element.length - 1] === "'") {
      number += 0x80000000;
    }
    result.push(number);
  });
  return result;
}
