import { useCallback, useEffect, useMemo, useState } from "react";
import type { SwapPayloadIssue } from "@ledgerhq/hw-app-exchange";
import { fetchAndMergeProviderData as fetchSellProviders } from "@ledgerhq/live-common/exchange/providers/sell";
import {
  getAvailableProviders,
  getSwapProvider,
} from "@ledgerhq/live-common/exchange/providers/swap";
import {
  checkPayload,
  expectedValuesToggleLabel,
  formatDecodedFields,
  modeMismatchHint,
  parseExpectedValues,
  parsePublicKeyHex,
  pendingReasonOf,
  providerHelperOf,
  resolveMode,
  resultBanner,
  toProviderOptions,
  type CalEnv,
  type Curve,
  type DecodedField,
  type ExpectedForm,
  type ExpectedValueKey,
  type KeySource,
  type ModeHint,
  type ModeTexts,
  type PartnerPublicKey,
  type ProviderHelper,
  type ProviderOption,
  type ProvidersState,
  type ResultBanner,
  type SwapFormatChoice,
  type TransactionType,
} from "./logic";

export type CheckResult = {
  banner: ResultBanner;
  modeHint: ModeHint | null;
  issues: SwapPayloadIssue[];
  decodedFields: DecodedField[];
};

export type ExchangePayloadCheckerViewModel = ModeTexts & {
  transactionType: TransactionType;
  swapFormatChoice: SwapFormatChoice;
  payload: string;
  signature: string;
  keySource: KeySource;
  calEnv: CalEnv;
  calEnvSelectable: boolean;
  providerOptions: ProviderOption[];
  providersReady: boolean;
  providerHelper: ProviderHelper | null;
  providerId: string | null;
  customCurve: Curve;
  customKeyHex: string;
  customKeyError: string | null;
  expectedOpen: boolean;
  expectedToggleLabel: string;
  expectedValues: ExpectedForm;
  expectedErrors: ExpectedForm;
  result: CheckResult | null;
  pendingReason: string | null;
  onTransactionTypeChange: (value: TransactionType) => void;
  onSwapFormatChoiceChange: (value: SwapFormatChoice) => void;
  onPayloadChange: (value: string) => void;
  onSignatureChange: (value: string) => void;
  onKeySourceChange: (value: KeySource) => void;
  onCalEnvChange: (value: CalEnv) => void;
  onProviderChange: (value: string | null) => void;
  onCustomCurveChange: (value: Curve) => void;
  onCustomKeyHexChange: (value: string) => void;
  onRetryProviders: () => void;
  onApplyModeHint: (switchTo: ModeHint["switchTo"]) => void;
  onToggleExpected: () => void;
  onExpectedValueChange: (key: ExpectedValueKey, value: string) => void;
};

const LOADING: ProvidersState = { status: "loading" };

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

// live-common reads the swap CAL environment from global env flags: swap keys come from production only.
async function loadProviderOptions(
  transactionType: TransactionType,
  calEnv: CalEnv,
): Promise<ProviderOption[]> {
  if (transactionType === "sell") {
    // ledgerSignatureEnv only affects the descriptor signature, not the partner key.
    const configs = await fetchSellProviders({
      ledgerSignatureEnv: "prod",
      partnerSignatureEnv: calEnv,
    });
    if (!configs) throw new Error("Failed to fetch sell providers from CAL");
    return toProviderOptions("sell", configs);
  }

  const ids = await getAvailableProviders();
  const configs = await Promise.all(
    ids.map(async id => [id, await getSwapProvider(id).catch(() => null)] as const),
  );
  return toProviderOptions("swap", Object.fromEntries(configs));
}

// Privacy: the payload, signature and key stay in this state, never logged, stored or put in the URL.
export const useExchangePayloadCheckerViewModel = (): ExchangePayloadCheckerViewModel => {
  const [transactionType, setTransactionType] = useState<TransactionType>("swap");
  const [swapFormatChoice, setSwapFormatChoice] = useState<SwapFormatChoice>("auto");
  const [payload, setPayload] = useState("");
  const [signature, setSignature] = useState("");
  const [keySource, setKeySource] = useState<KeySource>("provider");
  const [selectedCalEnv, setSelectedCalEnv] = useState<CalEnv>("prod");
  const [loadedProviders, setLoadedProviders] = useState<{
    requestKey: string;
    state: ProvidersState;
  } | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [customCurve, setCustomCurve] = useState<Curve>("secp256k1");
  const [customKeyHex, setCustomKeyHex] = useState("");
  const [expectedForms, setExpectedForms] = useState<Record<TransactionType, ExpectedForm>>({
    swap: {},
    sell: {},
  });
  const [expectedOpen, setExpectedOpen] = useState(false);

  const calEnvSelectable = transactionType === "sell";
  const calEnv: CalEnv = calEnvSelectable ? selectedCalEnv : "prod";
  const requestKey = `${transactionType}:${calEnv}:${reloadCount}`;

  useEffect(() => {
    let superseded = false;
    const store = (state: ProvidersState) => {
      if (!superseded) setLoadedProviders({ requestKey, state });
    };

    loadProviderOptions(transactionType, calEnv).then(
      options => store({ status: "ready", options }),
      error => store({ status: "error", message: errorMessage(error) }),
    );

    return () => {
      superseded = true;
    };
  }, [requestKey]);

  const providers = loadedProviders?.requestKey === requestKey ? loadedProviders.state : LOADING;

  const onTransactionTypeChange = useCallback(
    (value: TransactionType) => {
      if (value === transactionType) return;
      setTransactionType(value);
      setProviderId(null);
    },
    [transactionType],
  );

  const onCalEnvChange = useCallback(
    (value: CalEnv) => {
      if (value === selectedCalEnv) return;
      setSelectedCalEnv(value);
      setProviderId(null);
    },
    [selectedCalEnv],
  );

  const trimmedPayload = payload.trim();
  const trimmedSignature = signature.trim();

  const selectedProvider = useMemo(() => {
    if (keySource !== "provider" || providers.status !== "ready") return null;
    return providers.options.find(option => option.value === providerId) ?? null;
  }, [keySource, providers, providerId]);

  const modeInputs = useMemo(
    () => ({
      transactionType,
      swapFormatChoice,
      provider: selectedProvider,
      payload: trimmedPayload,
    }),
    [transactionType, swapFormatChoice, selectedProvider, trimmedPayload],
  );
  const mode = useMemo(() => resolveMode(modeInputs), [modeInputs]);

  const customKey = useMemo(() => parsePublicKeyHex(customKeyHex), [customKeyHex]);

  const partnerPublicKey = useMemo((): PartnerPublicKey | null => {
    if (keySource === "provider") return selectedProvider?.publicKey ?? null;
    return customKey.value ? { curve: customCurve, data: customKey.value } : null;
  }, [keySource, selectedProvider, customKey, customCurve]);

  const expectedForm = expectedForms[transactionType];
  const { expected, errors: expectedErrors } = useMemo(
    () => parseExpectedValues(expectedForm, mode.kind),
    [expectedForm, mode.kind],
  );
  const expectedErrorCount = Object.keys(expectedErrors).length;
  const hasExpectedErrors = expectedErrorCount > 0;

  const isExpectedOpen = expectedOpen || hasExpectedErrors;

  const pendingReason = pendingReasonOf({
    payload: trimmedPayload,
    signature: trimmedSignature,
    hasPartnerPublicKey: partnerPublicKey !== null,
    keySource,
    sellProviderNotice: mode.texts.sellProviderNotice,
    hasExpectedErrors,
  });

  const result = useMemo((): CheckResult | null => {
    if (pendingReason !== null || !partnerPublicKey) return null;
    const report = checkPayload(mode.kind, {
      payload: trimmedPayload,
      signature: trimmedSignature,
      partnerPublicKey,
      expected,
    });
    return {
      banner: resultBanner(report),
      modeHint: report.valid ? null : modeMismatchHint(modeInputs, report.issues),
      issues: report.issues,
      decodedFields: report.decoded ? formatDecodedFields(report.decoded) : [],
    };
  }, [
    pendingReason,
    partnerPublicKey,
    mode.kind,
    trimmedPayload,
    trimmedSignature,
    expected,
    modeInputs,
  ]);

  const onApplyModeHint = useCallback(
    ({ transactionType: nextType, swapFormatChoice: nextFormat }: ModeHint["switchTo"]) => {
      onTransactionTypeChange(nextType);
      if (nextFormat) setSwapFormatChoice(nextFormat);
    },
    [onTransactionTypeChange],
  );

  const onExpectedValueChange = useCallback(
    (key: ExpectedValueKey, value: string) => {
      setExpectedOpen(true);
      setExpectedForms(forms => ({
        ...forms,
        [transactionType]: { ...forms[transactionType], [key]: value },
      }));
    },
    [transactionType],
  );

  const onRetryProviders = useCallback(() => setReloadCount(count => count + 1), []);
  const onToggleExpected = useCallback(() => setExpectedOpen(!isExpectedOpen), [isExpectedOpen]);

  return {
    ...mode.texts,
    transactionType,
    swapFormatChoice,
    payload,
    signature,
    keySource,
    calEnv,
    calEnvSelectable,
    providerOptions: providers.status === "ready" ? providers.options : [],
    providersReady: providers.status === "ready",
    providerHelper: providerHelperOf(providers, transactionType),
    providerId,
    customCurve,
    customKeyHex,
    customKeyError: customKeyHex.trim() && customKey.error ? customKey.error : null,
    expectedOpen: isExpectedOpen,
    expectedToggleLabel: expectedValuesToggleLabel(
      expected ? Object.keys(expected).length : 0,
      expectedErrorCount,
    ),
    expectedValues: expectedForm,
    expectedErrors,
    result,
    pendingReason,
    onTransactionTypeChange,
    onSwapFormatChoiceChange: setSwapFormatChoice,
    onPayloadChange: setPayload,
    onSignatureChange: setSignature,
    onKeySourceChange: setKeySource,
    onCalEnvChange,
    onProviderChange: setProviderId,
    onCustomCurveChange: setCustomCurve,
    onCustomKeyHexChange: setCustomKeyHex,
    onRetryProviders,
    onApplyModeHint,
    onToggleExpected,
    onExpectedValueChange,
  };
};
