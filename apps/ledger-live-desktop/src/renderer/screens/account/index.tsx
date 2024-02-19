import React, { useCallback } from "react";
import { compose } from "redux";
import { connect, useSelector } from "react-redux";
import { withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { Redirect } from "react-router";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import { isAddressPoisoningOperation } from "@ledgerhq/live-common/operation";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import { accountSelector } from "~/renderer/reducers/accounts";
import {
  findSubAccountById,
  getAccountCurrency,
  getMainAccount,
  isAccountEmpty,
} from "@ledgerhq/live-common/account/index";
import {
  setCountervalueFirst,
  useFilterTokenOperationsZeroAmount,
} from "~/renderer/actions/settings";
import {
  countervalueFirstSelector,
  hiddenNftCollectionsSelector,
} from "~/renderer/reducers/settings";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import OperationsList from "~/renderer/components/OperationsList";
import useTheme from "~/renderer/hooks/useTheme";
import Collections from "~/renderer/screens/nft/Collections";
import BalanceSummary from "./BalanceSummary";
import AccountHeader from "./AccountHeader";
import AccountHeaderActions, { AccountHeaderSettingsButton } from "./AccountHeaderActions";
import EmptyStateAccount from "./EmptyStateAccount";
import TokensList from "./TokensList";
import { AccountStakeBanner } from "~/renderer/screens/account/AccountStakeBanner";
import { AccountLike, Account, Operation } from "@ledgerhq/types-live";
import { State } from "~/renderer/reducers";
import { getLLDCoinFamily } from "~/renderer/families";

type Params = {
  id: string;
  parentId: string;
};
const mapStateToProps = (
  state: State,
  {
    match: {
      params: { id, parentId },
    },
  }: {
    match: {
      params: Params;
    };
  },
) => {
  const parentAccount: Account | undefined | null = accountSelector(state, {
    accountId: parentId,
  });
  let account: AccountLike | undefined | null;
  if (parentAccount) {
    account = findSubAccountById(parentAccount, id);
  } else {
    account = accountSelector(state, {
      accountId: id,
    });
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
  const bgColor = useTheme().colors.palette.background.paper;
  const [shouldFilterTokenOpsZeroAmount] = useFilterTokenOperationsZeroAmount();
  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);
  const filterOperations = useCallback(
    (operation: Operation, account: AccountLike) => {
      // Remove operations linked to address poisoning
      const removeZeroAmountTokenOp =
        shouldFilterTokenOpsZeroAmount && isAddressPoisoningOperation(operation, account);
      // Remove operations coming from an NFT collection considered spam
      const opFromBlacklistedNftCollection = operation?.nftOperations?.find(op =>
        hiddenNftCollections.includes(`${account.id}|${op?.contract}`),
      );
      return !opFromBlacklistedNftCollection && !removeZeroAmountTokenOp;
    },
    [hiddenNftCollections, shouldFilterTokenOpsZeroAmount],
  );

  if (!account || !mainAccount) {
    return <Redirect to="/accounts" />;
  }

  const currency = getAccountCurrency(account);
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
          {account.type === "Account" && isNFTActive(account.currency) ? (
            <Collections account={account} />
          ) : null}
          {account.type === "Account" ? <TokensList account={account} /> : null}
          <OperationsList
            account={account}
            parentAccount={parentAccount}
            title={t("account.lastOperations")}
            filterOperation={filterOperations}
            t={t}
          />
        </>
      ) : (
        <EmptyStateAccount account={account} parentAccount={parentAccount} />
      )}
    </Box>
  );
};
const ConnectedAccountPage = compose<React.ComponentType<Props>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(AccountPage);
export default ConnectedAccountPage;
