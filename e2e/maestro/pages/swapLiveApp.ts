import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { FlowBuilder } from "../runtime/flowBuilder";
import { MaestroCommand } from "../runtime/maestro";

export type CurrencyField = "from" | "to";

export function selectableSwapProviders(): SwapProvider[] {
  const providers = Object.values(SwapProvider).filter(
    (p): p is SwapProvider => p instanceof SwapProvider,
  );
  const candidates = providers.filter(
    p => !p.kyc && !p.app && p.uiName !== SwapProvider.LIFI.uiName,
  );
  if (candidates.length === 0) {
    throw new Error("[swap-live-app] No non-KYC native providers configured");
  }
  return candidates;
}

const SWAP_LABELS = {
  coinSelector: "Select Currency or Token",
  viewQuotesButton: "View quotes",
  quotesFound: "[0-9]+ quotes? found",
  keyboardReady: "25%",
} as const;

const COIN_SELECTOR_INDEX: Record<CurrencyField, number> = { from: 0, to: 1 };

function text(value: string) {
  return { text: value };
}

function escapeTextRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function providerNameSelector(provider: SwapProvider): { text: string } {
  return text(escapeTextRegex(provider.uiName));
}

function executeButtonLabel(provider: SwapProvider): { text: string } {
  return text(`Swap with ${escapeTextRegex(provider.uiName)}`);
}

export class SwapLiveApp {
  constructor(private readonly flow: FlowBuilder) {}

  waitReady(): Promise<void> {
    this.flow.add({ extendedWaitUntil: { visible: text(SWAP_LABELS.coinSelector) } });
    return Promise.resolve();
  }

  expectSwapLiveApp(): Promise<void> {
    this.flow.addStep("swap-live-app-loaded", [
      { extendedWaitUntil: { visible: text(SWAP_LABELS.keyboardReady) } },
    ]);
    return Promise.resolve();
  }

  tapCurrency(field: CurrencyField): Promise<void> {
    const selector = { text: SWAP_LABELS.coinSelector, index: COIN_SELECTOR_INDEX[field] };
    this.flow.addStep(`swap-tap-${field}-currency`, [{ tapOn: selector }]);
    return Promise.resolve();
  }

  inputAmount(amount: string): Promise<void> {
    this.flow.addStep("swap-input-amount", this.keypadTaps(amount));
    return Promise.resolve();
  }

  waitForReceiveAmountEstimate(): Promise<void> {
    this.flow.addStep("swap-wait-estimate", [
      { extendedWaitUntil: { visible: text(SWAP_LABELS.viewQuotesButton) } },
    ]);
    return Promise.resolve();
  }

  tapGetQuotes(): Promise<void> {
    this.flow.addStep("swap-get-quotes", [{ tapOn: text(SWAP_LABELS.viewQuotesButton) }]);
    return Promise.resolve();
  }

  waitForQuotes(): Promise<void> {
    this.flow.addStep("swap-wait-quotes", [
      { extendedWaitUntil: { visible: text(SWAP_LABELS.quotesFound) } },
    ]);
    return Promise.resolve();
  }

  selectProviderAndExecute(): Promise<void> {
    const cascade: MaestroCommand[] = selectableSwapProviders().map(provider => {
      const nameSelector = providerNameSelector(provider);
      const commands: MaestroCommand[] = [
        { tapOn: nameSelector },
        { evalScript: `\${output.swapProviderPicked = '${provider.name}'}` },
        { tapOn: executeButtonLabel(provider) },
      ];
      return {
        runFlow: {
          label: `swap-provider-${provider.name}`,
          when: { visible: nameSelector, true: "${!output.swapProviderPicked}" },
          commands,
        },
      };
    });

    this.flow.add(...cascade, { assertTrue: "${output.swapProviderPicked != null}" });
    return Promise.resolve();
  }

  private keypadTaps(amount: string): MaestroCommand[] {
    const [intPart = "0", fracPart = ""] = amount.split(".");
    const taps: MaestroCommand[] = [];
    if (intPart && intPart !== "0") {
      for (const digit of intPart) taps.push(this.keyTap(digit));
    }
    if (fracPart) {
      taps.push(this.keyTap("."));
      for (const digit of fracPart) taps.push(this.keyTap(digit));
    }
    return taps;
  }

  private keyTap(key: string): MaestroCommand {
    if (key === "0") return { tapOn: { text: "0", below: text("8") } };
    if (key === ".") return { tapOn: { text: "\\.", below: text("7") } };
    return { tapOn: text(key) };
  }
}
