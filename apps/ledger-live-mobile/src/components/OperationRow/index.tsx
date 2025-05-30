import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import styled, { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import {
  getOperationAmountNumber,
  isConfirmedOperation,
  isEditableOperation,
  isStuckOperation,
} from "@ledgerhq/live-common/operation";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { Account, Operation, AccountLike } from "@ledgerhq/types-live";
import { Box, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { WarningMedium } from "@ledgerhq/native-ui/assets/icons";
import debounce from "lodash/debounce";
import isEqual from "lodash/isEqual";
import { useSelector } from "react-redux";
import CurrencyUnitValue from "../CurrencyUnitValue";
import CounterValue from "../CounterValue";
import OperationIcon from "../OperationIcon";
import { ScreenName } from "~/const";
import OperationRowDate from "../OperationRowDate";
import OperationRowNftName from "../OperationRowNftName";
import perFamilyOperationDetails from "../../generated/operationDetails";
import { track } from "~/analytics";
import { UnionToIntersection } from "~/types/helpers";
import { BaseNavigation } from "../RootNavigator/types/helpers";
import { currencySettingsForAccountSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";
import { useAccountName } from "~/reducers/wallet";
import { useAccountUnit } from "~/hooks/useAccountUnit";

type FamilyOperationDetailsIntersection = UnionToIntersection<
  (typeof perFamilyOperationDetails)[keyof typeof perFamilyOperationDetails]
>;

const ContainerTouchable = styled(Flex).attrs(_ => ({
  height: "64px",
  flexDirection: "row",
  alignItems: "center",
  px: 0,
  py: 6,
}))<{ isLast?: boolean }>``;

const Wrapper = styled(Flex).attrs<{ isOptimistic?: boolean }>(p => ({
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

const BodyRightContainer = styled(Flex).attrs<{ flexShrink?: number }>(p => ({
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "flex-end",
  flexShrink: p.flexShrink ?? 0,
  pl: 4,
}))<{ flexShrink?: number }>``;

type Props = {
  operation: Operation;
  parentAccount: Account | undefined | null;
  account: AccountLike;
  multipleAccounts?: boolean;
  isLast: boolean;
  isSubOperation?: boolean;
  testID?: string;
};

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

function OperationRow({
  account,
  parentAccount,
  operation,
  isSubOperation,
  multipleAccounts,
  isLast,
  testID,
}: Props) {
  const navigation = useNavigation<BaseNavigation>();

  const goToOperationDetails = debounce(() => {
    track("transaction_clicked", {
      transaction: operation.type,
    });
    const params = [
      ScreenName.OperationDetails,
      {
        accountId: account.id,
        parentId: parentAccount && parentAccount.id,
        operation, // FIXME we should pass a operationId instead because data can changes over time.
        isSubOperation,
        key: operation.id,
      },
    ] as const;

    /** if suboperation push to stack navigation else we simply navigate */
    if (isSubOperation) navigation.push(...params);
    else navigation.navigate(...params);
  }, 300);

  const isNftOperation =
    ["NFT_IN", "NFT_OUT"].includes(operation.type) && operation.contract && operation.tokenId;

  const unit = useAccountUnit(account);

  const renderAmountCellExtra = useCallback(() => {
    const mainAccount = getMainAccount(account, parentAccount);
    const currency = getAccountCurrency(account);

    const specific = mainAccount?.currency?.family
      ? (perFamilyOperationDetails[
          mainAccount.currency.family as keyof typeof perFamilyOperationDetails
        ] as FamilyOperationDetailsIntersection)
      : null;

    const SpecificAmountCell =
      specific && specific.amountCell
        ? specific.amountCell[operation.type as keyof typeof specific.amountCell]
        : null;

    return SpecificAmountCell ? (
      <SpecificAmountCell operation={operation} unit={unit} currency={currency} />
    ) : null;
  }, [account, operation, parentAccount, unit]);

  const { colors } = useTheme();
  const amount = getOperationAmountNumber(operation);
  const currency = getAccountCurrency(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const accountName = useAccountName(account);
  const currencySettings = useSelector((s: State) =>
    currencySettingsForAccountSelector(s.settings, {
      account: mainAccount,
    }),
  );
  const isConfirmed = isConfirmedOperation(
    operation,
    mainAccount,
    currencySettings.confirmationsNb,
  );
  const valueColor = amount.isNegative()
    ? colors.neutral.c100
    : isConfirmed
      ? colors.success.c50
      : colors.warning.c50;

  const text = <Trans i18nKey={`operations.types.${operation.type}`} />;
  const isOptimistic = operation.blockHeight === null;
  const isOperationStuck =
    isEditableOperation({ account: mainAccount, operation }) &&
    isStuckOperation({ family: mainAccount.currency.family, operation });

  const spinner = isOperationStuck ? (
    <WarningMedium />
  ) : (
    <SpinnerContainer>
      <InfiniteLoader size={10} />
    </SpinnerContainer>
  );

  return (
    <ContainerTouchable as={TouchableOpacity} isLast={isLast} onPress={goToOperationDetails}>
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
            color={colors.neutral.c100}
            numberOfLines={1}
            testID={testID}
          >
            {multipleAccounts ? accountName : text}
          </Text>

          {isOptimistic ? (
            <Flex flexDirection="row" alignItems="center" testID="spinner-container">
              {spinner}
              <Text
                numberOfLines={1}
                variant="paragraph"
                fontWeight="medium"
                color={colors.neutral.c70}
              >
                <Trans
                  i18nKey={
                    amount.isNegative() ? "operationDetails.sending" : "operationDetails.receiving"
                  }
                />
              </Text>
            </Flex>
          ) : (
            <Text
              numberOfLines={1}
              color={colors.neutral.c70}
              variant="paragraph"
              fontWeight="medium"
              testID="operationRowDate"
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
              testID="portfolio-operation-amount"
            >
              <CurrencyUnitValue showCode unit={unit} value={amount} alwaysShowSign />
            </Text>
            <Text variant="paragraph" fontWeight="medium" color={colors.neutral.c70}>
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

/**
 * you might be surprised but isEqual on these objects is actually very fast
 * (are we keeping the same object refs at a deep level? no lo se señor)
 * */
export default React.memo(OperationRow, isEqual);
