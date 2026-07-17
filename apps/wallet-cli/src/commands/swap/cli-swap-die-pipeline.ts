import { Subscription, type Observable } from "rxjs";
import { createActor } from "xstate";
import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult, DeviceExtractedContext } from "@ledgerhq/device-intent";
import {
  createSwapFlowMachine,
  planSwapFlow,
  type SwapFlowPlan,
  type SwapFlowResolvers,
  type SwapFlowResult,
} from "@ledgerhq/live-common/wallet-api/Exchange/swapFlow/index";
import type { Quote } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/types";
import {
  DEFAULT_DEX_GAS_LIMIT,
  DEFAULT_DEX_GAS_LIMIT_MULTIPLIER,
} from "@ledgerhq/live-common/wallet-api/Exchange/dex/index";
import {
  broadcastEvmJob,
  signApprovalEvmJob,
  signPermit2EvmJob,
  signSwapEvmJob,
  type BroadcastEvmJobState,
  type SignApprovalEvmJobState,
  type SignPermit2EvmJobState,
  type SignSwapEvmJobState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/index";
import type { Account } from "@ledgerhq/types-live";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import {
  ensureWalletCliDmkTransport,
  getWalletCliDeviceModelId,
  WALLET_CLI_DMK_DEVICE_ID,
} from "../../device/register-dmk-transport";
import { connectLedgerApp } from "../../device/connect-ledger-app";
import { withLedgerManagerAppSession } from "../../session/exchange-device-session";
import type { CommandOutput } from "../../output";
import { walletCliDebug } from "../../shared/log";
import { WalletCliDeviceError } from "../../device/wallet-cli-device-error";
import {
  trackSwapCompleted,
  trackSwapRejected,
  trackSwapStarted,
} from "../../analytics/swap-analytics";
import {
  CLI_ETHEREUM_INIT_INPUT,
  CLI_SWAP_FLOW_PORTS,
  type CliInitInput,
  type CliSwapIntent,
} from "./cli-swap-flow-ports";

const ETHEREUM_APP_NAME = CLI_ETHEREUM_INIT_INPUT.appName;

const STUB_DEVICE_EXTRACTED_CONTEXT: DeviceExtractedContext = {
  currentOsVersion: "",
  osUpdateAvailable: false,
  currentAppName: ETHEREUM_APP_NAME,
  currentAppVersion: "",
};

type AnyJobState =
  | SignApprovalEvmJobState
  | SignPermit2EvmJobState
  | SignSwapEvmJobState
  | BroadcastEvmJobState;

export type CliSwapDieInput = {
  out: CommandOutput;
  quote: Quote;
  mainAccount: Account;
  fromCurrencyId: string | undefined;
  toCurrencyId: string | undefined;
  flowId?: string;
  feeStrategy?: string;
};

export type CliSwapDieResult = {
  plan: SwapFlowPlan["kind"];
  skipReason?: string;
  result: SwapFlowResult;
};

function buildDeviceConnectionResult(
  dmk: DeviceManagementKit,
  sessionId: string,
  compatDeviceModelId: DeviceModelId,
): DeviceConnectionResult {
  const connectedDevice: ConnectedDevice = dmk.getConnectedDevice({ sessionId });
  return {
    dmk,
    sessionId,
    connectedDevice,
    compatDeviceId: WALLET_CLI_DMK_DEVICE_ID,
    compatDeviceModelId,
    compatDeviceName: connectedDevice.name,
    compatDeviceWired: connectedDevice.type === "USB",
  };
}

const SIGN_INTENT_KINDS = new Set<CliSwapIntent["kind"]>([
  "sign-approval",
  "sign-permit2",
  "sign-swap",
]);

const RFQ_PLAN_KINDS = new Set<SwapFlowPlan["kind"]>(["rfq-order", "approval-then-rfq-order"]);

function launchIntent(args: {
  intent: CliSwapIntent;
  initInput: CliInitInput | null;
  ensureApp: (appName: string) => Promise<void>;
  deviceConnectionResult: DeviceConnectionResult;
  out: CommandOutput;
  send: (
    event:
      | { type: "JOB_SIGNED"; signedTxHex: string }
      | { type: "JOB_PERMIT_SIGNED"; signatureHex: string }
      | { type: "JOB_CONFIRMED"; hash: string }
      | { type: "JOB_FAILED"; error: Error }
      | { type: "JOB_ERROR"; error: Error },
  ) => void;
}): Subscription {
  const { intent, initInput, ensureApp, deviceConnectionResult, out, send } = args;
  out.swapExecuteProgress(`Launching ${intent.kind}`);

  const observable: Observable<AnyJobState> = (() => {
    switch (intent.kind) {
      case "sign-approval":
        return signApprovalEvmJob({
          deviceConnectionResult,
          deviceExtractedContext: STUB_DEVICE_EXTRACTED_CONTEXT,
          input: intent.input,
        });
      case "sign-permit2":
        return signPermit2EvmJob({
          deviceConnectionResult,
          deviceExtractedContext: STUB_DEVICE_EXTRACTED_CONTEXT,
          input: intent.input,
        });
      case "sign-swap":
        return signSwapEvmJob({
          deviceConnectionResult,
          deviceExtractedContext: STUB_DEVICE_EXTRACTED_CONTEXT,
          input: intent.input,
        });
      default:
        return broadcastEvmJob({
          deviceConnectionResult,
          deviceExtractedContext: STUB_DEVICE_EXTRACTED_CONTEXT,
          input: intent.input,
        });
    }
  })();

  const observer = {
    next: (state: AnyJobState) => {
      walletCliDebug(`${intent.kind} state: ${state.type}`);
      switch (state.type) {
        case "awaiting-confirmation":
          out.swapExecuteProgress(`Confirm ${intent.kind} on device…`);
          break;
        case "signed":
          if ("signedTxHex" in state) {
            send({ type: "JOB_SIGNED", signedTxHex: state.signedTxHex });
          } else if ("signatureHex" in state) {
            send({ type: "JOB_PERMIT_SIGNED", signatureHex: state.signatureHex });
          }
          break;
        case "broadcasted":
          out.swapExecuteProgress(`Broadcasted ${state.hash};`);
          break;
        case "confirmed":
          send({ type: "JOB_CONFIRMED", hash: state.hash });
          break;
        case "failed":
          send({ type: "JOB_FAILED", error: state.error });
          break;
        default:
          break;
      }
    },
    error: (err: unknown) => {
      send({
        type: "JOB_ERROR",
        error: err instanceof Error ? err : new Error(String(err)),
      });
    },
  };

  const needsAppSwitch = SIGN_INTENT_KINDS.has(intent.kind) && initInput != null;
  if (!needsAppSwitch) {
    return observable.subscribe(observer);
  }

  let innerSub: Subscription | undefined;
  let cancelled = false;
  const wrapper = new Subscription(() => {
    cancelled = true;
    innerSub?.unsubscribe();
  });

  void (async () => {
    try {
      await ensureApp(initInput.appName);
      if (cancelled) return;
      innerSub = observable.subscribe(observer);
    } catch (err) {
      if (cancelled) return;
      send({
        type: "JOB_ERROR",
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  })();

  return wrapper;
}

export async function runCliSwapDie(input: CliSwapDieInput): Promise<CliSwapDieResult> {
  const { out, quote, mainAccount, fromCurrencyId, toCurrencyId, flowId, feeStrategy } = input;

  if (mainAccount.currency.family !== "evm") {
    throw new Error(
      `This swap requires an EVM source account (got ${mainAccount.currency.family})`,
    );
  }

  const plan = planSwapFlow({
    quote,
    fromAccountId: "",
    toAccountId: "",
    fromAccountAddress: mainAccount.freshAddress,
    fromCurrencyId,
    toCurrencyId,
    defaultGasLimit: DEFAULT_DEX_GAS_LIMIT,
    gasLimitMultiplier: DEFAULT_DEX_GAS_LIMIT_MULTIPLIER,
  });

  if (plan.kind === "skip") {
    return { plan: "skip", skipReason: plan.reason, result: {} };
  }

  if (RFQ_PLAN_KINDS.has(plan.kind)) {
    return {
      plan: "skip",
      skipReason: `rfq-plan-unsupported-in-cli (${plan.kind})`,
      result: {},
    };
  }

  const trackingFromCurrency = fromCurrencyId ?? mainAccount.currency.id;
  const trackingToCurrency = toCurrencyId ?? "";
  let hardwareWalletType: DeviceModelId | undefined;

  if (flowId) {
    trackSwapStarted({
      flowId,
      fromCurrency: trackingFromCurrency,
      toCurrency: trackingToCurrency,
      provider: quote.provider,
      feeStrategy: feeStrategy ?? "",
    });
  }

  try {
    const result = await withLedgerManagerAppSession(ETHEREUM_APP_NAME, async () => {
      const transport = await ensureWalletCliDmkTransport();
      const deviceModelId = await getWalletCliDeviceModelId();
      if (!deviceModelId) {
        throw new Error("Could not resolve the connected device model id");
      }
      hardwareWalletType = deviceModelId;
      const deviceConnectionResult = buildDeviceConnectionResult(
        transport.dmk,
        transport.sessionId,
        deviceModelId,
      );

      let currentApp = ETHEREUM_APP_NAME;
      const ensureApp = async (appName: string): Promise<void> => {
        if (appName === currentApp) return;
        out.swapExecuteProgress(
          `Switching device app: ${currentApp} → ${appName} (confirm "Open ${appName}" on device)…`,
        );
        walletCliDebug(`Switching device app: ${currentApp} → ${appName}`);
        await connectLedgerApp(transport.dmk, transport.sessionId, appName);
        currentApp = appName;
      };

      const machine = createSwapFlowMachine(CLI_SWAP_FLOW_PORTS);
      const actor = createActor(machine, { input: undefined }).start();

      const launched = new WeakSet<CliSwapIntent>();
      const subscriptions: Subscription[] = [];

      try {
        return await new Promise<SwapFlowResult>((resolve, reject) => {
          const resolvers: SwapFlowResolvers = {
            resolve,
            reject: err => {
              walletCliDebug("Pipeline error:", err);
              reject(err);
            },
          };

          const send = (event: Parameters<typeof actor.send>[0]): void => {
            actor.send(event);
          };

          const actorSub = actor.subscribe(snapshot => {
            const { currentIntent, currentInitInput } = snapshot.context as {
              currentIntent: CliSwapIntent | null;
              currentInitInput: CliInitInput | null;
            };
            if (currentIntent && !launched.has(currentIntent)) {
              launched.add(currentIntent);
              subscriptions.push(
                launchIntent({
                  intent: currentIntent,
                  initInput: currentInitInput,
                  ensureApp,
                  deviceConnectionResult,
                  out,
                  send,
                }),
              );
            }

            if (snapshot.matches("approvalSuccess")) {
              send({ type: "SWAP_PRESSED" });
            } else if (snapshot.matches("swapSuccess")) {
              send({ type: "SWAP_DISMISSED" });
            }
          });
          subscriptions.push(new Subscription(() => actorSub.unsubscribe()));

          actor.send({
            type: "START",
            input: {
              plan,
              mainAccount,
              currencyId: mainAccount.currency.id,
              derivationPath: mainAccount.freshAddressPath,
              initInput: CLI_ETHEREUM_INIT_INPUT,
              resolvers,
            },
          });
        });
      } finally {
        for (const sub of subscriptions) {
          try {
            sub.unsubscribe();
          } catch {
            /* empty */
          }
        }
        actor.stop();
      }
    });

    if (flowId) {
      trackSwapCompleted({
        flowId,
        fromCurrency: trackingFromCurrency,
        toCurrency: trackingToCurrency,
        provider: quote.provider,
        fromAmount: String(quote.quoteDetails.sendAmount),
        toAmount: String(quote.quoteDetails.receiveAmount),
      });
    }

    return { plan: plan.kind, result };
  } catch (error) {
    if (flowId && WalletCliDeviceError.fromKnownDeviceError(error)?.state.code === "rejected") {
      trackSwapRejected({
        flowId,
        fromCurrency: trackingFromCurrency,
        toCurrency: trackingToCurrency,
        device: hardwareWalletType,
      });
    }
    throw error;
  }
}

export type { Quote };
