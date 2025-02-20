import React from "react";
import styled from "styled-components";
import { compose } from "redux";
import { useTranslation, withTranslation } from "react-i18next";
import IconAngleDown from "~/renderer/icons/AngleDown";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import SectionTitle from "./SectionTitle";
import OperationComponent from "./Operation";
import TableContainer, { TableHeader } from "../TableContainer";
import { isEditableOperation } from "@ledgerhq/live-common/operation";
import { Props, useOperationsList } from "./useOperationsList";

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
    groupedOperations2,
    hasMore
  } = useOperationsList({
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
        {Object.entries(groupedOperations2).map(([key, data]) => {
          return (
            <Box key={key}>
              <SectionTitle date={new Date(key)} />
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
        {/* {groupedOperations.sections?.map(
          group =>
            group.data.length > 0 && (
              <Box key={group.day.toISOString()}>
                <SectionTitle date={group.day} />
                <Box p={0}>
                  {group.data.map(operation => {
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
                          account &&
                          isEditableOperation({ account: mainAccountOperation, operation })
                        }
                      />
                    );
                  })}
                </Box>
              </Box>
            ),
        )} */}
      </TableContainer>
      {hasMore ? (
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
