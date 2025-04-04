// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { DerivationType, LedgerSigner } from "@taquito/ledger-signer";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { TezosCoinConfig } from "@ledgerhq/coin-tezos/config";
import { createBridges, type TezosBridge } from "@ledgerhq/coin-tezos/bridge/index";
import type { TezosSigner } from "@ledgerhq/coin-tezos/types/index";
import makeCliTools from "@ledgerhq/coin-tezos/test/cli";
import type { CliTools } from "@ledgerhq/coin-tezos/test/cli";
import tezosResolver from "@ledgerhq/coin-tezos/signer/index";
import Xtz, { Curve } from "@ledgerhq/hw-app-tezos";
import Transport from "@ledgerhq/hw-transport";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";

const createSigner: CreateSigner<TezosSigner> = (transport: Transport) => {
  const xtz = new Xtz(transport);

  return {
    getAddress: (
      path: string,
      options: {
        verify?: boolean;
        curve?: Curve;
        ins?: number;
      },
    ) => xtz.getAddress(path, options),
    signOperation: (
      path: string,
      rawTxHex: string,
      options: {
        curve?: Curve;
      },
    ) => xtz.signOperation(path, rawTxHex, options),
    // Tezos [LedgerSigner](https://www.npmjs.com/package/@taquito/ledger-signer)
    createLedgerSigner: (path: string, prompt: boolean, derivationType: DerivationType) => {
      return new LedgerSigner(transport, path, prompt, derivationType);
    },
  };
};

const getCurrencyConfig = (): TezosCoinConfig => {
  return getCurrencyConfiguration(getCryptoCurrencyById("tezos"));
};

const bridge: TezosBridge = createBridges(executeWithSigner(createSigner), getCurrencyConfig);

const resolver: Resolver = createResolver(createSigner, tezosResolver);

const cliTools: CliTools = makeCliTools();

export { bridge, cliTools, resolver };
