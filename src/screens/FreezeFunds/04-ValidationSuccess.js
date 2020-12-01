/* @flow */
import React, { useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import {
  useTronPowerLoading,
  getLastVotedDate,
} from "@ledgerhq/live-common/lib/families/tron/react";
import { useTimer } from "@ledgerhq/live-common/lib/hooks/useTimer";
import type { Operation } from "@ledgerhq/live-common/lib/types";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import { NavigatorName, ScreenName } from "../../const";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateSuccess from "../../components/ValidateSuccess";
import Button from "../../components/Button";
import LText from "../../components/LText";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  deviceId: string,
  transaction: any,
  result: Operation,
};

export default function ValidationSuccess({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");

  const time = useTimer(60);
  const isLoading = useTronPowerLoading(account);

  const transaction = route.params.transaction;
  const resource = transaction.resource || "";

  const accountId = account.id;

  const lastVotedDate = useMemo(() => getLastVotedDate(account), [account]);

  const onClose = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
  }, [navigation]);

  const goToVote = useCallback(() => {
    onClose();
    const screenName = lastVotedDate
      ? ScreenName.VoteSelectValidator
      : ScreenName.VoteStarted;
    navigation.navigate(NavigatorName.TronVoteFlow, {
      screen: screenName,
      params: {
        accountId,
        parentId: undefined,
      },
    });
  }, [lastVotedDate, accountId, navigation, onClose]);

  return (
    <View style={styles.root}>
      <TrackScreen category="FreezeFunds" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToVote}
        title={<Trans i18nKey="freeze.validation.success" />}
        description={
          <Trans
            i18nKey="freeze.validation.info"
            values={{ resource: resource.toLowerCase() }}
          />
        }
        primaryButton={
          <>
            {time > 0 && (
              <View style={styles.labelContainer}>
                <LText style={styles.label} semiBold>
                  <Trans i18nKey="freeze.validation.button.pending" />
                </LText>
                <LText style={[styles.label, styles.subLabel]}>
                  <Trans i18nKey="freeze.validation.button.pendingDesc" />
                </LText>
              </View>
            )}
            <Button
              event="FreezeSuccessVote"
              title={
                time > 0 ? (
                  <Trans
                    i18nKey="freeze.validation.button.voteTimer"
                    values={{ time }}
                  />
                ) : (
                  <Trans i18nKey="freeze.validation.button.vote" />
                )
              }
              isLoading={isLoading && time === 0}
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
    backgroundColor: colors.white,
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
  label: { fontSize: 12 },
  subLabel: { color: colors.grey },
});
