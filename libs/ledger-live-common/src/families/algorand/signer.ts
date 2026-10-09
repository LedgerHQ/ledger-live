import resolver from "@ledgerhq/coin-algorand/hw-getAddress";
import Algorand from "@ledgerhq/hw-app-algorand";
import type Transport from "@ledgerhq/hw-transport";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { CreateSigner, executeWithSigner } from "../../bridge/setup";

const SW_CANCEL = "6986";

type AlgorandFrameworkSigner = Algorand & {
  getAddress: (
    path: string,
    options?: boolean | { verify?: boolean; derivationMode?: string },
  ) => Promise<{ publicKey: string; address: string }>;
  signTransaction: (path: string, transaction: string) => Promise<string>;
};

export const createSigner: CreateSigner<AlgorandFrameworkSigner> = (transport: Transport) => {
  const algorand = new Algorand(transport);
  const getAddress = algorand.getAddress.bind(algorand);
  return Object.assign(algorand, {
    // The framework passes `{ derivationMode }` when signing: forwarded as-is it is truthy and the
    // device would ask to confirm the address before every signature.
    getAddress: (path: string, options?: boolean | { verify?: boolean }) =>
      getAddress(path, typeof options === "boolean" ? options : !!options?.verify),
    signTransaction: async (path: string, transaction: string) => {
      const { signature } = await algorand.sign(path, transaction);
      // hw-app-algorand accepts SW_CANCEL as a success status and its own refusal check never
      // matches, so a refusal comes back as the bare status word.
      if (!signature || signature.toString("hex") === SW_CANCEL) {
        throw new UserRefusedOnDevice();
      }
      return signature.toString("hex");
    },
  });
};

const context = executeWithSigner(createSigner);

export default {
  context,
  getAddress: resolver(context),
} satisfies CoinFrameworkSigner;
