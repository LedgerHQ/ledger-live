import React, { PureComponent } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { Operation, Account, AccountLike } from "@ledgerhq/types-live";
import keyBy from "lodash/keyBy";
import {
  groupAccountOperationsByDay,
  groupAccountsOperationsByDay,
  flattenAccounts,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { log } from "@ledgerhq/logs";
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
const mapDispatchToProps = {
  openModal,
};
type Props = {
  account?: AccountLike;
  parentAccount?: Account | null;
  accounts?: AccountLike[];
  allAccounts?: AccountLike[];
  openModal?: (b: string, a: object) => void;
  t: TFunction;
  withAccount?: boolean;
  withSubAccounts?: boolean;
  title?: string;
  filterOperation?: (b: Operation, a: AccountLike) => boolean;
};
type State = {
  nbToShow: number;
};
const initialState = {
  nbToShow: 20,
};
export class OperationsList extends PureComponent<Props, State> {
  static defaultProps = {
    withAccount: false,
  };

  state = initialState;
  handleClickOperation = (operation: Operation, account: AccountLike, parentAccount?: Account) =>
    setDrawer(OperationDetails, {
      operationId: operation.id,
      accountId: account.id,
      parentId: parentAccount?.id as string | undefined | null,
    });

  // TODO: convert of async/await if fetching with the api
  fetchMoreOperations = () => {
    track("FetchMoreOperations");
    this.setState({
      nbToShow: this.state.nbToShow + 20,
    });
  };

  render() {
    const {
      account,
      parentAccount,
      accounts,
      allAccounts,
      t,
      title,
      withAccount,
      withSubAccounts,
      filterOperation,
    } = this.props;
    const { nbToShow } = this.state;
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

    // -- THIS CAN BE REMOVED ONCE THE DATE ERROR HAS BEEN FIGURED OUT
    if (groupedOperations?.sections) {
      for (const group of groupedOperations.sections) {
        const { day } = group;
        if (day instanceof Date && isNaN(day as unknown as number)) {
          log("Ethereum Date Error", "Date in operation is invalid", {
            day,
            accountId: account?.id,
            groupOps: group.data,
          });
        }
      }
    }
    // -- THIS CAN BE REMOVED ONCE THE DATE ERROR HAS BEEN FIGURED OUT

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
            />
          )}
          {groupedOperations?.sections.map(group => (
            <Box key={group.day.toISOString()}>
              <SectionTitle date={group.day} />
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
                  const mainAccount = getMainAccount(account, parentAccount);
                  return (
                    <OperationC
                      operation={operation}
                      account={account}
                      parentAccount={parentAccount}
                      key={`${account.id}_${operation.id}`}
                      onOperationClick={this.handleClickOperation}
                      t={t}
                      withAccount={withAccount}
                      editable={account && isEditableOperation({ account: mainAccount, operation })}
                    />
                  );
                })}
              </Box>
            </Box>
          ))}
        </TableContainer>
        {!groupedOperations?.completed ? (
          <ShowMore onClick={this.fetchMoreOperations}>
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
  }
}
export default compose<React.ComponentType<Props>>(
  withTranslation(),
  connect(
    createStructuredSelector({
      allAccounts: accountsSelector,
    }),
    mapDispatchToProps,
  ),
)(OperationsList);
