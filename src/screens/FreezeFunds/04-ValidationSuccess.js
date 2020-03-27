/* @flow */
import React, { useCallback, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";

import type { NavigationScreenProp } from "react-navigation";
import type { Account, Operation } from "@ledgerhq/live-common/lib/types";

import { accountAndParentScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateSuccess from "../../components/ValidateSuccess";
import Button from "../../components/Button";
import LText from "../../components/LText";

const useTimer = (timer: number) => {
  const [time, setTime] = useState(timer);

  useEffect(() => {
    let T = timer;
    const int = setInterval(() => {
      if (T <= 0) {
        clearInterval(int);
      } else {
        T--;
        setTime(T);
      }
    }, 1000);
    return () => {
      if (int) clearInterval(int);
    };
  }, [timer]);

  return time;
};

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      deviceId: string,
      transaction: *,
      result: Operation,
    },
  }>,
};

const ValidationSuccess = ({ navigation }: Props) => {
  const time = useTimer(60);

  const transaction = navigation.getParam("transaction");
  const resource = transaction.resource || "";

  const dismiss = useCallback(() => {
    if (navigation.dismiss) {
      const dismissed = navigation.dismiss();
      if (!dismissed) navigation.goBack();
    }
  }, [navigation]);

  const goToVote = useCallback(() => {
    /** @TODO redirect to Vote flow */
    // navigation.navigate("Vote", {
    //   accountId: account.id,
    // });
  }, []);

  return (
    <View style={styles.root}>
      <TrackScreen category="FreezeFunds" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={dismiss}
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
              disabled={time > 0}
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
            onPress={dismiss}
          />
        }
      />
    </View>
  );
};

ValidationSuccess.navigationOptions = {
  header: null,
  gesturesEnabled: false,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  button: {
    alignSelf: "stretch",
    marginTop: 24,
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
  },
  label: { fontSize: 12 },
  subLabel: { color: colors.grey },
});

const mapStateToProps = accountAndParentScreenSelector;

export default connect(mapStateToProps)(ValidationSuccess);
