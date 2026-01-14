// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import invariant from "invariant";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DmkSignerAleo } from "@ledgerhq/live-signer-aleo";
import { createBridges } from "@ledgerhq/coin-aleo/bridge/index";
import makeCliTools from "@ledgerhq/coin-aleo/test/cli";
import aleoResolver from "@ledgerhq/coin-aleo/signer/index";
import type { AleoSigner, Transaction as AleoTransaction } from "@ledgerhq/coin-aleo/types/index";
import type Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { type CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

type TransportWithDmk = Transport &
  Partial<{
    dmk: DeviceManagementKit;
    sessionId: string;
  }>;

const createSigner: CreateSigner<AleoSigner> = (transport: TransportWithDmk) => {
  invariant(transport.dmk, "aleo: transport.dmk is missing");
  invariant(transport.sessionId, "aleo: transport.sessionId is missing");
  return new DmkSignerAleo(transport.dmk, transport.sessionId);
};

const bridge: Bridge<AleoTransaction> = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, aleoResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
