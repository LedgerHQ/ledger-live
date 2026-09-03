// Goal of this file is to inject all necessary device/signer dependency to coin-modules
import tronResolver from "./getAddress";
import { type Resolver } from "../../hw/getAddress/types";
import { createResolver } from "../../bridge/setup";
import { createSigner } from "./signer";

// No `bridge` export: Tron runs on the generic coin framework, which builds the account bridge from
// the Coin Module API (`coinModuleApi.ts`) plus the family hooks registered in
// `coin-modules/loaders.ts`. Only address resolution still needs a family-specific entry point.
const resolver: Resolver = createResolver(createSigner, tronResolver);

export { resolver };
