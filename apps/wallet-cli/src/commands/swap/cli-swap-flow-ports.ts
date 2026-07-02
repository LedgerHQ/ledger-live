/**
 * CLI adapter for the shared `swapFlow` machine.
 *
 * The headless XState machine in `@ledgerhq/live-common/wallet-api/Exchange/swapFlow`
 * is generic over a `TIntent` runtime instance. Mobile binds that to its LWM
 * `Intent` (carrying a React component); the CLI binds it to a plain
 * discriminated union of "the input that the matching live-common Job needs".
 * The driver then picks the right Job, fabricates a `DeviceConnectionResult`
 * from the wallet-cli DMK transport, and forwards lifecycle events back to
 * the machine.
 */
import { buildProviderTransactionData } from "@ledgerhq/live-common/wallet-api/Exchange/dex/index";
import type { SwapFlowPorts } from "@ledgerhq/live-common/wallet-api/Exchange/swapFlow/index";
import type {
  BroadcastEvmIntentInput,
  SignApprovalEvmIntentInput,
  SignPermit2EvmIntentInput,
  SignSwapEvmIntentInput,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/index";
import { walletCliDebug } from "../../shared/log";
import type {
  SignRfqOrderIntentInput,
  SubmitRfqOrderIntentInput,
} from "@ledgerhq/live-common/wallet-api/Exchange/swapFlow/types";

export type CliInitInput = { readonly appName: string };

export const CLI_ETHEREUM_INIT_INPUT: CliInitInput = { appName: "Ethereum" };

export const CLI_INIT_INPUT: CliInitInput = CLI_ETHEREUM_INIT_INPUT;

export type CliSwapIntent =
  | { readonly kind: "sign-approval"; readonly input: SignApprovalEvmIntentInput }
  | { readonly kind: "sign-permit2"; readonly input: SignPermit2EvmIntentInput }
  | { readonly kind: "sign-swap"; readonly input: SignSwapEvmIntentInput }
  | { readonly kind: "broadcast"; readonly input: BroadcastEvmIntentInput };

export const CLI_SWAP_FLOW_PORTS: SwapFlowPorts<CliSwapIntent, CliInitInput> = {
  createSignApprovalIntent: input => ({
    intent: { kind: "sign-approval", input },
    initInput: CLI_ETHEREUM_INIT_INPUT,
  }),
  createSignPermit2Intent: input => ({
    intent: { kind: "sign-permit2", input },
    initInput: CLI_ETHEREUM_INIT_INPUT,
  }),
  createSignSwapIntent: ({ appName, ...input }) => ({
    intent: { kind: "sign-swap", input },
    initInput: { appName },
  }),
  createBroadcastIntent: ({ signedTxHex, currencyId, initInput }) => ({
    intent: { kind: "broadcast", input: { signedTxHex, currencyId } },
    initInput,
  }),
  buildSwapTransactionData: async ({ provider, context }) => {
    const startedAt = Date.now();
    walletCliDebug(
      `Requesting calldata from swap-api (provider=${provider}, amountFrom=${context.amountFrom.toFixed()}, slippage=${context.slippage})…`,
    );
    try {
      const { transactionData, appName } = await buildProviderTransactionData(provider, context);
      walletCliDebug(
        `Swap-api returned in ${Date.now() - startedAt}ms (appName=${appName}, to=${transactionData.to}, gasLimit=${transactionData.gasLimit})`,
      );
      return { transactionData, appName };
    } catch (err) {
      walletCliDebug(
        `Swap-api failed after ${Date.now() - startedAt}ms — ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`,
      );
      throw err;
    }
  },
  createSignRfqOrderIntent: function (input: SignRfqOrderIntentInput): {
    intent: CliSwapIntent;
    initInput: CliInitInput;
  } {
    throw new Error("Function not implemented.");
  },
  createSubmitRfqOrderIntent: function (
    input: SubmitRfqOrderIntentInput & { initInput: CliInitInput },
  ): { intent: CliSwapIntent; initInput: CliInitInput } {
    throw new Error("Function not implemented.");
  },
};
