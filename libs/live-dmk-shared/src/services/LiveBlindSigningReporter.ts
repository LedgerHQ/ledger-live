import { type Either, Right } from "purify-ts";
import { noopLoggerFactory } from "@ledgerhq/device-management-kit";
import {
  type BlindSigningPlatform,
  type BlindSigningReporter,
  type BlindSigningReportParams,
  type ContextModuleChainID,
  DEFAULT_CONFIG,
  DefaultBlindSigningReporter,
  HttpBlindSigningReporterDatasource,
} from "@ledgerhq/context-module";

export type LiveBlindSigningContext = {
  platform?: BlindSigningPlatform;
  appVersion?: string;
  platformOS?: string;
  platformVersion?: string;
  liveAppContext?: string | null;
  sessionId?: string | null;
};

export class LiveBlindSigningReporter implements BlindSigningReporter {
  private static _instance: LiveBlindSigningReporter | null = null;

  private context: LiveBlindSigningContext = {};
  private inner: BlindSigningReporter | null = null;
  private consentGetter: () => boolean = () => false;

  private constructor() {}

  static getInstance(): LiveBlindSigningReporter {
    if (!LiveBlindSigningReporter._instance) {
      LiveBlindSigningReporter._instance = new LiveBlindSigningReporter();
    }
    return LiveBlindSigningReporter._instance;
  }

  setInner(inner: BlindSigningReporter) {
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

  async report(params: BlindSigningReportParams): Promise<Either<Error, void>> {
    if (!this.inner) return Right<void, Error>(undefined);
    if (!this.consentGetter()) {
      return this.inner.report(params);
    }
    return this.inner.report({
      ...params,
      ...this.context,
    } as BlindSigningReportParams);
  }
}

export const liveBlindSigningReporter = LiveBlindSigningReporter.getInstance();

export function buildDefaultHttpBlindSigningReporter(
  originToken: string,
  chain: ContextModuleChainID,
  appSource = "ledger-wallet",
): BlindSigningReporter {
  return new DefaultBlindSigningReporter(
    new HttpBlindSigningReporterDatasource({
      ...DEFAULT_CONFIG,
      appSource,
      originToken,
      loggerFactory: noopLoggerFactory,
      chain,
    }),
  );
}
