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
import { CreateSigner, executeWithSigner } from "../../bridge/setup";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";

export type Signer = {
  getAddress: (
    path: string,
    options?: boolean | { verify?: boolean; derivationMode?: string },
    boolChaincode?: boolean,
    chainId?: string,
  ) => Promise<EvmAddress>;
  signTransaction: (path: string, tx: string, domain?: DomainServiceResolution) => Promise<string>;
};

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

export const createSigner: CreateSigner<Signer> = (transport: Transport) => {
  const signer = createLiveSigner(transport);

  return {
    getAddress: async (
      path: string,
      options?: boolean | { verify?: boolean; derivationMode?: string },
      boolChaincode?: boolean,
      chainId?: string,
    ) => {
      const display = typeof options === "boolean" ? options : Boolean(options?.verify);
      return boolChaincode === undefined && chainId === undefined
        ? signer.getAddress(path, display)
        : signer.getAddress(path, display, boolChaincode, chainId);
    },
    signTransaction: async (path, tx, domain) => {
      // Configure type of resolutions necessary for the clear signing
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

      signer.setLoadConfig(loadConfig);

      const observable = signer.clearSignTransaction(path, tx.substring(2), resolutionConfig, true);
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

export default {
  context,
  getAddress: resolver(context),
} satisfies CoinFrameworkSigner;
