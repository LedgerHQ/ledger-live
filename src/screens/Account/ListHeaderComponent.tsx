import React, { ReactNode } from "react";
import {
  isAccountEmpty,
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import {
  Unit,
  AccountLike,
  Account,
  Currency,
} from "@ledgerhq/live-common/lib/types";
import { ValueChange } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";

import { Box, Flex, Text } from "@ledgerhq/native-ui";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Header from "./Header";
import AccountGraphCard from "../../components/AccountGraphCard";
import Touchable from "../../components/Touchable";
import TransactionsPendingConfirmationWarning from "../../components/TransactionsPendingConfirmationWarning";
import { Item } from "../../components/Graph/types";
import SubAccountsList from "./SubAccountsList";
import NftCollectionsList from "./NftCollectionsList";
import CompoundSummary from "../Lending/Account/CompoundSummary";
import CompoundAccountBodyHeader from "../Lending/Account/AccountBodyHeader";
import perFamilyAccountHeader from "../../generated/AccountHeader";
import perFamilyAccountSubHeader from "../../generated/AccountSubHeader";
import perFamilyAccountBodyHeader from "../../generated/AccountBodyHeader";
import perFamilyAccountBalanceSummaryFooter from "../../generated/AccountBalanceSummaryFooter";
import { FabAccountActions } from "../../components/FabActions";
import { NoCountervaluePlaceholder } from "../../components/CounterValue.js";
import DiscreetModeButton from "../../components/DiscreetModeButton";
import Delta from "../../components/Delta";

const renderAccountSummary = (
  account,
  parentAccount,
  compoundSummary,
) => () => {
  const mainAccount = getMainAccount(account, parentAccount);
  const AccountBalanceSummaryFooter =
    perFamilyAccountBalanceSummaryFooter[mainAccount.currency.family];

  const footers = [];

  if (compoundSummary && account.type === "TokenAccount") {
    footers.push(
      <CompoundSummary
        key="compoundSummary"
        account={account}
        compoundSummary={compoundSummary}
      />,
    );
  }

  if (AccountBalanceSummaryFooter)
    footers.push(
      <AccountBalanceSummaryFooter
        account={account}
        key="accountbalancesummary"
      />,
    );
  if (!footers.length) return null;
  return footers;
};

type HeaderTitleProps = {
  useCounterValue?: boolean;
  cryptoCurrencyUnit: Unit;
  counterValueUnit: Unit;
  item: Item;
};

const ListHeaderTitle = ({
  account,
  countervalueAvailable,
  onSwitchAccountCurrency,
  valueChange,
  useCounterValue,
  cryptoCurrencyUnit,
  counterValueUnit,
  item,
}: HeaderTitleProps) => {
  const items = [
    { unit: cryptoCurrencyUnit, value: item.value },
    { unit: counterValueUnit, value: item.countervalue },
  ];

  const shouldUseCounterValue = countervalueAvailable && useCounterValue;
  if (shouldUseCounterValue) {
    items.reverse();
  }

  return (
    <Flex flexDirection={"row"} justifyContent={"space-between"}>
      <Touchable
        event="SwitchAccountCurrency"
        eventProperties={{ useCounterValue: shouldUseCounterValue }}
        onPress={countervalueAvailable ? onSwitchAccountCurrency : undefined}
        style={{ flexShrink: 1 }}
      >
        <Flex>
          <Flex flexDirection={"row"}>
            <Text variant={"large"} fontWeight={"medium"} color={"neutral.c70"}>
              <CurrencyUnitValue
                {...items[0]}
                disableRounding
                joinFragmentsSeparator=" "
              />
            </Text>
            <TransactionsPendingConfirmationWarning maybeAccount={account} />
          </Flex>
          <Text variant={"h1"}>
            {typeof items[1]?.value === "number" ? (
              <CurrencyUnitValue {...items[1]} />
            ) : (
              <NoCountervaluePlaceholder />
            )}
          </Text>
          <Delta percent valueChange={valueChange} />
        </Flex>
      </Touchable>
      <Flex justifyContent={"center"} ml={4}>
        <DiscreetModeButton />
      </Flex>
    </Flex>
  );
};

type Props = {
  account?: AccountLike;
  parentAccount?: Account;
  countervalueAvailable: boolean;
  useCounterValue: boolean;
  range: any;
  history: any;
  countervalueChange: ValueChange;
  cryptoChange: ValueChange;
  counterValueCurrency: Currency;
  onAccountPress: () => void;
  onSwitchAccountCurrency: () => void;
  compoundSummary?: CompoundAccountSummary;
};

export function getListHeaderComponents({
  account,
  parentAccount,
  countervalueAvailable,
  useCounterValue,
  range,
  history,
  countervalueChange,
  cryptoChange,
  counterValueCurrency,
  onAccountPress,
  onSwitchAccountCurrency,
  compoundSummary,
}: Props): {
  listHeaderComponents: ReactNode[];
  stickyHeaderIndices?: number[];
} {
  if (!account)
    return { listHeaderComponents: [], stickyHeaderIndices: undefined };

  const mainAccount = getMainAccount(account, parentAccount);

  const empty = isAccountEmpty(account);
  const shouldUseCounterValue = countervalueAvailable && useCounterValue;

  const AccountHeader = perFamilyAccountHeader[mainAccount.currency.family];
  const AccountBodyHeader =
    perFamilyAccountBodyHeader[mainAccount.currency.family];

  const AccountSubHeader =
    perFamilyAccountSubHeader[mainAccount.currency.family];

  const stickyHeaderIndices = empty ? [] : [4];

  return {
    listHeaderComponents: [
      <Header accountId={account.id} />,
      !!AccountSubHeader && <AccountSubHeader />,
      !empty && !!AccountHeader && (
        <AccountHeader account={account} parentAccount={parentAccount} />
      ),
      !empty && (
        <Box mx={6} my={6}>
          <ListHeaderTitle
            account={account}
            countervalueAvailable={countervalueAvailable}
            onSwitchAccountCurrency={onSwitchAccountCurrency}
            countervalueChange={countervalueChange}
            counterValueUnit={counterValueCurrency.units[0]}
            useCounterValue={useCounterValue}
            cryptoCurrencyUnit={getAccountUnit(account)}
            item={history[history.length - 1]}
            valueChange={
              shouldUseCounterValue ? countervalueChange : cryptoChange
            }
          />
        </Box>
      ),
      ...(!empty
        ? [
            <Box py={3}>
              <FabAccountActions
                account={account}
                parentAccount={parentAccount}
              />
            </Box>,
          ]
        : []),
      !empty && (
        <Box mx={6} mt={7} mb={8} pb={6}>
          <AccountGraphCard
            account={account}
            range={range}
            history={history}
            useCounterValue={shouldUseCounterValue}
            valueChange={
              shouldUseCounterValue ? countervalueChange : cryptoChange
            }
            countervalueAvailable={countervalueAvailable}
            counterValueCurrency={counterValueCurrency}
            renderAccountSummary={renderAccountSummary(
              account,
              parentAccount,
              compoundSummary,
            )}
          />
        </Box>
      ),

      ...(!empty && AccountBodyHeader
        ? [
            <AccountBodyHeader
              account={account}
              parentAccount={parentAccount}
            />,
          ]
        : []),
      ...(!empty && account.type === "Account" && account.subAccounts
        ? [
            <Box mx={6} mb={8} pb={6}>
              <SubAccountsList
                accountId={account.id}
                onAccountPress={onAccountPress}
                parentAccount={account}
                useCounterValue={shouldUseCounterValue}
              />
            </Box>,
          ]
        : []),
      ...(!empty && account.type === "Account" && account.nfts?.length
        ? [<NftCollectionsList account={account} />]
        : []),
      ...(compoundSummary &&
      account &&
      account.type === "TokenAccount" &&
      parentAccount
        ? [
            <CompoundAccountBodyHeader
              account={account}
              parentAccount={parentAccount}
              compoundSummary={compoundSummary}
            />,
          ]
        : []),
    ],
    stickyHeaderIndices,
  };
}
