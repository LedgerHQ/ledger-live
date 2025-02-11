import React from "react";
import styled from "styled-components";
import { compose } from "redux";
import { useTranslation, withTranslation } from "react-i18next";
import { Operation, Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import logger from "~/renderer/logger";
import IconAngleDown from "~/renderer/icons/AngleDown";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import SectionTitle from "./SectionTitle";
import OperationComponent from "./Operation";
import TableContainer, { TableHeader } from "../TableContainer";
import { isEditableOperation } from "@ledgerhq/live-common/operation";
import { useOperationsList } from "./useOperationsList";

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
  filterOperation?: (b: Operation, a: AccountLike) => boolean;
};

export function OperationsList({
  account,
  parentAccount,
  accounts,
  allAccounts,
  withAccount,
  withSubAccounts,
  title,
  filterOperation,
}: Props) {
  const { t } = useTranslation();
  const { fetchMoreOperations, handleClickOperation, groupedOperations, accountsMap } =
    useOperationsList({
      account,
      parentAccount,
      accounts,
      withSubAccounts,
      filterOperation,
    });

  if (!account && !accounts) {
    console.warn("Preventing render OperationsList because not received account or accounts"); // eslint-disable-line no-console
    return null;
  }
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
        {groupedOperations?.sections?.map(
          group =>
            group.data.length > 0 && (
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
                      <OperationComponent
                        operation={operation}
                        account={account}
                        parentAccount={parentAccount}
                        key={`${account.id}_${operation.id}`}
                        onOperationClick={handleClickOperation}
                        t={t}
                        withAccount={withAccount}
                        editable={
                          account && isEditableOperation({ account: mainAccount, operation })
                        }
                      />
                    );
                  })}
                </Box>
              </Box>
            ),
        )}
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
}

export default compose<React.ComponentType<Props>>(withTranslation())(OperationsList);
