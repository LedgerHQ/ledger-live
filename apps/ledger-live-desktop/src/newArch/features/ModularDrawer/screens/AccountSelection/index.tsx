import React from "react";
import styled from "styled-components";
import { AddAccountButton } from "./components/AddAccountButton";
import { SelectAccountList } from "./components/List";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useDetailedAccounts } from "../../hooks/useDetailedAccounts";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useDispatch } from "react-redux";
import { closeModal } from "~/renderer/actions/modals";
import TrackDrawerScreen from "../../analytics/TrackDrawerScreen";
import {
  MODULAR_DRAWER_PAGE_NAME,
  ModularDrawerEventName,
} from "../../analytics/modularDrawer.types";

type Props = {
  asset: CryptoOrTokenCurrency;
  hideAddAccountButton?: boolean;
  overridePageName?: ModularDrawerEventName;
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
};

export const AccountSelection = ({
  asset,
  onAccountSelected,
  hideAddAccountButton,
  overridePageName,
}: Props) => {
  const newSendFlow = useFeature("newSendFlow");
  const dispatch = useDispatch();
  const { detailedAccounts, accounts, onAddAccountClick } = useDetailedAccounts(
    asset,
    onAccountSelected,
  );

  const BottomComponent = (
    <AddAccountContainer>
      <AddAccountButton
        onAddAccountClick={() => {
          if (newSendFlow?.enabled) {
            // Close the Send modal when starting the add account flow
            dispatch(closeModal("MODAL_SEND"));
          }
          onAddAccountClick();
        }}
      />
    </AddAccountContainer>
  );

  return (
    <>
      <TrackDrawerScreen
        page={overridePageName ?? MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION}
      />
      <SelectAccountList
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
