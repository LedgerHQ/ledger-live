import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { E2EBridge } from "../runtime/bridge";
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
  private readonly fromAmountInput = "from-account-amount-input";

  constructor(
    private readonly flow: FlowBuilder,
    private readonly bridge: E2EBridge,
    private readonly driver: string,
  ) {}

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

  async inputAmount(amount: string): Promise<void> {
    await this.driveWebView({ op: "waitForTestId", testId: this.fromAmountInput });
    await this.driveWebView({ op: "typeText", testId: this.fromAmountInput, value: amount });
  }

  private async driveWebView(op: Parameters<E2EBridge["webviewDriver"]>[1]): Promise<void> {
    const result = await this.bridge.webviewDriver(this.driver, op);
    if (!result.ok) {
      throw new Error(`[swap-live-app] WebView op "${op.op}" failed: ${result.error}`);
    }
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
}
