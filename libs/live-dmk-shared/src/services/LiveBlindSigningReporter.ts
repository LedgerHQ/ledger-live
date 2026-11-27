import { type Either, Right } from "purify-ts";
import { noopLoggerFactory } from "@ledgerhq/device-management-kit";
import {
  type ContextModuleChainID,
  type SignReporter,
  type SignReportParams,
  DEFAULT_CONFIG,
  DefaultSignReporter,
  HttpSignReporterDatasource,
} from "@ledgerhq/context-module";

export type LiveBlindSigningContext = {
  platform?: SignReportParams["platform"];
  appVersion?: string;
  platformOS?: string;
  platformVersion?: string;
  liveAppContext?: string | null;
  sessionId?: string | null;
};

export class LiveBlindSigningReporter implements SignReporter {
  private static _instance: LiveBlindSigningReporter | null = null;

  private context: LiveBlindSigningContext = {};
  private inner: SignReporter | null = null;
  private consentGetter: () => boolean = () => false;

  private constructor() {}

  static getInstance(): LiveBlindSigningReporter {
    if (!LiveBlindSigningReporter._instance) {
      LiveBlindSigningReporter._instance = new LiveBlindSigningReporter();
    }
    return LiveBlindSigningReporter._instance;
  }

  setInner(inner: SignReporter) {
    this.inner = inner;
  }

  setContext(ctx: Partial<LiveBlindSigningContext>) {
    this.context = { ...this.context, ...ctx };
  }

  getContext(): Readonly<LiveBlindSigningContext> {
    return this.context;
  }

  clearContext() {
    this.context = {};
  }

  setConsentSource(getConsent: () => boolean) {
    this.consentGetter = getConsent;
  }

  setConsent(consent: boolean) {
    this.consentGetter = () => consent;
  }

  hasConsent(): boolean {
    return this.consentGetter();
  }

  async report(params: SignReportParams): Promise<Either<Error, void>> {
    if (!this.inner) return Right<void, Error>(undefined);
    if (!this.consentGetter()) {
      return this.inner.report(params);
    }
    return this.inner.report({
      ...params,
      ...this.context,
    });
  }
}

export const liveBlindSigningReporter = LiveBlindSigningReporter.getInstance();

export function buildDefaultHttpSignReporter(
  originToken: string,
  chain: ContextModuleChainID,
  appSource = "ledger-wallet",
): SignReporter {
  return new DefaultSignReporter(
    new HttpSignReporterDatasource(
      {
        ...DEFAULT_CONFIG,
        appSource,
        originToken,
        loggerFactory: noopLoggerFactory,
        chain,
      },
      noopLoggerFactory,
    ),
  );
}
