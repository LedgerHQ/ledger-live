import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Banner } from "@ledgerhq/lumen-ui-react";
import { AddAccountButton } from "./components/AddAccountButton";
import { AccountSelectorContent } from "./components/AccountSelectorContent";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useDetailedAccounts } from "../../hooks/useDetailedAccounts";
import TrackDialogScreen from "../../analytics/TrackDialogScreen";
import {
  MODULAR_DIALOG_PAGE_NAME,
  ModularDialogEventName,
} from "../../analytics/modularDialog.types";

type Props = {
  asset: CryptoOrTokenCurrency;
  hideAddAccountButton?: boolean;
  overridePageName?: ModularDialogEventName;
  uiUseCase?: string;
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
};

export const AccountSelector = ({
  asset,
  onAccountSelected,
  hideAddAccountButton,
  overridePageName,
  uiUseCase,
}: Props) => {
  const { t } = useTranslation();
  const { detailedAccounts, accounts, onAddAccountClick } = useDetailedAccounts(
    asset,
    onAccountSelected,
  );

  const BottomComponent = (
    <>
      {uiUseCase === "perpetuals" && (
        <Banner
          appearance="info"
          title={t("drawers.selectAccount.perpetualsBanner")}
          className="mt-16"
        />
      )}
      <AddAccountContainer>
        <AddAccountButton onAddAccountClick={onAddAccountClick} />
      </AddAccountContainer>
    </>
  );

  return (
    <>
      <TrackDialogScreen
        page={overridePageName ?? MODULAR_DIALOG_PAGE_NAME.MODULAR_ACCOUNT_SELECTION}
      />
      <AccountSelectorContent
        accounts={accounts}
        detailedAccounts={detailedAccounts}
        onAccountSelected={onAccountSelected}
        bottomComponent={!hideAddAccountButton && BottomComponent}
      />
    </>
  );
};

export const AddAccountContainer = styled.div`
  display: flex;
  padding: 0 8px;
  flex: 0 1 auto;
  margin-bottom: 16px;
  margin-top: 16px;
`;
