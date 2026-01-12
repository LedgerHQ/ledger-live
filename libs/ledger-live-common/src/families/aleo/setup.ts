// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import invariant from "invariant";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { DmkSignerAleo } from "@ledgerhq/live-signer-aleo";
import { createBridges } from "@ledgerhq/coin-aleo/bridge/index";
import type { AleoCoinConfig } from "@ledgerhq/coin-aleo/config";
import makeCliTools from "@ledgerhq/coin-aleo/test/cli";
import aleoAddressResolver from "@ledgerhq/coin-aleo/signer/getAddress";
import aleoViewKeyResolver from "@ledgerhq/coin-aleo/signer/getViewKey";
import type {
  AleoAccount,
  AleoSigner,
  Transaction as AleoTransaction,
} from "@ledgerhq/coin-aleo/types/index";
import type Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { createResolver, executeWithSigner, type CreateSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { createViewKeyResolver } from "./hw/getViewKey/resolver";

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

const getCurrencyConfig = (currency?: CryptoCurrency) => {
  invariant(currency, "aleo: currency is required in getCurrencyConfig");
  return getCurrencyConfiguration<AleoCoinConfig>(currency);
};

const bridge: Bridge<AleoTransaction, AleoAccount> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver = createResolver(createSigner, aleoAddressResolver);
const viewKeyResolver = createViewKeyResolver(createSigner, aleoViewKeyResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver, viewKeyResolver };
