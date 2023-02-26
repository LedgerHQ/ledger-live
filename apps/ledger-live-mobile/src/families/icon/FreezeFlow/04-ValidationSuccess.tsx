
import { useTimer } from "@ledgerhq/live-common/hooks/useTimer";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../../analytics";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import PreventNativeBack from "../../../components/PreventNativeBack";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation, StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import ValidateSuccess from "../../../components/ValidateSuccess";
import { NavigatorName, ScreenName } from "../../../const";
import { accountScreenSelector } from "../../../reducers/accounts";
import { IconFreezeFlowParamList } from "./type";
import { IconAccount } from "@ledgerhq/live-common/families/icon/types";
import { useVotingPowerLoading } from "@ledgerhq/live-common/families/icon/react";
import { StackNavigationProp } from "@react-navigation/stack";


type NavigatorProps = CompositeScreenProps<
  StackNavigatorProps<
    IconFreezeFlowParamList,
    ScreenName.IconFreezeValidationSuccess
  >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationSuccess({
  navigation,
  route,
}: NavigatorProps) {
  const { colors } = useTheme();
  const account = useSelector(accountScreenSelector(route))
    .account as IconAccount;
  invariant(account && account.type === "Account", "account is required");
  const time = useTimer(20);
  const transaction = route.params.transaction;
  const accountId = account.id;

  const isLoading = useVotingPowerLoading(account);

  const onClose = useCallback(() => {
    navigation
      .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
      .pop();
  }, [navigation]);

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: string;
      screen?: string;
      params?: { [key: string]: unknown; };
    }) => {
      // This is complicated (even impossible?) to type properly…
      (navigation as StackNavigationProp<{ [key: string]: object; }>).navigate(
        route,
        {
          screen,
          params: { ...params, accountId: account.id },
        },
      );
    },
    [navigation, account.id],
  );

  const goToVote = useCallback(() => {
    onClose();
    const { iconResources } = account;
    const { votes } = iconResources || {};
    const screenName = votes.length > 0
      ? ScreenName.IconVoteSelectValidator
      : ScreenName.IconVoteStarted;

    onNavigate({
      route: NavigatorName.IconVoteFlow,
      screen: screenName,
      params: {
        accountId,
      },
    });
  }, [account, accountId, navigation, onClose]);
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="IconFreezeFlow" name="IconValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToVote}
        title={<Trans i18nKey="freeze.validation.success" />}
        description={
          <Trans
            i18nKey="icon.freeze.flow.steps.success.text"
            values={transaction.amount}
          />
        }
        primaryButton={
          <>
            {time > 0 && (
              <View style={styles.labelContainer}>
                <LText style={styles.label} semiBold>
                  <Trans i18nKey="freeze.validation.button.pending" />
                </LText>
                <LText style={[styles.label]} color="grey">
                  <Trans i18nKey="freeze.validation.button.pendingDesc" />
                </LText>
              </View>
            )}
            <Button
              event="IconFreezeSuccessVote"
              title={
                time > 0 ? (
                  `0:${Number(time).toString().padStart(2, "0")}`
                ) : (
                  <Trans i18nKey="icon.freeze.flow.steps.success.vote" />
                )
              }
              disabled={isLoading}
              type="primary"
              containerStyle={styles.button}
              onPress={goToVote}
            />
          </>
        }
        secondaryButton={
          <Button
            event="IconFreezeSuccessLater"
            title={<Trans i18nKey="icon.freeze.flow.steps.success.later" />}
            type="lightSecondary"
            containerStyle={styles.button}
            onPress={onClose}
          />
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  button: {
    alignSelf: "stretch",
    marginBottom: 16,
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    marginTop: 48,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
  },
});
