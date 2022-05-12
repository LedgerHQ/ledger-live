import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";
import {
  getMainAccount,
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";

import {
  Account,
  Operation,
  AccountLike,
} from "@ledgerhq/live-common/lib/types";

import { Box, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";

import debounce from "lodash/debounce";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";

import OperationIcon from "./OperationIcon";
import { ScreenName } from "../const";
import OperationRowDate from "./OperationRowDate";
import OperationRowNftName from "./OperationRowNftName";

import perFamilyOperationDetails from "../generated/operationDetails";

const ContainerTouchable = styled(Flex).attrs(p => ({
  height: "64px",
  flexDirection: "row",
  alignItems: "center",
  px: 0,
  py: 6,
}))<{ isLast?: boolean }>``;

const Wrapper = styled(Flex).attrs(p => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginLeft: 4,
  marginRight: 0,
  opacity: p.isOptimistic ? 0.5 : 1,
}))<{ isOptimistic?: boolean }>``;

const SpinnerContainer = styled(Box).attrs({
  height: 14,
  mr: 2,
  justifyContent: "center",
})``;

const BodyLeftContainer = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  flex: 1,
})``;

const BodyRightContainer = styled(Flex).attrs(p => ({
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "flex-end",
  flexShrink: p.flexShrink ?? 0,
  pl: 4,
}))``;

type Props = {
  operation: Operation;
  parentAccount: Account | undefined | null;
  account: AccountLike;
  multipleAccounts?: boolean;
  isLast: boolean;
  isSubOperation?: boolean;
};

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

export default function OperationRow({
  account,
  parentAccount,
  operation,
  isSubOperation,
  multipleAccounts,
  isLast,
}: Props) {
  const navigation = useNavigation();

  const goToOperationDetails = debounce(() => {
    const params = [
      ScreenName.OperationDetails,
      {
        accountId: account.id,
        parentId: parentAccount && parentAccount.id,
        operation, // FIXME we should pass a operationId instead because data can changes over time.
        isSubOperation,
        key: operation.id,
      },
    ];

    /** if suboperation push to stack navigation else we simply navigate */
    if (isSubOperation) navigation.push(...params);
    else navigation.navigate(...params);
  }, 300);

  const isNftOperation =
    ["NFT_IN", "NFT_OUT"].includes(operation.type) &&
    operation.contract &&
    operation.tokenId;

  const renderAmountCellExtra = useCallback(() => {
    const mainAccount = getMainAccount(account, parentAccount);
    const currency = getAccountCurrency(account);
    const unit = getAccountUnit(account);
    const specific = mainAccount.currency.family
      ? perFamilyOperationDetails[mainAccount.currency.family]
      : null;

    const SpecificAmountCell =
      specific && specific.amountCell
        ? specific.amountCell[operation.type]
        : null;

    return SpecificAmountCell ? (
      <SpecificAmountCell
        operation={operation}
        unit={unit}
        currency={currency}
      />
    ) : null;
  }, [account, operation, parentAccount]);

  const amount = getOperationAmountNumber(operation);
  const valueColor = amount.isNegative() ? "neutral.c100" : "success.c100";
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);

  const text = <Trans i18nKey={`operations.types.${operation.type}`} />;
  const isOptimistic = operation.blockHeight === null;
  const spinner = (
    <SpinnerContainer>
      <InfiniteLoader size={10} />
    </SpinnerContainer>
  );

  return (
    <ContainerTouchable
      as={TouchableOpacity}
      isLast={isLast}
      onPress={goToOperationDetails}
    >
      <Box opacity={isOptimistic ? 0.5 : 1}>
        <OperationIcon
          size={40}
          operation={operation}
          account={account}
          parentAccount={parentAccount}
        />
      </Box>
      <Wrapper opacity={isOptimistic ? 0.5 : 1}>
        <BodyLeftContainer>
          <Text
            variant="body"
            fontWeight="semiBold"
            color="neutral.c100"
            numberOfLines={1}
          >
            {multipleAccounts ? getAccountName(account) : text}
          </Text>

          {isOptimistic ? (
            <Flex flexDirection="row" alignItems="center">
              {spinner}
              <Text
                numberOfLines={1}
                variant="paragraph"
                fontWeight="medium"
                color="neutral.c70"
              >
                <Trans
                  i18nKey={
                    amount.isNegative()
                      ? "operationDetails.sending"
                      : "operationDetails.receiving"
                  }
                />
              </Text>
            </Flex>
          ) : (
            <Text
              numberOfLines={1}
              color="neutral.c70"
              variant="paragraph"
              fontWeight="medium"
            >
              {text} <OperationRowDate date={operation.date} />
            </Text>
          )}
        </BodyLeftContainer>

        <BodyRightContainer>{renderAmountCellExtra()}</BodyRightContainer>

        {isNftOperation ? (
          <BodyRightContainer flexShrink={1} maxWidth="70%">
            <OperationRowNftName
              operation={operation}
              account={account}
              parentAccount={parentAccount}
            />
          </BodyRightContainer>
        ) : amount.isZero() ? null : (
          <BodyRightContainer>
            <Text
              numberOfLines={1}
              color={valueColor}
              variant="body"
              fontWeight="semiBold"
            >
              <CurrencyUnitValue
                showCode
                unit={unit}
                value={amount}
                alwaysShowSign
              />
            </Text>
            <Text variant="paragraph" fontWeight="medium" color="neutral.c70">
              <CounterValue
                showCode
                date={operation.date}
                currency={currency}
                value={amount}
                alwaysShowSign
                withPlaceholder
                placeholderProps={placeholderProps}
              />
            </Text>
          </BodyRightContainer>
        )}
      </Wrapper>
    </ContainerTouchable>
  );
}
