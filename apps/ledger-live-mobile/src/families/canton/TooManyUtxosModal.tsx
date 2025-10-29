import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import { useTheme, useNavigation } from "@react-navigation/native";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import QueuedDrawer from "~/components/QueuedDrawer";
import LText from "~/components/LText";
import Button from "~/components/Button";
import { WarningMedium } from "@ledgerhq/native-ui/assets/icons";
import TrackScreen from "~/analytics/TrackScreen";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import { ScreenName, NavigatorName } from "~/const";

type Props = Readonly<{
  isOpened: boolean;
  onClose: () => void;
  account: CantonAccount;
}>;

const CANTON_REASONABLE_CONSOLIDATE_MULTIPLIER = 0.4;

function TooManyUtxosModal({ isOpened, onClose, account }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const learnMoreUrl = useLocalizedUrl(urls.canton.learnMore);

  const handleConsolidate = useCallback(() => {
    onClose();

    const bridge = getAccountBridge(account);
    const transaction = bridge.createTransaction(account);
    const updatedTransaction = bridge.updateTransaction(transaction, {
      recipient: account.xpub || "",
      amount: account.spendableBalance.multipliedBy(CANTON_REASONABLE_CONSOLIDATE_MULTIPLIER),
    });

    navigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendAmountCoin,
      params: {
        accountId: account.id,
        transaction: updatedTransaction,
      },
    });
  }, [navigation, account, onClose]);

  const handleLearnMore = useCallback(() => {
    Linking.openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  return (
    <QueuedDrawer isForcingToBeOpened={isOpened} onClose={onClose} style={styles.modal}>
      {isOpened ? <TrackScreen category="CantonTooManyUtxosModal" /> : null}

      <View style={styles.container}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.lightOrange,
            },
          ]}
        >
          <WarningMedium size={48} color={colors.orange} />
        </View>

        <LText secondary semiBold style={styles.title}>
          <Trans i18nKey="canton.tooManyUtxos.title" />
        </LText>

        <LText style={styles.description} color="smoke">
          <Trans i18nKey="canton.tooManyUtxos.description" />
        </LText>

        <LText secondary semiBold style={styles.quickFix}>
          <Trans i18nKey="canton.tooManyUtxos.quickFix" />
        </LText>

        <View style={styles.footer}>
          <LText style={styles.learnMoreLink} color="primary" onPress={handleLearnMore}>
            <Trans i18nKey="common.learnMore" />
          </LText>

          <Button
            event="CantonTooManyUtxosConsolidate"
            type="primary"
            title={<Trans i18nKey="canton.tooManyUtxos.consolidate" />}
            onPress={handleConsolidate}
            containerStyle={styles.consolidateButton}
          />
        </View>
      </View>
    </QueuedDrawer>
  );
}

const styles = StyleSheet.create({
  modal: {
    paddingHorizontal: 16,
  },
  container: {
    alignItems: "center",
    paddingVertical: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  quickFix: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 32,
  },
  footer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  learnMoreLink: {
    textDecorationLine: "underline",
  },
  consolidateButton: {
    width: "100%",
  },
});

const options = {};
export { TooManyUtxosModal as component, options };
