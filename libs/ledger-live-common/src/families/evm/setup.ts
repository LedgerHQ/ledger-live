// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import makeCliTools from "@ledgerhq/coin-evm/cli-transaction";
import evmResolver from "@ledgerhq/coin-evm/hw-getAddress";
import { prepareMessageToSign, signMessage } from "@ledgerhq/coin-evm/hw-signMessage";
import { CreateSigner, createMessageSigner, createResolver } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import Transport from "@ledgerhq/hw-transport";
import { type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DmkSignerEth, LegacySignerEth } from "@ledgerhq/live-signer-evm";
import { EvmSigner } from "@ledgerhq/coin-evm/types/signer";
import { getCryptoAssetsStore } from "../../bridge/crypto-assets";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setShouldSkipTokenLoading } from "@ledgerhq/coin-evm/bridge/preload";
import { setCryptoAssetsStoreGetter } from "@ledgerhq/coin-evm/cryptoAssetsStore";

try {
  const isCALLazyLoadingEnabled = LiveConfig.getValueByKey("feature_cal_lazy_loading") === "true";
  setShouldSkipTokenLoading(Boolean(isCALLazyLoadingEnabled));
} catch (error) {
  setShouldSkipTokenLoading(false);
}

const createSigner: CreateSigner<EvmSigner> = (transport: Transport) => {
  if (isDmkTransport(transport)) {
    return new DmkSignerEth(transport.dmk, transport.sessionId);
  }

  return new LegacySignerEth(transport);
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

const messageSigner = {
  prepareMessageToSign,
  signMessage: createMessageSigner(createSigner, signMessage),
};

setCryptoAssetsStoreGetter(getCryptoAssetsStore);

const resolver: Resolver = createResolver(createSigner, evmResolver);

const cliTools = makeCliTools();

export { cliTools, resolver, messageSigner };
