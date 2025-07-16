export type SwapProviderConfig = {
  needsKYC: boolean;
  needsBearerToken?: boolean;
};

export type AdditionalProviderConfig = SwapProviderConfig & { type: "DEX" | "CEX" } & {
  version?: number;
  termsOfUseUrl: string;
  supportUrl: string;
  mainUrl: string;
  useInExchangeApp: boolean;
  displayName: string;
};

export const SWAP_DATA_CDN: Record<string, AdditionalProviderConfig> = {
  exodus: {
    type: "CEX",
    useInExchangeApp: true,
    displayName: "Exodus",
    termsOfUseUrl: "https://www.exodus.com/terms/",
    supportUrl: "mailto:support@xopay.com",
    mainUrl: "https://www.exodus.com/",
    needsKYC: false,
    version: 2,
  },
  changelly: {
    type: "CEX",
    useInExchangeApp: true,
    displayName: "Changelly",
    termsOfUseUrl: "https://changelly.com/terms-of-use",
    supportUrl: "https://support.changelly.com/en/support/home",
    mainUrl: "https://changelly.com/",
    needsKYC: false,
  },
  cic: {
    needsKYC: false,
    displayName: "CIC",
    type: "CEX",
    useInExchangeApp: true,
    termsOfUseUrl: "https://criptointercambio.com/terms-of-use",
    supportUrl: "https://criptointercambio.com/en/about",
    mainUrl: "https://criptointercambio.com/",
  },
  moonpay: {
    needsKYC: true,
    displayName: "MoonPay",
    type: "CEX",
    useInExchangeApp: true,
    termsOfUseUrl: "https://www.moonpay.com/legal/terms_of_use_row",
    supportUrl: "https://support.moonpay.com/",
    mainUrl: "https://www.moonpay.com/",
  },
  oneinch: {
    type: "DEX",
    needsKYC: false,
    useInExchangeApp: false,
    displayName: "1inch",
    termsOfUseUrl: "https://1inch.io/assets/1inch_network_terms_of_use.pdf",
    supportUrl: "https://help.1inch.io/en/",
    mainUrl: "https://1inch.io/",
  },
  paraswap: {
    type: "DEX",
    needsKYC: false,
    useInExchangeApp: false,
    displayName: "Paraswap",
    termsOfUseUrl: "https://files.paraswap.io/tos_v4.pdf",
    supportUrl: "https://help.paraswap.io/en/",
    mainUrl: "https://www.paraswap.io/",
  },
  thorswap: {
    type: "DEX",
    useInExchangeApp: true,
    displayName: "THORChain",
    termsOfUseUrl: "https://docs.thorswap.finance/thorswap/resources/terms-of-service",
    supportUrl: "https://ledgerhelp.swapkit.dev/",
    mainUrl: "https://www.thorswap.finance/",
    needsKYC: false,
  },
  lifi: {
    useInExchangeApp: true,
    displayName: "LI.FI",
    mainUrl: "https://li.fi/",
    needsKYC: false,
    supportUrl: "https://discord.gg/jumperexchange",
    termsOfUseUrl: "https://li.fi/legal/terms-and-conditions/",
    type: "CEX",
  },
  uniswap: {
    type: "DEX",
    useInExchangeApp: false,
    displayName: "Uniswap",
    termsOfUseUrl:
      "https://support.uniswap.org/hc/en-us/articles/30935100859661-Uniswap-Labs-Terms-of-Service",
    supportUrl: "https://support.uniswap.org/hc/en-us/requests/new",
    mainUrl: "https://uniswap.org/",
    needsKYC: false,
  },
};
