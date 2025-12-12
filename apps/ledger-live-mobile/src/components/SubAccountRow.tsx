import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import React, { memo } from "react";
import { RectButton, Gesture, GestureDetector } from "react-native-gesture-handler";
import { TokenAccount, Account } from "@ledgerhq/types-live";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import { useSelector } from "~/context/store";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";
import CurrencyIcon from "./CurrencyIcon";
import { accountSelector } from "~/reducers/accounts";
import { selectedTimeRangeSelector } from "~/reducers/settings";
import { useBalanceHistoryWithCountervalue } from "~/hooks/portfolio";
import Delta from "./Delta";
import { State as RootState } from "~/reducers/types";
import { useAccountName } from "~/reducers/wallet";
import { useAccountUnit } from "~/hooks/useAccountUnit";

type Props = {
  account: TokenAccount;
  parentAccount?: Account;
  onSubAccountPress: (subAccount: TokenAccount) => void;
  onSubAccountLongPress: (tokenAccount: TokenAccount, account?: Account) => void;
  useCounterValue?: boolean;
  testID: string;
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
  testID,
}: Props) {
  const currency = getAccountCurrency(account);
  const name = useAccountName(account);
  const unit = useAccountUnit(account);
  const range = useSelector(selectedTimeRangeSelector);
  const { countervalueChange, cryptoChange } = useBalanceHistoryWithCountervalue({
    account,
    range,
  });

  const longPressGesture = Gesture.LongPress()
    .minDuration(600)
    .onStart(() => {
      if (account.type === "TokenAccount") {
        onSubAccountLongPress(account, parentAccount);
      }
    });

  return (
    <GestureDetector gesture={longPressGesture}>
      <RectButton
        onPress={() => onSubAccountPress(account)}
        style={{ alignItems: "center" }}
        testID={testID}
      >
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
    </GestureDetector>
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
