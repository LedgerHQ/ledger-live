import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import React, { memo } from "react";
import { RectButton, LongPressGestureHandler, State } from "react-native-gesture-handler";
import { SubAccount, TokenAccount, Account } from "@ledgerhq/types-live";
import { createStructuredSelector } from "reselect";
import { connect, useSelector } from "react-redux";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";
import CurrencyIcon from "./CurrencyIcon";
import { accountSelector } from "~/reducers/accounts";
import { selectedTimeRangeSelector } from "~/reducers/settings";
import { useBalanceHistoryWithCountervalue } from "~/hooks/portfolio";
import Delta from "./Delta";
import { State as RootState } from "~/reducers/types";

type Props = {
  account: SubAccount;
  parentAccount?: Account;
  onSubAccountPress: (subAccount: SubAccount) => void;
  onSubAccountLongPress: (tokenAccount: TokenAccount, account?: Account) => void;
  useCounterValue?: boolean;
};

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

function SubAccountRow({
  account,
  parentAccount,
  onSubAccountPress,
  onSubAccountLongPress,
  useCounterValue,
}: Props) {
  const currency = getAccountCurrency(account);
  const name = getAccountName(account);
  const unit = getAccountUnit(account);
  const range = useSelector(selectedTimeRangeSelector);
  const { countervalueChange, cryptoChange } = useBalanceHistoryWithCountervalue({
    account,
    range,
  });

  return (
    <LongPressGestureHandler
      onHandlerStateChange={({ nativeEvent }) => {
        if (nativeEvent.state === State.ACTIVE) {
          if (account.type === "TokenAccount") {
            onSubAccountLongPress(account, parentAccount);
          }
        }
      }}
      minDurationMs={600}
    >
      <RectButton onPress={() => onSubAccountPress(account)} style={{ alignItems: "center" }}>
        <Flex flexDirection={"row"} alignItems={"center"} py={6}>
          <Box justifyContent={"center"}>
            <CurrencyIcon size={32} currency={currency} />
          </Box>
          <Box ml={6} flex={1}>
            <Text variant={"large"} fontWeight={"semiBold"} color={"neutral.c100"}>
              {name}
            </Text>
            <Text variant={"body"} fontWeight={"medium"} color={"neutral.c80"}>
              <CurrencyUnitValue showCode unit={unit} value={account.balance} />
            </Text>
          </Box>
          <Box flexDirection={"column"} alignItems={"flex-end"} justifyContent={"center"} ml={6}>
            <CounterValue
              showCode
              currency={currency}
              value={account.balance}
              withPlaceholder
              placeholderProps={placeholderProps}
              Wrapper={AccountCv}
            />
            {countervalueChange && (
              <Delta percent valueChange={useCounterValue ? countervalueChange : cryptoChange} />
            )}
          </Box>
        </Flex>
      </RectButton>
    </LongPressGestureHandler>
  );
}

const AccountCv = ({ children }: { children?: React.ReactNode }) => (
  <Text variant={"large"} fontWeight={"semiBold"} color={"neutral.c100"}>
    {children}
  </Text>
);

const mapStateToProps = createStructuredSelector<
  RootState,
  { accountId?: string; parentAccount?: Account },
  {
    parentAccount: Account | undefined;
  }
>({
  parentAccount: accountSelector,
});

const SubAccountRowComponent = connect(mapStateToProps)(SubAccountRow);

export default memo(SubAccountRowComponent);
