// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import makeCliTools from "@ledgerhq/coin-evm/cli-transaction";
import evmResolver from "@ledgerhq/coin-evm/hw-getAddress";
import { prepareMessageToSign, signMessage } from "@ledgerhq/coin-evm/hw-signMessage";
import { CreateSigner, createMessageSigner, createResolver } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import Transport from "@ledgerhq/hw-transport";
import { type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DmkSignerEth } from "@ledgerhq/live-signer-evm";
import { EvmSigner } from "@ledgerhq/coin-evm/types/signer";
import invariant from "invariant";

const createSigner: CreateSigner<EvmSigner> = (
  transport: Transport & Partial<{ dmk: DeviceManagementKit; sessionId: string }>,
) => {
  invariant(transport.dmk, "evm: transport.dmk is missing");
  invariant(transport.sessionId, "evm: transport.sessionId is missing");
  return new DmkSignerEth(transport.dmk, transport.sessionId);

  // if (isDmkTransport(transport)) {
  //   return new DmkSignerEth(transport.dmk, transport.sessionId);
  // }

  // return new LegacySignerEth(transport);
};

// const isDmkTransport = (
//   transport: Transport,
// ): transport is Transport & { dmk: DeviceManagementKit; sessionId: string } => {
//   return (
//     "dmk" in transport &&
//     transport.dmk !== undefined &&
//     "sessionId" in transport &&
//     transport.sessionId !== undefined
//   );
// };

const messageSigner = {
  prepareMessageToSign,
  signMessage: createMessageSigner(createSigner, signMessage),
};

const resolver: Resolver = createResolver(createSigner, evmResolver);

const cliTools = makeCliTools();

export { cliTools, resolver, messageSigner };
