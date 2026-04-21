// ─── api ──────────────────────────────────────────────────────────────────────
import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../../config";

// ─── signer ───────────────────────────────────────────────────────────────────
import { filter, firstValueFrom } from "rxjs";
import { EvmAddress, EvmSignature, EvmSigner } from "@ledgerhq/coin-evm/types/signer";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DmkSignerEth, LegacySignerEth } from "@ledgerhq/live-signer-evm";
import Transport from "@ledgerhq/hw-transport";
import { getEnv } from "@ledgerhq/live-env";
import { ResolutionConfig, LoadConfig } from "@ledgerhq/hw-app-eth/services/types";
import { Signature } from "ethers";
import type { DomainServiceResolution } from "@ledgerhq/types-live";
import resolver from "@ledgerhq/coin-evm/hw-getAddress";
import { CreateSigner, executeWithSigner } from "../../setup";
import type { AlpacaSigner } from "../types";

// ─── bridge (no coin-* violations — re-export) ────────────────────────────────
export { default as bridge } from "../families/evm/bridge";

export function createApi(currencyId: string): AlpacaApi<any> & BridgeApi {
  return createEvmApi(
    getCurrencyConfiguration<EvmConfigInfo>(currencyId),
    currencyId,
  ) as unknown as AlpacaApi<any> & BridgeApi;
}

const isDmkTransport = (
  transport: Transport,
): transport is Transport & { dmk: DeviceManagementKit; sessionId: string } => {
  return (
    "dmk" in transport &&
    transport.dmk !== undefined &&
    "sessionId" in transport &&
    transport.sessionId !== undefined
  );
};

const createLiveSigner: CreateSigner<EvmSigner> = (transport: Transport) => {
  if (isDmkTransport(transport)) {
    return new DmkSignerEth(transport.dmk, transport.sessionId);
  }
  return new LegacySignerEth(transport);
};

export type Signer = {
  getAddress: (
    path: string,
    options?: boolean | { verify?: boolean; derivationMode?: string },
    boolChaincode?: boolean,
    chainId?: string,
  ) => Promise<EvmAddress>;
  signTransaction: (path: string, tx: string, domain?: DomainServiceResolution) => Promise<string>;
};

export const createSigner: CreateSigner<Signer> = (transport: Transport) => {
  const liveSigner = createLiveSigner(transport);
  return {
    getAddress: async (path, options?, boolChaincode?, chainId?) => {
      const display = typeof options === "boolean" ? options : Boolean(options?.verify);
      return boolChaincode === undefined && chainId === undefined
        ? liveSigner.getAddress(path, display)
        : liveSigner.getAddress(path, display, boolChaincode, chainId);
    },
    signTransaction: async (path, tx, domain) => {
      const resolutionConfig: ResolutionConfig = {
        externalPlugins: true,
        erc20: true,
        nft: false,
        uniswapV3: true,
        domains: domain && [domain],
      };
      const loadConfig: LoadConfig = {
        cryptoassetsBaseURL: getEnv("DYNAMIC_CAL_BASE_URL"),
        nftExplorerBaseURL: getEnv("NFT_METADATA_SERVICE") + "/v1/ethereum",
      };
      liveSigner.setLoadConfig(loadConfig);
      const observable = liveSigner.clearSignTransaction(
        path,
        tx.substring(2),
        resolutionConfig,
        true,
      );
      const event = observable.pipe(
        filter((event): event is { type: "signer.evm.signed"; value: EvmSignature } => {
          return event.type === "signer.evm.signed";
        }),
      );
      const { value } = await firstValueFrom(event);
      return Signature.from({
        r: "0x" + value.r,
        s: "0x" + value.s,
        v: typeof value.v === "number" ? value.v : parseInt(value.v, 16),
      }).serialized;
    },
  };
};

const context = executeWithSigner(createSigner);

export const signer = {
  context,
  getAddress: resolver(context),
} satisfies AlpacaSigner;
