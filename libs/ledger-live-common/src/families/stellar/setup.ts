// Goal of this file is to inject all necessary device/signer dependency to coin-modules
import makeCliTools from "@ledgerhq/coin-stellar/test/cli";
import stellarResolver from "@ledgerhq/coin-stellar/signer/index";
import Stellar from "@ledgerhq/hw-app-str";
import Transport from "@ledgerhq/hw-transport";
import { CreateSigner, createResolver } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Stellar> = (transport: Transport) => {
  return new Stellar(transport);
};

const resolver: Resolver = createResolver(createSigner, stellarResolver);

const cliTools = makeCliTools();

export { cliTools, resolver };
