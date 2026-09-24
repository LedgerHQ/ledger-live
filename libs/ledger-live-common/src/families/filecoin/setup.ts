// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-filecoin/index";
import type { FilecoinCoinConfig } from "@ledgerhq/coin-filecoin/config";
import Transport from "@ledgerhq/hw-transport";
import { FilecoinApp } from "@zondax/ledger-filecoin";
import filecoinResolver from "@ledgerhq/coin-filecoin/signer/index";
import { signMessage } from "@ledgerhq/coin-filecoin/hw-signMessage";
import type { Account, Bridge } from "@ledgerhq/types-live";
import {
  CreateSigner,
  createMessageSigner,
  createResolver,
  executeWithSigner,
} from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { Resolver } from "../../hw/getAddress/types";
import { TransactionStatus, Transaction, FilecoinSigner } from "./types";
import { getPath } from "./common";

const createSigner: CreateSigner<FilecoinSigner> = (transport: Transport) => {
  const filecoin = new FilecoinApp(transport);
  return {
    showAddressAndPubKey: (path: string) => filecoin.showAddressAndPubKey(getPath(path)),
    getAddressAndPubKey: (path: string) => filecoin.getAddressAndPubKey(getPath(path)),
    sign: (path: string, message: Uint8Array) => filecoin.sign(getPath(path), Buffer.from(message)),
  };
};

const getCoinConfig = (): FilecoinCoinConfig =>
  getCurrencyConfiguration<FilecoinCoinConfig>("filecoin");

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCoinConfig,
);

const messageSigner = {
  signMessage: createMessageSigner(createSigner, signMessage),
};

const resolver: Resolver = createResolver(createSigner, filecoinResolver);

export { bridge, messageSigner, resolver };
