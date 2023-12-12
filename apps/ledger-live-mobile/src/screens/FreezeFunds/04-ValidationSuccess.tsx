import React, { useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { useTronPowerLoading, getLastVotedDate } from "@ledgerhq/live-common/families/tron/react";
import { useTimer } from "@ledgerhq/live-common/hooks/useTimer";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { TronAccount, Transaction } from "@ledgerhq/live-common/families/tron/types";
import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import Button from "~/components/Button";
import LText from "~/components/LText";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { FreezeNavigatorParamList } from "~/components/RootNavigator/types/FreezeNavigator";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type NavigatorProps = CompositeScreenProps<
  StackNavigatorProps<FreezeNavigatorParamList, ScreenName.FreezeValidationSuccess>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationSuccess({ navigation, route }: NavigatorProps) {
  const { colors } = useTheme();
  const account = useSelector(accountScreenSelector(route)).account as TronAccount;
  invariant(account && account.type === "Account", "account is required");
  const time = useTimer(60);
  const isLoading = useTronPowerLoading(account);
  const transaction = route.params.transaction;
  const resource = (transaction as Transaction)?.resource || "";
  const accountId = account.id;
  const lastVotedDate = useMemo(() => getLastVotedDate(account), [account]);
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);
  const goToVote = useCallback(() => {
    onClose();
    const screenName = lastVotedDate ? ScreenName.VoteSelectValidator : ScreenName.VoteStarted;
    navigation.navigate(NavigatorName.TronVoteFlow, {
      screen: screenName,
      params: {
        accountId,
        parentId: undefined,
      },
    });
  }, [lastVotedDate, accountId, navigation, onClose]);
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="FreezeFunds" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToVote}
        title={<Trans i18nKey="freeze.validation.success" />}
        description={
          <Trans
            i18nKey="freeze.validation.info"
            values={{
              resource: resource.toLowerCase(),
            }}
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
              event="FreezeSuccessVote"
              title={
                /**
                 * To much effort to localize this IMO (we'd need an additional lib like moment.js, not worth it)
                 * https://softwareengineering.stackexchange.com/a/399225
                 * Just make sure to reimplement this basic formatting in case the timer starts from >60s
                 * */
                time > 0 ? (
                  `0:${Number(time).toString().padStart(2, "0")}`
                ) : (
                  <Trans i18nKey="freeze.validation.button.vote" />
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
            event="FreezeSuccessLater"
            title={<Trans i18nKey="freeze.validation.button.later" />}
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
