// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-icon/bridge/index";
import iconResolver from "@ledgerhq/coin-icon/hw-getAddress";
import { Transaction } from "@ledgerhq/coin-icon/types/index";
import Icon from "@ledgerhq/hw-app-icon";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { IconCoinConfig } from "@ledgerhq/coin-icon/config";
import invariant from "invariant";
import { getCurrencyConfiguration } from "../../config";

const createSigner: CreateSigner<Icon> = (transport: Transport) => {
  return new Icon(transport);
};

const getCurrencyConfig = (currencyId?: string): IconCoinConfig => {
  invariant(currencyId, "icon: currencyId is required in getCurrencyConfig");
  return getCurrencyConfiguration<IconCoinConfig>(currencyId);
};

const bridge: Bridge<Transaction> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, iconResolver);

export { bridge, resolver };
