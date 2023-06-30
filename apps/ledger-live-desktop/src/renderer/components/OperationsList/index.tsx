import React, { useState } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { compose } from "redux";
import { withTranslation, TFunction } from "react-i18next";
import { Operation, Account, AccountLike } from "@ledgerhq/types-live";
import keyBy from "lodash/keyBy";
import {
  groupAccountOperationsByDay,
  groupAccountsOperationsByDay,
  flattenAccounts,
} from "@ledgerhq/live-common/account/index";
import logger from "~/renderer/logger";
import { openModal } from "~/renderer/actions/modals";
import IconAngleDown from "~/renderer/icons/AngleDown";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { track } from "~/renderer/analytics/segment";
import { createStructuredSelector } from "reselect";
import { accountsSelector } from "~/renderer/reducers/accounts";
import SectionTitle from "./SectionTitle";
import OperationC from "./Operation";
import TableContainer, { TableHeader } from "../TableContainer";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { isEditableOperation } from "@ledgerhq/live-common/operation";
import BigNumber from "bignumber.js";

const ShowMore = styled(Box).attrs(() => ({
  horizontal: true,
  flow: 1,
  ff: "Inter|SemiBold",
  fontSize: 3,
  justifyContent: "center",
  alignItems: "center",
  p: 3,
  color: "wallet",
}))`
  &:hover {
    text-decoration: underline;
  }
`;

type Props = {
  account?: AccountLike;
  parentAccount?: Account | null;
  accounts?: AccountLike[];
  allAccounts?: AccountLike[];
  withAccount?: boolean;
  withSubAccounts?: boolean;
  title?: string;
  historyLowestBlock?: BigNumber;
  t: TFunction;
  filterOperation?: (b: Operation, a: AccountLike) => boolean;
};

export const OperationsList: React.FC<Props> = ({
  account,
  parentAccount,
  accounts,
  allAccounts,
  title,
  withAccount,
  withSubAccounts,
  historyLowestBlock,
  filterOperation,
  t,
}) => {
  const [nbToShow, setNbToShow] = useState(20);

  const handleClickOperation = (
    operation: Operation,
    account: AccountLike,
    parentAccount?: Account,
  ) =>
    setDrawer(OperationDetails, {
      operationId: operation.id,
      accountId: account.id,
      parentId: parentAccount?.id as string | undefined | null,
    });

  // TODO: convert of async/await if fetching with the api
  const fetchMoreOperations = () => {
    track("FetchMoreOperations");
    setNbToShow(oldValue => oldValue + 20);
  };

  if (!account && !accounts) {
    console.warn("Preventing render OperationsList because not received account or accounts"); // eslint-disable-line no-console
    return null;
  }

  const groupedOperations = account
    ? groupAccountOperationsByDay(account, {
        count: nbToShow,
        withSubAccounts,
        filterOperation,
      })
    : accounts
    ? groupAccountsOperationsByDay(accounts, {
        count: nbToShow,
        withSubAccounts,
        filterOperation,
      })
    : undefined;

  const all = flattenAccounts(accounts || []).concat(
    [account as AccountLike, parentAccount as AccountLike].filter(Boolean),
  );
  const accountsMap = keyBy(all, "id");

  return (
    <>
      <TableContainer id="operation-list">
        {title && (
          <TableHeader
            title={title}
            titleProps={{
              "data-e2e": "dashboard_OperationList",
            }}
            historyLowestBlock={historyLowestBlock}
          />
        )}
        {groupedOperations?.sections.map(group => (
          <Box key={group.day.toISOString()}>
            <SectionTitle day={group.day} />
            <Box p={0}>
              {group.data.map(operation => {
                const account = accountsMap[operation.accountId];
                if (!account) {
                  logger.warn(`no account found for operation ${operation.id}`);
                  return null;
                }
                let parentAccount;
                if (account.type !== "Account") {
                  const pa =
                    accountsMap[account.parentId] ||
                    allAccounts?.find(a => a.id === account.parentId);
                  if (pa && pa.type === "Account") {
                    parentAccount = pa;
                  }
                  if (!parentAccount) {
                    logger.warn(`no token account found for token operation ${operation.id}`);
                    return null;
                  }
                }
                return (
                  <OperationC
                    operation={operation}
                    account={account}
                    parentAccount={parentAccount}
                    key={`${account.id}_${operation.id}`}
                    onOperationClick={handleClickOperation}
                    t={t}
                    withAccount={withAccount}
                    editable={account && isEditableOperation(account, operation)}
                  />
                );
              })}
            </Box>
          </Box>
        ))}
      </TableContainer>
      {!groupedOperations?.completed ? (
        <ShowMore onClick={fetchMoreOperations}>
          <span>{t("common.showMore")}</span>
          <IconAngleDown size={12} />
        </ShowMore>
      ) : (
        <Box p={3} alignItems="center">
          <Text ff="Inter" fontSize={3}>
            {t("operationList.noMoreOperations")}
          </Text>
        </Box>
      )}
    </>
  );
};

const mapDispatchToProps = {
  openModal,
};

export default compose<React.ComponentType<Props>>(
  withTranslation(),
  connect(
    createStructuredSelector({
      allAccounts: accountsSelector,
    }),
    mapDispatchToProps,
  ),
)(OperationsList);
