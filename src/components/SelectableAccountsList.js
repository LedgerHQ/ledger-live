// @flow

import React, { PureComponent, useCallback } from "react";
import { Trans } from "react-i18next";
import {
  Animated,
  View,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import type { Account } from "@ledgerhq/live-common/lib/types";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { ScreenName } from "../const";
import { track } from "../analytics";
import AccountCard from "./AccountCard";
import CheckBox from "./CheckBox";
import LText from "./LText";
import swipedAccountSubject from "../screens/AddAccounts/swipedAccountSubject";
import Button from "./Button";
import TouchHintCircle from "./TouchHintCircle";

const selectAllHitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

type Props = {
  accounts: Account[],
  onPressAccount?: Account => void,
  onSelectAll?: (Account[]) => void,
  onUnselectAll?: (Account[]) => void,
  selectedIds: string[],
  isDisabled?: boolean,
  forceSelected?: boolean,
  emptyState?: React$Node,
  header: React$Node,
  style?: *,
  index: number,
  showHint: boolean,
  onAccountNameChange?: (name: string, changedAccount: Account) => void,
};

export default function SelectableAccountsList({
  accounts,
  onPressAccount,
  onSelectAll: onSelectAllProp,
  onUnselectAll: onUnselectAllProp,
  selectedIds = [],
  isDisabled = false,
  forceSelected,
  emptyState,
  header,
  showHint = false,
  index = -1,
  onAccountNameChange,
  style,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const onSelectAll = useCallback(() => {
    track("SelectAllAccounts");
    onSelectAllProp && onSelectAllProp(accounts);
  }, [accounts, onSelectAllProp]);

  const onUnselectAll = useCallback(() => {
    track("UnselectAllAccounts");
    onUnselectAllProp && onUnselectAllProp(accounts);
  }, [accounts, onUnselectAllProp]);

  const areAllSelected = accounts.every(a => selectedIds.indexOf(a.id) > -1);
  return (
    <View style={[styles.root, style]}>
      {header ? (
        <Header
          text={header}
          areAllSelected={areAllSelected}
          onSelectAll={onSelectAllProp ? onSelectAll : undefined}
          onUnselectAll={onUnselectAllProp ? onUnselectAll : undefined}
        />
      ) : null}
      {accounts.map((account, rowIndex) => (
        <SelectableAccount
          navigation={navigation}
          showHint={!rowIndex && showHint}
          rowIndex={rowIndex}
          listIndex={index}
          key={account.id}
          account={account}
          onAccountNameChange={onAccountNameChange}
          isSelected={forceSelected || selectedIds.indexOf(account.id) > -1}
          isDisabled={isDisabled}
          onPress={onPressAccount}
          colors={colors}
        />
      ))}
      {accounts.length === 0 && emptyState ? emptyState : null}
    </View>
  );
}

class SelectableAccount extends PureComponent<
  {
    account: Account,
    onPress?: Account => void,
    isDisabled?: boolean,
    isSelected?: boolean,
    showHint: boolean,
    rowIndex: number,
    listIndex: number,
    navigation: *,
    onAccountNameChange?: (name: string, changedAccount: Account) => void,
    colors: *,
  },
  { stopAnimation: boolean },
> {
  state = {
    stopAnimation: false,
  };
  onPress = () => {
    const { onPress, account, isSelected } = this.props;
    track(isSelected ? "UnselectAccount" : "SelectAccount");
    if (onPress) onPress(account);
  };

  panResponder: *;
  swipeableRow: Swipeable;

  updateRef = ref => {
    if (ref) this.swipeableRow = ref;
  };

  renderLeftActions = (progress, dragX) => {
    const translateX = dragX.interpolate({
      inputRange: [0, 1000],
      outputRange: [-112, 888],
    });

    return (
      <Animated.View
        style={[
          styles.leftAction,
          { transform: [{ translateX }] },
          { marginLeft: 12 },
        ]}
      >
        <Button
          event="EditAccountNameFromSlideAction"
          type="primary"
          title={<Trans i18nKey="common.editName" />}
          onPress={this.editAccountName}
          containerStyle={styles.buttonContainer}
        />
      </Animated.View>
    );
  };

  editAccountName = () => {
    const { account, navigation, onAccountNameChange } = this.props;
    if (!onAccountNameChange) return;
    swipedAccountSubject.next({ row: -1, list: -1 });
    navigation.navigate(ScreenName.EditAccountName, {
      onAccountNameChange,
      account,
    });
  };

  componentDidMount() {
    swipedAccountSubject.subscribe(msg => {
      const { row, list } = msg;
      this.setState({ stopAnimation: true });
      if (
        this.swipeableRow &&
        (row !== this.props.rowIndex || list !== this.props.listIndex)
      ) {
        this.swipeableRow.close();
      }
    });
  }

  constructor(props) {
    super(props);
    const { rowIndex, listIndex } = this.props;
    this.panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderGrant: () => {
        if (swipedAccountSubject) {
          this.setState({ stopAnimation: true });
          swipedAccountSubject.next({ rowIndex, listIndex });
        }
      },

      onShouldBlockNativeResponder: () => false,
    });
  }

  render() {
    const { showHint, isDisabled, isSelected, account, colors } = this.props;
    const { stopAnimation } = this.state;
    const subAccountCount = account.subAccounts && account.subAccounts.length;
    const isToken =
      listTokenTypesForCryptoCurrency(account.currency).length > 0;

    const inner = (
      <View
        style={[
          styles.selectableAccountRoot,
          isDisabled && styles.selectableAccountRootDisabled,
        ]}
      >
        <AccountCard account={account} parentAccount={null} />
        {!isDisabled && (
          <CheckBox
            onChange={this.onPress ? this.onPress : undefined}
            isChecked={!!isSelected}
            style={styles.selectableAccountCheckbox}
          />
        )}
      </View>
    );
    if (isDisabled) return inner;

    return (
      <View {...this.panResponder.panHandlers}>
        <Swipeable
          ref={this.updateRef}
          friction={2}
          leftThreshold={50}
          renderLeftActions={this.renderLeftActions}
        >
          {inner}
          {subAccountCount ? (
            <View style={styles.subAccountCountWrapper}>
              <View
                style={[
                  styles.subAccountCount,
                  { backgroundColor: colors.pillActiveBackground },
                ]}
              >
                <LText
                  semiBold
                  style={styles.subAccountCountText}
                  color="pillActiveForeground"
                >
                  <Trans
                    i18nKey={`selectableAccountsList.${
                      isToken ? "tokenCount" : "subaccountCount"
                    }`}
                    count={subAccountCount}
                    values={{ count: subAccountCount }}
                  />
                </LText>
              </View>
            </View>
          ) : null}
          {showHint && (
            <TouchHintCircle
              stopAnimation={stopAnimation}
              visible={showHint}
              style={styles.pulsatingCircle}
            />
          )}
        </Swipeable>
      </View>
    );
  }
}

class Header extends PureComponent<{
  text: React$Node,
  areAllSelected: boolean,
  onSelectAll?: () => void,
  onUnselectAll?: () => void,
}> {
  render() {
    const { text, areAllSelected, onSelectAll, onUnselectAll } = this.props;
    const shouldDisplaySelectAll = !!onSelectAll && !!onUnselectAll;
    return (
      <View style={styles.listHeader}>
        <LText semiBold style={styles.headerText} color="grey">
          {text}
        </LText>
        {shouldDisplaySelectAll && (
          <TouchableOpacity
            style={styles.headerSelectAll}
            onPress={areAllSelected ? onUnselectAll : onSelectAll}
            hitSlop={selectAllHitSlop}
          >
            <LText style={styles.headerSelectAllText} color="live">
              {areAllSelected ? (
                <Trans i18nKey="selectableAccountsList.deselectAll" />
              ) : (
                <Trans i18nKey="selectableAccountsList.selectAll" />
              )}
            </LText>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 24,
  },
  selectableAccountRoot: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  selectableAccountRootDisabled: {
    opacity: 0.4,
  },
  selectableAccountCheckbox: {
    marginLeft: 16,
  },
  listHeader: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
  },
  headerSelectAll: {
    flexShrink: 1,
  },
  headerSelectAllText: {
    fontSize: 14,
  },
  headerText: {
    flexGrow: 1,
    fontSize: 14,
  },
  leftAction: {
    width: "auto",
    flexDirection: "row",
    alignItems: "center",
  },
  pulsatingCircle: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
  },
  buttonContainer: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  subAccountCountWrapper: {
    flexDirection: "row",
    marginLeft: 45,
    marginTop: -11,
  },
  subAccountCount: {
    padding: 4,
    borderRadius: 4,
  },
  subAccountCountText: {
    fontSize: 10,
  },
});
