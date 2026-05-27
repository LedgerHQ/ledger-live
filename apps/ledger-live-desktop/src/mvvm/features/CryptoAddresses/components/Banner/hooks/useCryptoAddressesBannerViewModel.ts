import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { getAccountsSidebarPath } from "LLD/components/SideBar/utils";
import { useSelector } from "LLD/hooks/redux";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { track } from "~/renderer/analytics/segment";
import { useNavigate } from "react-router";
import { Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";

const CRYPTO_ADDRESSES_BANNER_SOURCE = "portfolio_crypto_addresses_banner";

export interface CryptoAddressesBannerViewModelResult {
  readonly title: string;
  readonly description: string;
  readonly icon: typeof Wallet;
  readonly onGoToAccounts: () => void;
  readonly onAddAccount: () => void;
  readonly buttonText?: string;
  readonly firstThreeCurrencies: (CryptoCurrency | TokenCurrency)[];
}

export const useCryptoAddressesBannerViewModel = (): CryptoAddressesBannerViewModelResult => {
  const { t } = useTranslation();
  const accounts = useSelector(shallowAccountsSelector);
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("desktop");
  const navigate = useNavigate();
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    CRYPTO_ADDRESSES_BANNER_SOURCE,
  );

  const hasAccount = accounts.length > 0;
  const accountsCount = accounts.length;
  const firstThreeCurrencies = [...new Set(accounts.map(a => getAccountCurrency(a)))].slice(0, 3);

  const onGoToAccounts = useCallback(() => {
    track("button_clicked", {
      button: "account_cta",
      type: "view",
      page: PORTFOLIO_TRACKING_PAGE_NAME,
    });
    navigate(getAccountsSidebarPath(shouldDisplayAssetSection));
  }, [navigate, shouldDisplayAssetSection]);

  const onAddAccount = useCallback(() => {
    track("button_clicked", {
      button: "account_cta",
      type: "add",
      page: PORTFOLIO_TRACKING_PAGE_NAME,
    });
    openAssetFlow();
  }, [openAssetFlow]);

  return {
    title: t("assets.cryptoAccounts"),
    description: hasAccount
      ? t("assets.accountsCount", { count: accountsCount })
      : t("assets.noCryptoAccounts"),
    icon: Wallet,
    onGoToAccounts,
    onAddAccount,
    buttonText: hasAccount ? undefined : t("assets.add"),
    firstThreeCurrencies,
  };
};
