export interface MockAccountGeneratorViewModel {
  readonly randomEnabled: boolean;
  readonly randomCount: number;
  readonly emptyEnabled: boolean;
  readonly stablecoinsEnabled: boolean;
  readonly manualEnabled: boolean;
  readonly selectedCurrencies: Record<string, boolean>;
  readonly selectedCount: number;
  readonly tokenIds: string;
  readonly canGenerate: boolean;
  readonly summaryLines: string[];
  readonly setRandomEnabled: (value: boolean) => void;
  readonly setRandomCount: (count: number) => void;
  readonly setEmptyEnabled: (value: boolean) => void;
  readonly setStablecoinsEnabled: (value: boolean) => void;
  readonly setManualEnabled: (value: boolean) => void;
  readonly setTokenIds: (value: string) => void;
  readonly handleCurrencyToggle: (currencyId: string) => void;
  readonly handleGenerate: () => Promise<void>;
}

export interface MockAccountGeneratorContentProps {
  readonly expanded: boolean;
}

export interface RandomAccountsSectionProps {
  readonly enabled: boolean;
  readonly count: number;
  readonly onEnabledChange: (value: boolean) => void;
  readonly onCountChange: (count: number) => void;
}

export interface EmptyAccountSectionProps {
  readonly enabled: boolean;
  readonly onEnabledChange: (value: boolean) => void;
}

export interface StablecoinsSectionProps {
  readonly enabled: boolean;
  readonly onEnabledChange: (value: boolean) => void;
}

export interface ManualAccountsSectionProps {
  readonly enabled: boolean;
  readonly selectedCurrencies: Record<string, boolean>;
  readonly selectedCount: number;
  readonly tokenIds: string;
  readonly onEnabledChange: (value: boolean) => void;
  readonly onCurrencyToggle: (currencyId: string) => void;
  readonly onTokenIdsChange: (value: string) => void;
}

export interface GenerationSummaryProps {
  readonly lines: string[];
  readonly canGenerate: boolean;
}
