import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "react-i18next";
import {
  Animated as RNAnimated,
  View,
  TouchableOpacity,
  PanResponder,
  FlatList,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  TextStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { Account } from "@ledgerhq/types-live";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import Swipeable from "react-native-gesture-handler/Swipeable";

import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import AccountCard from "./AccountCard";
import CheckBox from "./CheckBox";
import swipedAccountSubject from "~/screens/AddAccounts/swipedAccountSubject";
import Button from "./Button";
import TouchHintCircle from "./TouchHintCircle";
import Touchable from "./Touchable";
import { AccountSettingsNavigatorParamList } from "./RootNavigator/types/AccountSettingsNavigator";
import AccountItem from "LLM/features/Accounts/components/AccountsListView/components/AccountItem";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { BaseComposite, StackNavigatorProps } from "./RootNavigator/types/helpers";
import Animated from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import { TextVariants } from "@ledgerhq/native-ui/lib/styles/theme";
import useItemAnimation from "LLM/features/Accounts/components/AccountsListView/components/AnimatedAccountItem/useItemAnimation";

const selectAllHitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

type Props = FlexBoxProps & {
  accounts: Account[];
  onPressAccount?: (_: Account) => void;
  onSelectAll?: (_: Account[], autoSelect?: boolean) => void;
  onUnselectAll?: (_: Account[]) => void;
  selectedIds: string[];
  isDisabled?: boolean;
  forceSelected?: boolean;
  emptyState?: ReactNode;
  header: ReactNode;
  style?: StyleProp<ViewStyle>;
  index: number;
  showHint: boolean;
  onAccountNameChange?: (name: string, changedAccount: Account) => void;
  useFullBalance?: boolean;
};

type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountSettingsNavigatorParamList, ScreenName.EditAccountName>
>["navigation"];

// This will need to be removed once isNetworkBasedAddAccountFlowEnabled is removed
type SelectAllTextColorFn = (areAllSelected: boolean) => string;

const getConditionalStyles = (isNetworkBasedAddAccountFlowEnabled?: boolean, space?: number[]) => ({
  selectableAccount: {
    marginTop: isNetworkBasedAddAccountFlowEnabled ? space?.[6] : 3,
    marginX: 6,
    paddingX: isNetworkBasedAddAccountFlowEnabled ? space?.[6] : 6,
    paddingY: isNetworkBasedAddAccountFlowEnabled ? space?.[6] : 3,
    columnGap: isNetworkBasedAddAccountFlowEnabled ? space?.[4] : 4,
    borderRadius: isNetworkBasedAddAccountFlowEnabled ? space?.[4] : 4,
    backgroundColor: isNetworkBasedAddAccountFlowEnabled ? "opacityDefault.c05" : "neutral.c30",
  },
  header: {
    paddingX: isNetworkBasedAddAccountFlowEnabled ? 16 : 22,
    paddingBottom: isNetworkBasedAddAccountFlowEnabled ? 0 : 8,
  },
  headerText: {
    variant: isNetworkBasedAddAccountFlowEnabled ? "paragraph" : ("small" as TextVariants),
    textTransform: (!isNetworkBasedAddAccountFlowEnabled
      ? "uppercase"
      : undefined) as TextStyle["textTransform"],
  },
  selectAllText: {
    getColor: (isNetworkBasedAddAccountFlowEnabled
      ? (areAllSelected: boolean) => (areAllSelected ? "neutral.c80" : "constant.purple")
      : () => "neutral.c70") as SelectAllTextColorFn,
  },
});

const SelectableAccountsList = ({
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
  index: listIndex = -1,
  onAccountNameChange,
  useFullBalance,
  ...props
}: Props) => {
  const navigation = useNavigation<NavigationProps>();

  const onSelectAll = useCallback(() => {
    track("SelectAllAccounts");
    onSelectAllProp && onSelectAllProp(accounts);
  }, [accounts, onSelectAllProp]);

  const onUnselectAll = useCallback(() => {
    track("UnselectAllAccounts");
    onUnselectAllProp && onUnselectAllProp(accounts);
  }, [accounts, onUnselectAllProp]);

  const areAllSelected = accounts.every(a => selectedIds.indexOf(a.id) > -1);
  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");

  const renderSelectableAccount = useCallback(
    ({ item, index }: { index: number; item: Account }) =>
      llmNetworkBasedAddAccountFlow?.enabled ? (
        <SelectableAccount
          navigation={navigation}
          showHint={!index && showHint}
          rowIndex={index}
          listIndex={listIndex}
          account={item}
          onAccountNameChange={onAccountNameChange}
          isSelected={forceSelected || selectedIds.indexOf(item.id) > -1}
          isDisabled={isDisabled}
          onPress={onPressAccount}
          useFullBalance={useFullBalance}
        />
      ) : (
        <SelectableAccount
          navigation={navigation}
          showHint={!index && showHint}
          rowIndex={index}
          listIndex={listIndex}
          account={item}
          onAccountNameChange={onAccountNameChange}
          isSelected={forceSelected || selectedIds.indexOf(item.id) > -1}
          isDisabled={isDisabled}
          onPress={onPressAccount}
          useFullBalance={useFullBalance}
        />
      ),
    [
      navigation,
      showHint,
      listIndex,
      selectedIds,
      forceSelected,
      isDisabled,
      onAccountNameChange,
      onPressAccount,
      useFullBalance,
      llmNetworkBasedAddAccountFlow?.enabled,
    ],
  );

  return (
    <Flex marginBottom={7} {...props}>
      {header ? (
        <Header
          text={header}
          areAllSelected={areAllSelected}
          onSelectAll={onSelectAllProp ? onSelectAll : undefined}
          onUnselectAll={onUnselectAllProp ? onUnselectAll : undefined}
        />
      ) : null}
      <FlatList
        data={accounts}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderSelectableAccount}
        ListEmptyComponent={() => (
          <Flex height="100%" flexDirection="row" justifyContent="center">
            {emptyState || null}
          </Flex>
        )}
      />
    </Flex>
  );
};

type SelectableAccountProps = {
  account: Account;
  onPress?: (_: Account) => void;
  isDisabled?: boolean;
  isSelected?: boolean;
  showHint: boolean;
  rowIndex: number;
  listIndex: number;
  navigation: NavigationProps;
  onAccountNameChange?: (name: string, changedAccount: Account) => void;
  useFullBalance?: boolean;
};

const SelectableAccount = ({
  account,
  onPress,
  isDisabled,
  isSelected,
  showHint,
  rowIndex,
  listIndex,
  navigation,
  onAccountNameChange,
  useFullBalance,
}: SelectableAccountProps) => {
  const [stopAnimation, setStopAnimation] = useState<boolean>(false);
  const isNetworkBasedAddAccountFlowEnabled = useFeature("llmNetworkBasedAddAccountFlow")?.enabled;
  const { space } = useTheme();

  const swipeableRow = useRef<Swipeable>(null);

  useEffect(() => {
    const sub = swipedAccountSubject.subscribe(msg => {
      const { row, list } = msg;
      setStopAnimation(true);
      if (swipeableRow.current && (row !== rowIndex || list !== listIndex)) {
        swipeableRow.current.close();
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [listIndex, rowIndex, swipeableRow]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Ask to be the responder:
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderGrant: () => {
          if (swipedAccountSubject) {
            setStopAnimation(true);
            swipedAccountSubject.next({ row: rowIndex, list: listIndex });
          }
        },
        onShouldBlockNativeResponder: () => false,
      }),
    [rowIndex, listIndex],
  );

  const handlePress = () => {
    track(isSelected ? "UnselectAccount" : "SelectAccount");
    if (onPress) {
      onPress(account);
    }
  };

  const [editNameButtonWidth, setEditNameButtonWidth] = useState(0);

  const setLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const buttonWidth = event?.nativeEvent?.layout?.width;
      if (buttonWidth) {
        setEditNameButtonWidth(buttonWidth);
      }
    },
    [setEditNameButtonWidth],
  );

  const editAccountName = useCallback(() => {
    if (!onAccountNameChange) return;

    swipedAccountSubject.next({ row: -1, list: -1 });
    if (isNetworkBasedAddAccountFlowEnabled) {
      navigation.navigate(NavigatorName.AccountSettings, {
        screen: ScreenName.EditAccountName,
        params: {
          onAccountNameChange,
          account,
        },
      });
    } else {
      navigation.navigate(ScreenName.EditAccountName, {
        onAccountNameChange,
        account,
      });
    }
  }, [account, navigation, onAccountNameChange, isNetworkBasedAddAccountFlowEnabled]);

  const renderLeftActions = useCallback(
    (
      progress: RNAnimated.AnimatedInterpolation<number>,
      dragX: RNAnimated.AnimatedInterpolation<number>,
    ) => {
      const translateX = dragX.interpolate({
        inputRange: [0, 1000],
        outputRange: [-1 * editNameButtonWidth, 1000 - editNameButtonWidth],
      });

      return (
        <Flex width="auto" flexDirection="row" alignItems="center" justifyContent="center" ml={2}>
          <RNAnimated.View style={[{ transform: [{ translateX }] }]} onLayout={setLayout}>
            <Button
              event="EditAccountNameFromSlideAction"
              type="primary"
              title={<Trans i18nKey="common.editName" />}
              onPress={editAccountName}
              paddingLeft={0}
              paddingRight={0}
            />
          </RNAnimated.View>
        </Flex>
      );
    },
    [editNameButtonWidth, setLayout, editAccountName],
  );

  const subAccountCount = account.subAccounts && account.subAccounts.length;
  const isToken = listTokenTypesForCryptoCurrency(account.currency).length > 0;
  const { animatedStyle, startAnimation } = useItemAnimation();
  const styles = getConditionalStyles(isNetworkBasedAddAccountFlowEnabled, space);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  const inner = (
    <Animated.View style={[animatedStyle]}>
      <Flex
        {...styles.selectableAccount}
        flexDirection="row"
        alignItems="center"
        opacity={isDisabled ? 0.4 : 1}
      >
        {isNetworkBasedAddAccountFlowEnabled ? (
          <Flex flex={1} flexDirection="row" alignItems="center">
            <AccountItem
              account={account as Account}
              balance={useFullBalance ? account.balance : account.spendableBalance}
            />
          </Flex>
        ) : (
          <Flex flex={1}>
            <AccountCard
              useFullBalance={useFullBalance}
              account={account}
              AccountSubTitle={
                subAccountCount && !isDisabled ? (
                  <Flex marginTop={2}>
                    <Text fontWeight="semiBold" variant="small" color="pillActiveForeground">
                      <Trans
                        i18nKey={`selectableAccountsList.${isToken ? "tokenCount" : "subaccountCount"}`}
                        count={subAccountCount}
                        values={{ count: subAccountCount }}
                      />
                    </Text>
                  </Flex>
                ) : null
              }
            />
          </Flex>
        )}

        {!isDisabled && (
          <Flex marginLeft={isNetworkBasedAddAccountFlowEnabled ? 0 : 4}>
            <CheckBox onChange={handlePress} isChecked={!!isSelected} />
          </Flex>
        )}
      </Flex>
    </Animated.View>
  );

  if (isDisabled) return inner;

  return (
    <View {...panResponder.panHandlers}>
      <Swipeable
        ref={swipeableRow}
        friction={2}
        leftThreshold={50}
        renderLeftActions={renderLeftActions}
      >
        <Touchable onPress={handlePress}>{inner}</Touchable>

        {showHint && (
          <Flex position="absolute" margin="auto" left={3} top={0} bottom={0}>
            <TouchHintCircle stopAnimation={stopAnimation} />
          </Flex>
        )}
      </Swipeable>
    </View>
  );
};

type HeaderProps = {
  text: ReactNode;
  areAllSelected: boolean;
  onSelectAll?: () => void;
  onUnselectAll?: () => void;
};

const Header = ({ text, areAllSelected, onSelectAll, onUnselectAll }: HeaderProps) => {
  const shouldDisplaySelectAll = !!onSelectAll && !!onUnselectAll;
  const llmNetworkBasedAddAccountFlowEnabled = useFeature("llmNetworkBasedAddAccountFlow")?.enabled;
  const styles = getConditionalStyles(llmNetworkBasedAddAccountFlowEnabled);

  return (
    <Flex {...styles.header} flexDirection="row" alignItems="center">
      <Text
        {...styles.headerText}
        fontWeight="semiBold"
        flexShrink={1}
        color="neutral.c70"
        numberOfLines={1}
      >
        {text}
      </Text>
      {shouldDisplaySelectAll && (
        <Flex flexGrow={1} alignItems="flex-end">
          <TouchableOpacity
            onPress={areAllSelected ? onUnselectAll : onSelectAll}
            hitSlop={selectAllHitSlop}
          >
            <Text
              fontSize={14}
              color={styles.selectAllText.getColor(areAllSelected)}
              testID={`add-accounts-${areAllSelected ? "deselect" : "select"}-all`}
              numberOfLines={1}
            >
              {areAllSelected ? (
                <Trans i18nKey="selectableAccountsList.deselectAll" />
              ) : (
                <Trans i18nKey="selectableAccountsList.selectAll" />
              )}
            </Text>
          </TouchableOpacity>
        </Flex>
      )}
    </Flex>
  );
};

export default SelectableAccountsList;
