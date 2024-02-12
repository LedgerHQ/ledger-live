import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "react-i18next";
import {
  Animated,
  View,
  TouchableOpacity,
  PanResponder,
  FlatList,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { Account } from "@ledgerhq/types-live";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import Swipeable from "react-native-gesture-handler/Swipeable";

import { StackNavigationProp } from "@react-navigation/stack";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import AccountCard from "./AccountCard";
import CheckBox from "./CheckBox";
import swipedAccountSubject from "~/screens/AddAccounts/swipedAccountSubject";
import Button from "./Button";
import TouchHintCircle from "./TouchHintCircle";
import Touchable from "./Touchable";
import { AccountSettingsNavigatorParamList } from "./RootNavigator/types/AccountSettingsNavigator";
import { AddAccountsNavigatorParamList } from "./RootNavigator/types/AddAccountsNavigator";

const selectAllHitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

type Props = FlexBoxProps & {
  accounts: Account[];
  onPressAccount?: (_: Account) => void;
  onSelectAll?: (_: Account[]) => void;
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
  const navigation =
    useNavigation<
      StackNavigationProp<AccountSettingsNavigatorParamList | AddAccountsNavigatorParamList>
    >();

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
        renderItem={({ item, index }) => (
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
        )}
        ListEmptyComponent={() => <>{emptyState || null}</>}
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
  navigation: StackNavigationProp<
    AccountSettingsNavigatorParamList | AddAccountsNavigatorParamList
  >;
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
    navigation.navigate(ScreenName.EditAccountName, {
      onAccountNameChange,
      account,
    });
  }, [account, navigation, onAccountNameChange]);

  const renderLeftActions = useCallback(
    (
      progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>,
    ) => {
      const translateX = dragX.interpolate({
        inputRange: [0, 1000],
        outputRange: [-1 * editNameButtonWidth, 1000 - editNameButtonWidth],
      });

      return (
        <Flex width="auto" flexDirection="row" alignItems="center" justifyContent="center" ml={2}>
          <Animated.View style={[{ transform: [{ translateX }] }]} onLayout={setLayout}>
            <Button
              event="EditAccountNameFromSlideAction"
              type="primary"
              title={<Trans i18nKey="common.editName" />}
              onPress={editAccountName}
              paddingLeft={0}
              paddingRight={0}
            />
          </Animated.View>
        </Flex>
      );
    },
    [editNameButtonWidth, setLayout, editAccountName],
  );

  const subAccountCount = account.subAccounts && account.subAccounts.length;
  const isToken = listTokenTypesForCryptoCurrency(account.currency).length > 0;

  const inner = (
    <Flex
      marginTop={3}
      marginBottom={3}
      marginLeft={6}
      marginRight={6}
      paddingLeft={6}
      paddingRight={6}
      paddingTop={3}
      paddingBottom={3}
      flexDirection="row"
      alignItems="center"
      borderRadius={4}
      opacity={isDisabled ? 0.4 : 1}
      backgroundColor="neutral.c30"
    >
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
      {!isDisabled && (
        <Flex marginLeft={4}>
          <CheckBox onChange={handlePress} isChecked={!!isSelected} />
        </Flex>
      )}
    </Flex>
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

  return (
    <Flex paddingX={16} flexDirection="row" alignItems="center" paddingBottom={8}>
      <Text
        fontWeight="semiBold"
        flexGrow={1}
        variant="small"
        textTransform="uppercase"
        color="neutral.c70"
      >
        {text}
      </Text>
      {shouldDisplaySelectAll && (
        <Flex flexShrink={1}>
          <TouchableOpacity
            onPress={areAllSelected ? onUnselectAll : onSelectAll}
            hitSlop={selectAllHitSlop}
          >
            <Text fontSize={14} color="neutral.c70">
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
