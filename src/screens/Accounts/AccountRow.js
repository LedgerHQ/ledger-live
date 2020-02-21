// @flow
import React, { Fragment, PureComponent } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Trans } from "react-i18next";
import { RectButton } from "react-native-gesture-handler";
import { compose } from "redux";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { listSubAccounts } from "@ledgerhq/live-common/lib/account";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import type { Account, SubAccount } from "@ledgerhq/live-common/lib/types";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import CurrencyIcon from "../../components/CurrencyIcon";
import colors from "../../colors";
import { isUpToDateAccountSelector } from "../../reducers/accounts";
import { accountSyncStateSelector } from "../../reducers/bridgeSync";
import type { AsyncState } from "../../reducers/bridgeSync";
import AccountSyncStatus from "./AccountSyncStatus";
import Button from "../../components/Button";
import SubAccountRow from "../../components/SubAccountRow";
import withEnv from "../../logic/withEnv";

const mapStateToProps = createStructuredSelector({
  syncState: accountSyncStateSelector,
  isUpToDateAccount: isUpToDateAccountSelector,
});

type Props = {
  account: Account,
  syncState: AsyncState,
  isUpToDateAccount: boolean,
  navigation: *,
  isLast: boolean,
};

type State = {
  collapsed: boolean,
};

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

const TICK_W = 6;
const TICK_H = 20;

class AccountRow extends PureComponent<Props, State> {
  state = {
    collapsed: true,
  };

  onAccountPress = () => {
    this.props.navigation.navigate("Account", {
      accountId: this.props.account.id,
    });
  };

  onSubAccountPress = (subAccount: SubAccount) => {
    this.props.navigation.navigate("Account", {
      parentId: this.props.account.id,
      accountId: subAccount.id,
    });
  };

  onExpandSubAccountsPress = () => {
    this.setState(s => ({
      collapsed: !s.collapsed,
    }));
  };

  render() {
    const { account, isUpToDateAccount, syncState } = this.props;
    const subAccounts = listSubAccounts(account);

    const isToken =
      listTokenTypesForCryptoCurrency(account.currency).length > 0;

    return (
      <View style={styles.root}>
        <View
          style={[
            styles.accountRowCard,
            {
              elevation: subAccounts && this.state.collapsed ? 2 : 1,
            },
          ]}
        >
          <RectButton
            style={styles.button}
            underlayColor={colors.grey}
            onPress={this.onAccountPress}
          >
            <View accessible style={styles.innerContainer}>
              <CurrencyIcon size={24} currency={account.currency} />
              <View style={styles.rowContainer}>
                <View style={styles.topRow}>
                  <LText
                    semiBold
                    numberOfLines={1}
                    style={styles.accountNameText}
                  >
                    {account.name}
                  </LText>
                  <LText tertiary style={styles.balanceNumText}>
                    <CurrencyUnitValue
                      showCode
                      unit={account.unit}
                      value={account.balance}
                    />
                  </LText>
                </View>
                <View style={styles.bottomRow}>
                  <AccountSyncStatus
                    isUpToDateAccount={isUpToDateAccount}
                    {...syncState}
                  />
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
          </RectButton>
          {subAccounts.length !== 0 ? (
            <Fragment>
              <View
                style={[
                  styles.subAccountList,
                  { display: this.state.collapsed ? "none" : "flex" },
                ]}
              >
                {subAccounts.map((tkn, i) => (
                  <SubAccountRow
                    nested
                    key={i}
                    account={tkn}
                    onSubAccountPress={this.onSubAccountPress}
                  />
                ))}
              </View>
              <View style={styles.subAccountButton}>
                <Button
                  type="lightSecondary"
                  event="expandSubAccountList"
                  title={
                    <Trans
                      i18nKey={
                        this.state.collapsed
                          ? `accounts.row.${
                              isToken ? "showTokens" : "showSubAccounts"
                            }`
                          : `accounts.row.${
                              isToken ? "hideTokens" : "hideSubAccounts"
                            }`
                      }
                      values={{
                        length: subAccounts.length,
                      }}
                      count={subAccounts.length}
                    />
                  }
                  IconRight={() => (
                    <Icon
                      color={colors.live}
                      name={this.state.collapsed ? "angle-down" : "angle-up"}
                      size={16}
                    />
                  )}
                  onPress={this.onExpandSubAccountsPress}
                  size={13}
                />
              </View>
            </Fragment>
          ) : null}
        </View>
        {!!this.state.collapsed && subAccounts.length ? (
          <View style={styles.subAccountIndicator} />
        ) : null}
      </View>
    );
  }
}

const AccountCv = ({ children }: { children: * }) => (
  <LText tertiary style={styles.balanceCounterText}>
    {children}
  </LText>
);

export default compose(
  connect(mapStateToProps),
  withEnv("HIDE_EMPTY_TOKEN_ACCOUNTS"),
)(AccountRow);

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
    backgroundColor: colors.white,
    borderRadius: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: colors.black,
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
    flexDirection: "column",
    flex: 1,
  },
  subAccountIndicator: {
    zIndex: 1,
    height: 7,
    marginRight: 5,
    marginLeft: 5,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: colors.black,
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
    borderLeftColor: colors.fog,
    marginBottom: 20,
  },
  subAccountButton: {
    borderTopWidth: 1,
    borderTopColor: colors.lightFog,
  },
  topRow: {
    marginLeft: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  accountNameText: {
    color: colors.darkBlue,
    fontSize: 16,
    marginBottom: 4,
    flex: 1,
  },
  balanceNumText: {
    fontSize: 16,
    color: colors.darkBlue,
    flex: 0,
    marginLeft: 16,
  },
  bottomRow: {
    marginLeft: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceCounterContainer: {
    marginLeft: 16,
  },
  balanceCounterText: {
    fontSize: 14,
    color: colors.grey,
  },
  tickError: {
    backgroundColor: colors.alert,
  },
  tickPending: {
    backgroundColor: colors.fog,
  },
  tick: {
    position: "absolute",
    left: -TICK_W + 1, // +1 is hack for android. it would disappear otherwise^^
    width: TICK_W,
    height: TICK_H,
  },
});
