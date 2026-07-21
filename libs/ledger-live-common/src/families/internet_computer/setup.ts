// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-internet_computer/bridge/index";
import Transport from "@ledgerhq/hw-transport";
import icpResolver from "@ledgerhq/coin-internet_computer/signer/index";
import { signMessage } from "@ledgerhq/coin-internet_computer/hw-signMessage";
import type { Account, Bridge } from "@ledgerhq/types-live";
import {
  CreateSigner,
  createMessageSigner,
  createResolver,
  executeWithSigner,
} from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { TransactionStatus, Transaction } from "@ledgerhq/coin-internet_computer/types/index";
import { DmkSignerICP } from "@ledgerhq/live-signer-icp";
import { isDmkTransport } from "../../hw/dmkUtils";
import { ICPSigner } from "./types";

const createSigner: CreateSigner<ICPSigner> = (transport: Transport): ICPSigner => {
  if (!isDmkTransport(transport)) {
    throw new Error("Internet Computer requires DMK transport");
  }
  return new DmkSignerICP(transport.dmk, transport.sessionId);
};

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const messageSigner = {
  signMessage: createMessageSigner(createSigner, signMessage),
};

const resolver: Resolver = createResolver(createSigner, icpResolver);

export { bridge, messageSigner, resolver };
