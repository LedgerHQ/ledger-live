// @flow

import React, { PureComponent, Component } from "react";
import { Trans } from "react-i18next";
import {
  Animated,
  View,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
} from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { withNavigation } from "react-navigation";
import Swipeable from "react-native-gesture-handler/Swipeable";
import type { NavigationScreenProp } from "react-navigation";
import { track } from "../analytics";
import AccountCard from "./AccountCard";
import CheckBox from "./CheckBox";
import LText from "./LText";
import swipedAccountSubject from "../screens/AddAccounts/swipedAccountSubject";
import colors from "../colors";
import Button from "./Button";
import TouchHintCircle from "./TouchHintCircle";

const selectAllHitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

type ListProps = {
  navigation: NavigationScreenProp<*>,
  accounts: Account[],
  onPressAccount?: Account => void,
  onSelectAll?: (Account[]) => void,
  onUnselectAll?: (Account[]) => void,
  selectedIds: string[],
  isDisabled?: boolean,
  forceSelected?: boolean,
  EmptyState?: React$ComponentType<*>,
  header: React$Node,
  style?: *,
  index: number,
  showHint: boolean,
  onAccountNameChange?: (name: string, changedAccount: Account) => void,
};

class SelectableAccountsList extends Component<ListProps> {
  static defaultProps = {
    selectedIds: [],
    isDisabled: false,
    showHint: false,
    index: -1,
  };

  onSelectAll = () => {
    const { onSelectAll, accounts } = this.props;
    track("SelectAllAccounts");
    onSelectAll && onSelectAll(accounts);
  };

  onUnselectAll = () => {
    const { onUnselectAll, accounts } = this.props;
    track("UnselectAllAccounts");
    onUnselectAll && onUnselectAll(accounts);
  };

  render() {
    const {
      accounts,
      onPressAccount,
      onSelectAll,
      onUnselectAll,
      selectedIds,
      isDisabled,
      forceSelected,
      EmptyState,
      header,
      showHint,
      index,
      navigation,
      onAccountNameChange,
      style,
    } = this.props;
    const areAllSelected = accounts.every(a => selectedIds.indexOf(a.id) > -1);
    return (
      <View style={[styles.root, style]}>
        {header ? (
          <Header
            text={header}
            areAllSelected={areAllSelected}
            onSelectAll={onSelectAll ? this.onSelectAll : undefined}
            onUnselectAll={onUnselectAll ? this.onUnselectAll : undefined}
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
          />
        ))}
        {accounts.length === 0 && EmptyState ? <EmptyState /> : null}
      </View>
    );
  }
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
    navigation: NavigationScreenProp<*>,
    onAccountNameChange?: (name: string, changedAccount: Account) => void,
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
          title="Edit Name"
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
    navigation.navigate("EditAccountName", {
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
    const { showHint, isDisabled, isSelected, account } = this.props;
    const { stopAnimation } = this.state;
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
          style={{ backgroundColor: "#ffffff" }}
        >
          {inner}
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
        <LText semiBold style={styles.headerText}>
          {text}
        </LText>
        {shouldDisplaySelectAll && (
          <TouchableOpacity
            style={styles.headerSelectAll}
            onPress={areAllSelected ? onUnselectAll : onSelectAll}
            hitSlop={selectAllHitSlop}
          >
            <LText style={styles.headerSelectAllText}>
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
    color: colors.live,
  },
  headerText: {
    flexGrow: 1,
    fontSize: 14,
    color: colors.grey,
  },
  leftAction: {
    width: 100,
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
    flex: 1,
  },
});

export default withNavigation(SelectableAccountsList);
