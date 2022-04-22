// @flow
import React, { useCallback, memo, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";

import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";

import Ellipsis from "../icons/Ellipsis";
import Button from "./Button";
import BottomModal from "./BottomModal";
import LendingBanners from "../screens/Account/LendingBanners";
import ChoiceButton from "./ChoiceButton";
import InfoModal from "./InfoModal";

type ActionButtonEventProps = {
  navigationParams?: any[],
  confirmModalProps?: {
    withCancel?: boolean,
    id?: string,
    title?: string | React$Element<*>,
    desc?: string | React$Element<*>,
    Icon?: React$ComponentType<*>,
    withCancel?: boolean,
    children?: React$Node,
    confirmLabel?: string | React$Element<*>,
    confirmProps?: *,
  },
  Component?: React$ComponentType<*>,
  enableActions?: string,
};

type ActionButton = {
  ...ActionButtonEventProps,
  label: React$Node,
  Icon?: React$ComponentType<{ size: number, color: string }>,
  event: string,
  eventProperties?: { [key: string]: * },
  Component?: React$ComponentType<*>,
};

type Props = {
  buttons: ActionButton[],
  actions?: { default: ActionButton[], lending?: ActionButton[] },
  account?: AccountLike,
  parentAccount?: Account,
};

function FabAccountButtonBar({
  buttons,
  actions,
  account,
  parentAccount,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [next, setNext] = useState();
  const [displayedActions, setDisplayedActions] = useState();

  const [
    infoModalProps,
    setInfoModalProps,
  ] = useState<?ActionButtonEventProps>();
  const [isModalInfoOpened, setIsModalInfoOpened] = useState();

  const onNavigate = useCallback(
    (name: string, options?: *) => {
      const accountId = account ? account.id : undefined;
      const parentId = parentAccount ? parentAccount.id : undefined;
      setNext();
      navigation.navigate(name, {
        ...options,
        params: {
          ...(options ? options.params : {}),
          accountId,
          parentId,
        },
      });
    },
    [account, parentAccount, navigation],
  );

  const onPress = useCallback(
    (data: ActionButtonEventProps) => {
      const { navigationParams, confirmModalProps, enableActions } = data;
      if (!confirmModalProps) {
        setInfoModalProps();
        if (navigationParams) onNavigate(...navigationParams);
        if (enableActions) setDisplayedActions(enableActions);
      } else {
        setInfoModalProps(data);
        setIsModalInfoOpened(true);
      }
    },
    [onNavigate, setIsModalInfoOpened],
  );

  const goToNext = useCallback(() => {
    if (next) {
      // workaround for bottom modal + text input autoFocus issue
      setTimeout(() => onNavigate(...next), 0);
    }
  }, [onNavigate, next]);

  const onContinue = useCallback(() => {
    setIsModalInfoOpened(false);
    onPress({ ...infoModalProps, confirmModalProps: undefined });
  }, [infoModalProps, onPress]);

  const onClose = useCallback(() => {
    setIsModalInfoOpened();
  }, []);

  const onChoiceSelect = useCallback(({ navigationParams, enableActions }) => {
    if (navigationParams) {
      setNext(navigationParams);
      setDisplayedActions();
    }
    if (enableActions) {
      setDisplayedActions(enableActions);
    }
  }, []);

  return (
    <View style={styles.root}>
      {buttons.map(
        (
          { label, Icon, event, eventProperties, Component, ...rest },
          index,
        ) => (
          <Button
            title={label}
            IconLeft={Icon}
            event={event}
            eventProperties={eventProperties}
            containerStyle={[styles.button, styles.dropShadow]}
            type="primary"
            onPress={() => onPress(rest)}
            key={index}
          />
        ),
      )}
      {isModalInfoOpened && infoModalProps && (
        <InfoModal
          {...(infoModalProps.confirmModalProps
            ? infoModalProps.confirmModalProps
            : {})}
          onContinue={onContinue}
          onClose={onClose}
          isOpened={!!isModalInfoOpened}
        />
      )}

      {actions && actions.default.length > 0 && (
        <>
          <TouchableOpacity
            style={[
              styles.moreButton,
              styles.dropShadow,
              { backgroundColor: colors.live },
            ]}
            onPress={() => setDisplayedActions("default")}
          >
            <Ellipsis color="white" size={16} />
          </TouchableOpacity>
          <BottomModal
            isOpened={!!displayedActions}
            onClose={() => setDisplayedActions()}
            onModalHide={() => goToNext()}
            containerStyle={styles.modal}
          >
            {displayedActions === "lending" && account && (
              <LendingBanners account={account} />
            )}
            {!!displayedActions &&
              actions[displayedActions]?.map((a, i) =>
                a.Component ? (
                  <a.Component key={i} />
                ) : (
                  <ChoiceButton {...a} key={i} onSelect={onChoiceSelect} />
                ),
              )}
          </BottomModal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "nowrap",
    paddingHorizontal: 8,
  },
  dropShadow: {
    shadowColor: "#bdb3ff",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  button: {
    height: 40,
    borderRadius: 40,
    marginHorizontal: 8,
    flex: 0.5,
  },
  moreButton: {
    height: 40,
    borderRadius: 40,
    flexBasis: 40,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  modal: {
    paddingTop: 16,
    paddingHorizontal: 8,
  },
});

export default memo<Props>(FabAccountButtonBar);
