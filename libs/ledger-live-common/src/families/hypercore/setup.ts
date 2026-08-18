import evmResolver from "../evm/getAddress";
import { createResolver } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { createGetAddressSigner } from "./getAddressSigner";

// Only the address resolver: HyperCore has no send flow, so no message signer is exposed.
const resolver: Resolver = createResolver(createGetAddressSigner, evmResolver);

export { resolver };
