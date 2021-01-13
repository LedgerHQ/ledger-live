// @flow
import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Platform, TouchableHighlight } from "react-native";
import { Trans } from "react-i18next";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { useAccountSyncState } from "@ledgerhq/live-common/lib/bridge/react";
import {
  listSubAccounts,
  isUpToDateAccount,
} from "@ledgerhq/live-common/lib/account";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import type {
  Account,
  SubAccount,
  TokenAccount,
} from "@ledgerhq/live-common/lib/types";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import CurrencyIcon from "../../components/CurrencyIcon";
import AccountSyncStatus from "./AccountSyncStatus";
import Button from "../../components/Button";
import SubAccountRow from "../../components/SubAccountRow";
import perFamilySubAccountList from "../../generated/SubAccountList";
import { rgba } from "../../colors";

type Props = {
  account: Account,
  accountId: string,
  navigation: *,
  isLast: boolean,
  onSetAccount: TokenAccount => void,
};

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

const TICK_W = 6;
const TICK_H = 20;

const AccountRow = ({
  navigation,
  account,
  accountId,
  onSetAccount,
}: Props) => {
  // makes it refresh if this changes
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const { colors } = useTheme();

  const syncState = useAccountSyncState({ accountId });

  const upToDate = isUpToDateAccount(account);

  const [collapsed, setCollapsed] = useState(true);

  const onAccountPress = useCallback(() => {
    navigation.navigate(ScreenName.Account, {
      accountId,
      isForwardedFromAccounts: true,
    });
  }, [accountId, navigation]);

  const onSubAccountPress = useCallback(
    (subAccount: SubAccount) => {
      navigation.navigate(ScreenName.Account, {
        parentId: accountId,
        accountId: subAccount.id,
      });
    },
    [accountId, navigation],
  );

  const onExpandSubAccountsPress = useCallback(() => {
    setCollapsed(collapsed => !collapsed);
  }, []);

  const subAccounts = listSubAccounts(account);

  const isToken = listTokenTypesForCryptoCurrency(account.currency).length > 0;

  const onSubAccountLongPress = useCallback(account => onSetAccount(account), [
    onSetAccount,
  ]);

  const family = account.currency.family;
  const specific = perFamilySubAccountList[family];

  const hasSpecificTokenWording = specific && specific.hasSpecificTokenWording;

  const underlayColor = useMemo(() => rgba(colors.darkBlue, 0.05), [colors]);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.accountRowCard,
          {
            elevation: subAccounts && collapsed ? 2 : 1,
            backgroundColor: colors.card,
            ...Platform.select({
              android: {},
              ios: {
                shadowColor: colors.black,
              },
            }),
          },
        ]}
      >
        <TouchableHighlight
          style={styles.button}
          underlayColor={underlayColor}
          onPress={onAccountPress}
        >
          <View accessible style={styles.innerContainer}>
            <CurrencyIcon size={24} currency={account.currency} />
            <View style={styles.rowContainer}>
              <View style={styles.topRow}>
                <LText
                  semiBold
                  numberOfLines={1}
                  style={styles.accountNameText}
                  color="darkBlue"
                >
                  {account.name}
                </LText>

                <AccountSyncStatus
                  {...syncState}
                  isUpToDateAccount={upToDate}
                />
              </View>
              <View style={styles.bottomRow}>
                <LText semiBold style={styles.balanceNumText}>
                  <CurrencyUnitValue
                    showCode
                    unit={account.unit}
                    value={account.balance}
                  />
                </LText>
                <View style={styles.balanceCounterContainer}>
                  <CounterValue
                    showCode
                    currency={account.currency}
                    value={account.balance}
                    withPlaceholder
                    placeholderProps={placeholderProps}
                    Wrapper={AccountCv}
                  />
                </View>
              </View>
            </View>
          </View>
        </TouchableHighlight>
        {subAccounts.length !== 0 ? (
          <>
            <View
              style={[
                styles.subAccountList,
                {
                  display: collapsed ? "none" : "flex",
                  borderLeftColor: colors.fog,
                },
              ]}
            >
              {subAccounts.map((tkn, i) => (
                <SubAccountRow
                  nested
                  key={i}
                  account={tkn}
                  onSubAccountPress={onSubAccountPress}
                  onSubAccountLongPress={onSubAccountLongPress}
                />
              ))}
            </View>
            <View
              style={[
                styles.subAccountButton,
                { borderTopColor: colors.lightFog },
              ]}
            >
              <Button
                type="lightSecondary"
                event="expandSubAccountList"
                title={
                  <Trans
                    i18nKey={
                      collapsed
                        ? `accounts.row.${
                            isToken
                              ? hasSpecificTokenWording
                                ? `${family}.showTokens`
                                : "showTokens"
                              : "showSubAccounts"
                          }`
                        : `accounts.row.${
                            isToken
                              ? hasSpecificTokenWording
                                ? `${family}.hideTokens`
                                : "hideTokens"
                              : "hideSubAccounts"
                          }`
                    }
                    values={{
                      length: subAccounts.length,
                    }}
                    count={subAccounts.length}
                  />
                }
                IconRight={() => (
                  <View style={{ paddingLeft: 6 }}>
                    <Icon
                      color={colors.live}
                      name={collapsed ? "angle-down" : "angle-up"}
                      size={16}
                    />
                  </View>
                )}
                onPress={onExpandSubAccountsPress}
                size={13}
              />
            </View>
          </>
        ) : null}
      </View>
      {!!collapsed && subAccounts.length ? (
        <View
          style={[
            styles.subAccountIndicator,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.lightGrey,
              ...Platform.select({
                android: {},
                ios: {
                  shadowColor: colors.black,
                },
              }),
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const AccountCv = ({ children }: { children: * }) => (
  <LText semiBold color="grey" style={styles.balanceCounterText}>
    {children}
  </LText>
);

export default React.memo<Props>(AccountRow);

const styles = StyleSheet.create({
  button: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  root: {
    marginTop: 8,
    marginLeft: 8,
    marginRight: 8,
  },
  accountRowCard: {
    zIndex: 2,

    borderRadius: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
  innerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    overflow: "visible",
  },
  rowContainer: {
    flexDirection: "row",
    flex: 1,
  },
  subAccountIndicator: {
    zIndex: 1,
    height: 7,
    marginRight: 5,
    marginLeft: 5,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderTopWidth: 1,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: {
          height: 2,
        },
      },
    }),
  },
  subAccountList: {
    marginLeft: 26,
    paddingLeft: 12,
    paddingRight: 12,
    borderLeftWidth: 1,

    marginBottom: 20,
  },
  subAccountButton: {
    borderTopWidth: 1,
  },
  topRow: {
    marginLeft: 16,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
  },
  accountNameText: {
    fontSize: 16,
    marginBottom: 4,
    flex: 1,
  },
  balanceNumText: {
    fontSize: 16,

    flex: 0,
    marginLeft: 16,
  },
  bottomRow: {
    marginLeft: 16,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  balanceCounterContainer: {
    marginLeft: 16,
  },
  balanceCounterText: {
    fontSize: 14,
  },
  tick: {
    position: "absolute",
    left: -TICK_W + 1, // +1 is hack for android. it would disappear otherwise^^
    width: TICK_W,
    height: TICK_H,
  },
});
