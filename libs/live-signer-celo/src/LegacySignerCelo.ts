import Celo from "@ledgerhq/hw-app-celo";
import type Transport from "@ledgerhq/hw-transport";
import { UpdateYourApp } from "@ledgerhq/errors";
import { CeloSigner } from "@ledgerhq/coin-celo/signer";
import { LoadConfig, ResolutionConfig } from "@ledgerhq/hw-app-eth/services/types";
import { EIP712Message } from "@ledgerhq/types-live";
import {
  CELO_MANAGER_APP_NAME,
  CELO_MULTIPATH_MIN_VERSION,
  isUnauthorizedPathError,
  isVersionBelow,
} from "./deviceAuthorization";

export class LegacySignerCelo implements CeloSigner {
  private readonly signer: Celo;

  constructor(transport: Transport) {
    this.signer = new Celo(transport);
  }

  setLoadConfig(loadConfig: LoadConfig): void {
    this.signer.setLoadConfig(loadConfig);
  }

  async getAddress(path: string, boolDisplay?: boolean, boolChaincode?: boolean, chainId?: string) {
    try {
      return await this.signer.getAddress(path, boolDisplay, boolChaincode, chainId);
    } catch (e) {
      // Path rejected by an app too old to authorize it → surface a semantic
      // "update your app" instead of the raw 0x6a15. The version read is
      // best-effort on the same open transport: if it fails we fall through and
      // rethrow the original error, never masking it (and a 0x6a15 from a
      // current app also passes through unchanged).
      if (isUnauthorizedPathError(e)) {
        const version = await this.signer
          .getAppConfiguration()
          .then(config => config.version)
          .catch(() => undefined);
        if (version !== undefined && isVersionBelow(version, CELO_MULTIPATH_MIN_VERSION)) {
          throw new UpdateYourApp(undefined, { managerAppName: CELO_MANAGER_APP_NAME });
        }
      }
      throw e;
    }
  }

  signTransaction(path: string, rawTxHex: string) {
    return this.signer.signTransaction(path, rawTxHex);
  }

  signPersonalMessage(path: string, messageHex: string) {
    return this.signer.signPersonalMessage(path, messageHex);
  }

  signEIP712Message(path: string, jsonMessage: EIP712Message, fullImplem?: boolean) {
    return this.signer.signEIP712Message(path, jsonMessage, fullImplem);
  }

  signEIP712HashedMessage(path: string, domainSeparatorHex: string, hashStructMessageHex: string) {
    return this.signer.signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex);
  }

  clearSignTransaction(
    path: string,
    rawTxHex: string,
    resolutionConfig: ResolutionConfig,
    throwOnError: boolean,
  ) {
    return this.signer.clearSignTransaction(path, rawTxHex, resolutionConfig, throwOnError);
  }
}
