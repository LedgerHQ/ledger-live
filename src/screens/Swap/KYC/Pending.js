// @flow
import React, { useEffect, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@react-navigation/native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { getKYCStatus } from "@ledgerhq/live-common/lib/exchange/swap";
import { swapKYCSelector } from "../../../reducers/settings";
import { setSwapKYCStatus } from "../../../actions/settings";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import IconCheck from "../../../icons/Check";
import IconClose from "../../../icons/Close";
import { rgba } from "../../../colors";

const forceInset = { bottom: "always" };

const Pending = ({
  onContinue,
  status = "pending",
}: {
  onContinue: () => void,
  status?: string,
}) => {
  // FIXME if we ever have dynamic KYC fields, or more than one provider with KYC, backend to provide the fields
  const swapKYC = useSelector(swapKYCSelector);
  const dispatch = useDispatch();
  const providerKYC = swapKYC.wyre;

  const onUpdateKYCStatus = useCallback(() => {
    let cancelled = false;
    async function updateKYCStatus() {
      if (!providerKYC?.id) return;
      const res = await getKYCStatus("wyre", providerKYC.id);
      if (cancelled || res?.status === providerKYC?.status) return;
      dispatch(
        setSwapKYCStatus({
          provider: "wyre",
          id: res?.id,
          status: res?.status,
        }),
      );
    }
    updateKYCStatus();
    return () => {
      cancelled = true;
    };
  }, [dispatch, providerKYC]);

  useEffect(() => {
    // Fixme Again, relying on provider specific status wording.
    if (providerKYC && providerKYC.status !== "approved") {
      onUpdateKYCStatus();
    }
  }, [onUpdateKYCStatus, providerKYC]);

  const { colors } = useTheme();
  const rejected = status === "closed";

  const onResetKYC = useCallback(() => {
    dispatch(setSwapKYCStatus({ provider: "wyre" }));
    onContinue();
  }, [dispatch, onContinue]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <View style={styles.wrapper}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: rgba(
                rejected ? colors.alertRed : colors.green,
                0.1,
              ),
            },
          ]}
        >
          {rejected ? (
            <IconClose color={colors.alert} size={20} />
          ) : (
            <IconCheck color={colors.green} size={20} />
          )}
        </View>
        <LText secondary style={styles.title} semiBold>
          <Trans i18nKey={`transfer.swap.kyc.wyre.${status}.title`} />
        </LText>
        <LText style={styles.description} color="grey">
          <Trans i18nKey={`transfer.swap.kyc.wyre.${status}.subtitle`} />
        </LText>
      </View>
      {["rejected", "approved"].includes(status) ? (
        <View style={styles.continueWrapper}>
          <Button
            event="SwapDone"
            type="primary"
            title={<Trans i18nKey={`transfer.swap.kyc.wyre.${status}.cta`} />}
            onPress={rejected ? onResetKYC : onContinue}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
  },
  iconWrapper: {
    height: 50,
    width: 50,
    borderRadius: 50,
    marginBottom: 16,

    alignItems: "center",
    justifyContent: "center",
  },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 19,
    marginBottom: 16,
  },
  swapIDWrapper: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  swapLabel: {
    fontSize: 14,
    lineHeight: 19,
  },
  swapID: {
    borderRadius: 4,
    padding: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
    marginHorizontal: 30,
    marginBottom: 16,
  },
  continueWrapper: {},
});

export default Pending;
