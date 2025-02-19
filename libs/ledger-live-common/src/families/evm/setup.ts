// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-evm/bridge/js";
import makeCliTools from "@ledgerhq/coin-evm/cli-transaction";
import evmResolver from "@ledgerhq/coin-evm/hw-getAddress";
import { prepareMessageToSign, signMessage } from "@ledgerhq/coin-evm/hw-signMessage";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import {
  CreateSigner,
  createMessageSigner,
  createResolver,
  executeWithSigner,
} from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { getCurrencyConfiguration } from "../../config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DmkSignerEth, LegacySignerEth } from "@ledgerhq/live-signer-evm";
import { EvmSigner } from "@ledgerhq/coin-evm/lib/types/signer";

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

const getCurrencyConfig = (currency: CryptoCurrency) => {
  return { info: getCurrencyConfiguration<EvmConfigInfo>(currency) };
};

const bridge: Bridge<EvmTransaction> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const messageSigner = {
  prepareMessageToSign,
  signMessage: createMessageSigner(createSigner, signMessage),
};

const resolver: Resolver = createResolver(createSigner, evmResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver, messageSigner };
