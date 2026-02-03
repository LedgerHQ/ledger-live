import React, { useCallback } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { Navigate, useParams } from "react-router";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { isAddressPoisoningOperation } from "@ledgerhq/live-common/operation";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  findSubAccountById,
  getMainAccount,
  isAccountEmpty,
} from "@ledgerhq/live-common/account/index";
import { findAccountById, findSubAccountByIdWithFallback } from "~/renderer/utils";
import {
  setCountervalueFirst,
  useFilterTokenOperationsZeroAmount,
} from "~/renderer/actions/settings";
import { countervalueFirstSelector } from "~/renderer/reducers/settings";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import OperationsList from "~/renderer/components/OperationsList";
import useTheme from "~/renderer/hooks/useTheme";
import BalanceSummary from "./BalanceSummary";
import AccountHeader from "./AccountHeader";
import { AccountWarningBanner, AccountWarningCustomBanner } from "./AccountWarningBanner";
import AccountHeaderActions, { AccountHeaderSettingsButton } from "./AccountHeaderActions";
import EmptyStateAccount from "./EmptyStateAccount";
import TokensList from "./TokensList";
import { AccountStakeBanner } from "~/renderer/screens/account/AccountStakeBanner";
import { AccountLike, Account, Operation } from "@ledgerhq/types-live";
import { State } from "~/renderer/reducers";
import { getLLDCoinFamily } from "~/renderer/families";
import NftEntryPoint from "LLD/features/NftEntryPoint";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";

type Params = {
  id?: string;
  parentId?: string;
};

const mapStateToProps = (state: State, ownProps: { id?: string; parentId?: string }) => {
  const { id, parentId } = ownProps;
  const accounts = accountsSelector(state);
  const parentAccount: Account | undefined | null = parentId
    ? findAccountById(accounts, parentId) || undefined
    : undefined;
  let account: AccountLike | undefined | null;
  if (parentAccount && id) {
    account = findSubAccountByIdWithFallback(parentAccount, id, findSubAccountById) || undefined;
  } else if (id) {
    account = findAccountById(accounts, id) || undefined;
  }

  return {
    parentAccount,
    account,
    countervalueFirst: countervalueFirstSelector(state),
  };
};

const mapDispatchToProps = {
  setCountervalueFirst,
};

type Props = {
  t: TFunction;
  account?: AccountLike;
  parentAccount?: Account;
  countervalueFirst: boolean;
  setCountervalueFirst: (a: boolean) => void;
};

type OwnProps = {
  id?: string;
  parentId?: string;
};

const AccountPage = ({
  account,
  parentAccount,
  t,
  countervalueFirst,
  setCountervalueFirst,
}: Props) => {
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const specific = mainAccount ? getLLDCoinFamily(mainAccount.currency.family) : null;
  const AccountBodyHeader = specific?.AccountBodyHeader;
  const AccountSubHeader = specific?.AccountSubHeader;
  const PendingTransferProposals = specific?.PendingTransferProposals;
  const bgColor = useTheme().colors.background.card;
  const [shouldFilterTokenOpsZeroAmount] = useFilterTokenOperationsZeroAmount();
  const addressPoisoningFamilies = useAddressPoisoningOperationsFamilies({
    shouldFilter: shouldFilterTokenOpsZeroAmount,
  });

  const filterOperations = useCallback(
    (operation: Operation, account: AccountLike) => {
      const isOperationPoisoned = isAddressPoisoningOperation(
        operation,
        account,
        addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
      );

      const shouldFilterOperation = !(shouldFilterTokenOpsZeroAmount && isOperationPoisoned);

      return shouldFilterOperation;
    },
    [shouldFilterTokenOpsZeroAmount, addressPoisoningFamilies],
  );

  const currency = mainAccount?.currency;

  if (!account || !mainAccount || !currency) {
    return <Navigate to="/accounts" replace />;
  }

  const color = getCurrencyColor(currency, bgColor);

  return (
    <Box key={account.id}>
      <TrackPage
        category="Account"
        currency={currency.id}
        operationsLength={account.operations.length}
      />
      <SyncOneAccountOnMount reason="view-account" priority={10} accountId={mainAccount.id} />
      <Box
        horizontal
        mb={1}
        flow={4}
        style={{
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <AccountHeader account={account} parentAccount={parentAccount} />
        <AccountHeaderSettingsButton account={account} parentAccount={parentAccount} />
      </Box>
      <Box
        horizontal
        pb={3}
        flow={4}
        style={{
          width: "100%",
          overflowX: "visible",
          marginBottom: "30px",
        }}
      >
        <AccountHeaderActions account={account} parentAccount={parentAccount} />
      </Box>
      <AccountWarningBanner currency={currency} />
      <AccountWarningCustomBanner currency={currency} />
      {AccountSubHeader ? (
        <AccountSubHeader account={account} parentAccount={parentAccount} />
      ) : null}
      {!isAccountEmpty(account) ? (
        <>
          <Box mb={7}>
            <BalanceSummary
              mainAccount={mainAccount}
              account={account}
              parentAccount={parentAccount}
              chartColor={color}
              countervalueFirst={countervalueFirst}
              setCountervalueFirst={setCountervalueFirst}
            />
          </Box>
          <AccountStakeBanner account={account} />
          {AccountBodyHeader ? (
            <AccountBodyHeader account={account} parentAccount={parentAccount} />
          ) : null}

          {PendingTransferProposals && (
            <PendingTransferProposals account={account as Account} parentAccount={mainAccount} />
          )}

          {account.type === "Account" && <NftEntryPoint account={account} />}

          {account.type === "Account" ? <TokensList account={account} /> : null}
          <OperationsList
            t={t}
            account={account}
            parentAccount={parentAccount}
            title={t("account.lastOperations")}
            filterOperation={filterOperations}
          />
        </>
      ) : (
        <EmptyStateAccount account={account} parentAccount={parentAccount} />
      )}
    </Box>
  );
};

const ConnectedAccountPage = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(AccountPage);

// Wrapper component that extracts route params and passes them to the connected component
const AccountPageWrapper = () => {
  const { id, parentId, "*": splat } = useParams<Params & { "*"?: string }>();
  const fullId =
    id && parentId && splat && splat.indexOf("account/") === -1 ? `${id}/${splat}` : id;
  return <ConnectedAccountPage id={fullId} parentId={parentId} />;
};

export default AccountPageWrapper;
