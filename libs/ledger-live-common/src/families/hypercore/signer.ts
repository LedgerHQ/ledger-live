import evmResolver from "../evm/getAddress";
import { executeWithSigner } from "../../bridge/setup";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { createGetAddressSigner } from "./getAddressSigner";

const context = executeWithSigner(createGetAddressSigner);

// getAddress only: HyperCore never signs (no send), so no signTransaction is wired.
export default {
  context,
  getAddress: evmResolver(context),
} satisfies CoinFrameworkSigner;
