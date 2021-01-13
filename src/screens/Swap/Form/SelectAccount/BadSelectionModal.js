// @flow
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/AntDesign";
import { useNavigation, useTheme } from "@react-navigation/native";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import type { CurrencyStatus } from "@ledgerhq/live-common/lib/exchange/swap/logic";
import { ScreenName, NavigatorName } from "../../../../const";
import Circle from "../../../../components/Circle";
import BottomModal from "../../../../components/BottomModal";
import { MANAGER_TABS } from "../../../Manager/Manager";
import LText from "../../../../components/LText";
import Button from "../../../../components/Button";

const BadSelectionModal = ({
  currency,
  status,
  onClose,
}: {
  currency?: ?(CryptoCurrency | TokenCurrency),
  status: CurrencyStatus,
  onClose: () => void,
}) => {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const openManagerForApp = useCallback(() => {
    const outdated = status === "outdatedApp";
    navigate(NavigatorName.Manager, {
      screen: ScreenName.Manager,
      params: outdated
        ? {
            tab: MANAGER_TABS.INSTALLED_APPS,
            updateModalOpened: true,
          }
        : {
            tab: MANAGER_TABS.CATALOG,
            searchQuery: currency
              ? currency.type === "TokenCurrency"
                ? currency?.parentCurrency?.managerAppName
                : currency?.managerAppName
              : null,
          },
    });
  }, [status, navigate, currency]);

  if (!currency) return null;
  const appName =
    currency.type === "TokenCurrency"
      ? currency.parentCurrency.managerAppName
      : currency.managerAppName;

  return (
    <BottomModal
      id="ConfirmationModal"
      isOpened={!!currency}
      onClose={undefined}
      style={styles.root}
    >
      <Circle bg={colors.pillActiveBackground} size={40}>
        <Icon name="exclamationcircleo" color={colors.live} size={22} />
      </Circle>
      <LText style={styles.title}>
        <Trans
          i18nKey={`transfer.swap.form.${status}.title`}
          values={{ ticker: currency.ticker, appName }}
        />
      </LText>
      <LText style={styles.desc} color="smoke">
        <Trans
          i18nKey={`transfer.swap.form.${status}.desc`}
          values={{
            currencyName: currency.name,
            appName,
          }}
        />
      </LText>
      {["noApp", "outdatedApp"].includes(status) ? (
        <>
          <Button
            containerStyle={styles.closeButton}
            onPress={openManagerForApp}
            type={"primary"}
            event={"GoToManagerFromSwapAppNotInstalledOrOutdated"}
            title={<Trans i18nKey={`transfer.swap.form.${status}.cta`} />}
          />
          <Button
            containerStyle={styles.closeButton}
            onPress={onClose}
            outline={false}
            type={"secondary"}
            event={"CloseSwapAppNotInstalled"}
            title={<Trans i18nKey={`transfer.swap.form.${status}.close`} />}
          />
        </>
      ) : (
        <Button
          containerStyle={styles.closeButton}
          onPress={onClose}
          type={"primary"}
          event={"CloseSwapNoAccounts"}
          title={<Trans i18nKey={`transfer.swap.form.${status}.cta`} />}
        />
      )}
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  root: {
    padding: 16,
    paddingBottom: 0,
    alignItems: "center",
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 18,
    lineHeight: 22,
  },
  desc: {
    marginBottom: 29,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    marginTop: 8,
    width: "100%",
  },
});

export default BadSelectionModal;
