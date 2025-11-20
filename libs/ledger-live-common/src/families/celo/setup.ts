// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-celo/bridge";
import makeCliTools from "@ledgerhq/coin-celo/cli-transaction";
import evmResolver from "@ledgerhq/coin-evm/hw-getAddress";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { Transaction, CeloAccount } from "./types";
import { EvmSigner } from "@ledgerhq/coin-evm/types/signer";
import { type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DmkSignerEth, LegacySignerEth } from "@ledgerhq/live-signer-evm";

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

const bridge: Bridge<Transaction, CeloAccount> = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, evmResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
