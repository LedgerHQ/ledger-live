import { Icons } from "@ledgerhq/react-ui";
import { FormattedAccountItem } from "../../components/FormattedAccountItem";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useTheme } from "styled-components";
import { urls } from "~/config/urls";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useAccountFormatter } from "../AccountsAdded/hooks";

export const useWarningConfig = (
  currency: CryptoCurrency,
  navigateToEditAccountName: (account: Account) => void,
  navigateToFundAccount: (account: Account) => void,
  isAccountSelectionFlow: boolean,
  emptyAccount?: Account,
) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const history = useHistory();

  const formatter = useAccountFormatter();
  const emptyAccountName = useMaybeAccountName(emptyAccount);

  const currencyUrl = getUrl(currency);
  const urlFaq = useLocalizedUrl(currencyUrl);

  const formattedAccount = emptyAccount ? formatter(emptyAccount) : null;

  const handleAccountClick = useCallback(
    (accountId: string) => {
      history.push({ pathname: `/account/${accountId}` });
      setDrawer();
    },
    [history],
  );

  const handleClose = useCallback(() => setDrawer(), []);

  const handleFundAccount = useCallback(
    () => emptyAccount && navigateToFundAccount(emptyAccount),
    [emptyAccount, navigateToFundAccount],
  );

  const emptyAccountWarning = {
    icon: <Icons.WarningFill size="L" color="warning.c70" />,
    title: t("modularAssetDrawer.scanAccounts.warning.title", { currency: currency.name }),
    description: t("modularAssetDrawer.scanAccounts.warning.description", {
      account: emptyAccountName,
    }),
    accountRow:
      formattedAccount && emptyAccount ? (
        <FormattedAccountItem
          account={formattedAccount}
          onClick={() => handleAccountClick(formattedAccount.id)}
          backgroundColor={colors.opacityDefault.c05}
          rightElement={{
            type: isAccountSelectionFlow ? "arrow" : "edit",
            onClick: () => navigateToEditAccountName(emptyAccount),
          }}
        />
      ) : null,
    primaryAction: {
      text: t("modularAssetDrawer.scanAccounts.warning.cta"),
      onClick: handleFundAccount,
    },
    secondaryAction: {
      text: t("modularAssetDrawer.scanAccounts.warning.close"),
      onClick: handleClose,
    },
  };

  const noAssociatedAccountsWarning = {
    icon: <Icons.InformationFill size="L" color="primary.c80" />,
    title: t("modularAssetDrawer.scanAccounts.warning.title", { currency: currency.name }),
    description: t("modularAssetDrawer.scanAccounts.warning.noAssociatedAccounts.description", {
      currency: currency.name,
    }),
    accountRow: null,
    primaryAction: {
      text: t("modularAssetDrawer.scanAccounts.warning.noAssociatedAccounts.cta", {
        currency: currency.name,
      }),
      onClick: () => openURL(urlFaq),
    },
    secondaryAction: {
      text: t("modularAssetDrawer.scanAccounts.warning.noAssociatedAccounts.close"),
      onClick: handleClose,
    },
  };

  return { emptyAccountWarning, noAssociatedAccountsWarning };
};

const getUrl = (currency: CryptoCurrency) => {
  const lowerCaseCurrencyId = currency.id.toLowerCase();
  switch (lowerCaseCurrencyId) {
    case "hedera":
      return urls.hedera.supportArticleLink;
    default:
      return "";
  }
};
