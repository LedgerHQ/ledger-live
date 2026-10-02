// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import {
  PolkadotAccount,
  TransactionStatus,
  createBridges,
  type Transaction,
} from "@ledgerhq/coin-polkadot";
import type { PolkadotSigner } from "@ledgerhq/coin-polkadot/types/signer";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import type { PolkadotCoinConfig } from "@ledgerhq/coin-polkadot/config";
import polkadotResolver from "@ledgerhq/coin-polkadot/signer/index";
import { DmkSignerPolkadot, LegacySignerPolkadot } from "@ledgerhq/live-signer-polkadot";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import { isDmkTransport } from "../../hw/dmkUtils";

let _polkadotLdmkFFEnabled: boolean = false;

export const setPolkadotLdmkEnabled = (enabled: boolean): void => {
  _polkadotLdmkFFEnabled = enabled;
};

export const createSigner: CreateSigner<PolkadotSigner> = (transport: Transport) => {
  if (isDmkTransport(transport) && _polkadotLdmkFFEnabled) {
    return new DmkSignerPolkadot(transport.dmk, transport.sessionId);
  }
  return new LegacySignerPolkadot(transport);
};

const bridge: Bridge<Transaction, PolkadotAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  buildContext<PolkadotCoinConfig>("polkadot"),
);

const resolver: Resolver = createResolver(createSigner, polkadotResolver);

export { bridge, resolver };
