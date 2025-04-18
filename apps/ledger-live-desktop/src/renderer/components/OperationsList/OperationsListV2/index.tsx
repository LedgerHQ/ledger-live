import React from "react";
import styled from "styled-components";
import { compose } from "redux";
import { useTranslation, withTranslation } from "react-i18next";
import IconAngleDown from "~/renderer/icons/AngleDown";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import SectionTitle from "../SectionTitle";
import OperationComponent from "../Operation";
import TableContainer, { TableHeader } from "../../TableContainer";
import { isEditableOperation } from "@ledgerhq/live-common/operation";
import { useOperationsList, Props } from "./useOperationsList";
import { InfiniteLoader } from "@ledgerhq/react-ui/index";

export function OperationsList({
  account,
  parentAccount,
  accounts,
  withAccount,
  withSubAccounts,
  title,
  filterOperation,
}: Props) {
  const { t } = useTranslation();
  const {
    fetchMoreOperations,
    handleClickOperation,
    groupedOperations,
    getOperationProperties,
    hasMore,
    isFetchingMetadata,
  } = useOperationsList({
    account,
    parentAccount,
    accounts,
    withSubAccounts,
    filterOperation,
  });

  if ((!account && !accounts) || Object.entries(groupedOperations).length === 0) {
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
        {Object.entries(groupedOperations).map(([key, data]) => {
          return (
            <Box key={key}>
              <SectionTitle date={new Date(parseInt(key, 10))} />
              <Box p={0}>
                {data.map(operation => {
                  const properties = getOperationProperties(operation, account, parentAccount);

                  if (!properties) return null;

                  const { accountOperation, parentAccountOperation, mainAccountOperation } =
                    properties;
                  return (
                    <OperationComponent
                      operation={operation}
                      account={accountOperation}
                      parentAccount={parentAccountOperation}
                      key={`${accountOperation.id}_${operation.id}`}
                      onOperationClick={handleClickOperation}
                      t={t}
                      withAccount={withAccount}
                      editable={
                        account && isEditableOperation({ account: mainAccountOperation, operation })
                      }
                    />
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </TableContainer>
      {isFetchingMetadata ? (
        <Box p={3} alignItems="center">
          <InfiniteLoader size={23} />
        </Box>
      ) : hasMore ? (
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
