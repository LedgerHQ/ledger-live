import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { useSelector } from "LLD/hooks/redux";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { track } from "~/renderer/analytics/segment";
import { useNavigate } from "react-router";
import { Wallet } from "@ledgerhq/lumen-ui-react/symbols";

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
  const navigate = useNavigate();
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    CRYPTO_ADDRESSES_BANNER_SOURCE,
  );

  const hasAccount = accounts.length > 0;
  const accountsAmount = accounts.length;
  const firstThreeCurrencies = accounts.slice(0, 3).map(a => getAccountCurrency(a));

  const onGoToAccounts = useCallback(() => {
    track("button_clicked", {
      button: "accounts",
      page: "crypto_addresses_banner",
    });
    navigate("/accounts");
  }, [navigate]);

  const onAddAccount = useCallback(() => {
    openAssetFlow();
  }, [openAssetFlow]);

  return {
    title: t("assets.cryptoAddresses"),
    description: hasAccount
      ? t("assets.addressCount", { count: accountsAmount })
      : t("assets.noCryptoAddresses"),
    icon: Wallet,
    onGoToAccounts,
    onAddAccount,
    buttonText: !hasAccount ? t("assets.addCryptoAddress") : undefined,
    firstThreeCurrencies,
  };
};
