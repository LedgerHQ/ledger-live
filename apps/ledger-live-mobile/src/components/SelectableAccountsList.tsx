import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "~/context/Locale";
import {
  View,
  TouchableOpacity,
  PanResponder,
  FlatList,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  TextStyle,
} from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { Account } from "@ledgerhq/types-live";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import Swipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import CheckBox from "./CheckBox";
import swipedAccountSubject from "~/types/subject";
import TouchHintCircle from "./TouchHintCircle";
import Touchable from "./Touchable";
import { AccountSettingsNavigatorParamList } from "./RootNavigator/types/AccountSettingsNavigator";
import AccountItem from "LLM/features/Accounts/components/AccountsListView/components/AccountItem";
import { BaseComposite, StackNavigatorProps } from "./RootNavigator/types/helpers";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import useItemAnimation from "LLM/features/Accounts/components/AccountsListView/components/AnimatedAccountItem/useItemAnimation";
import { TextVariants } from "@ledgerhq/native-ui/styles/theme";

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

const getStyles = (space?: number[]) => ({
  selectableAccount: {
    marginTop: space?.[6],
    marginX: 6,
    paddingX: space?.[6],
    paddingY: space?.[6],
    columnGap: space?.[4],
    borderRadius: space?.[4],
    backgroundColor: "opacityDefault.c05",
  },
  header: {
    paddingX: 16,
    paddingBottom: 0,
  },
  headerText: {
    variant: "paragraph" as TextVariants,
    textTransform: undefined as TextStyle["textTransform"],
  },
  selectAllText: {
    getColor: (areAllSelected: boolean) => (areAllSelected ? "neutral.c80" : "constant.purple"),
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

    if (onSelectAllProp) onSelectAllProp(accounts);
  }, [accounts, onSelectAllProp]);

  const onUnselectAll = useCallback(() => {
    track("UnselectAllAccounts");
    if (onUnselectAllProp) onUnselectAllProp(accounts);
  }, [accounts, onUnselectAllProp]);

  const areAllSelected = accounts.every(a => selectedIds.indexOf(a.id) > -1);

  const renderSelectableAccount = useCallback(
    ({ item, index }: { index: number; item: Account }) => (
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
    ],
  );

  return (
    <Flex marginBottom={7} testID="selectable-accounts-list" {...props}>
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
  const { space } = useTheme();

  const swipeableRow = useRef<SwipeableMethods>(null);

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

    track("EditAccountNameFromSlideAction");

    swipedAccountSubject.next({ row: -1, list: -1 });

    navigation.navigate(NavigatorName.AccountSettings, {
      screen: ScreenName.EditAccountName,
      params: {
        onAccountNameChange,
        account,
      },
    });
  }, [account, navigation, onAccountNameChange]);

  const LeftActions = ({ translation }: { translation: SharedValue<number> }) => {
    const animatedStyle = useAnimatedStyle(() => {
      "worklet";
      return {
        transform: [{ translateX: translation.value - editNameButtonWidth }],
      };
    });

    return (
      <Flex width="auto" flexDirection="row" alignItems="center" justifyContent="center" ml={2}>
        <Animated.View style={[animatedStyle]} onLayout={setLayout}>
          <RectButton
            enabled={!isDisabled}
            onPress={editAccountName}
            hitSlop={selectAllHitSlop}
            style={{ borderRadius: space[10] }}
          >
            <Button type="main" disabled={isDisabled} paddingLeft={0} paddingRight={0}>
              <Trans i18nKey="common.editName" />
            </Button>
          </RectButton>
        </Animated.View>
      </Flex>
    );
  };

  const renderLeftActions = (_progress: SharedValue<number>, translation: SharedValue<number>) => (
    <LeftActions translation={translation} />
  );

  const { animatedStyle, startAnimation } = useItemAnimation();
  const styles = getStyles(space);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  const inner = (
    <Animated.View style={[animatedStyle]} testID={`account-${account.id}`}>
      <Flex
        {...styles.selectableAccount}
        flexDirection="row"
        alignItems="center"
        opacity={isDisabled ? 0.4 : 1}
      >
        <Flex flex={1} flexDirection="row" alignItems="center">
          <AccountItem
            account={account as Account}
            balance={useFullBalance ? account.balance : account.spendableBalance}
          />
        </Flex>

        {!isDisabled && (
          <Flex marginLeft={0}>
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
  const styles = getStyles();

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
