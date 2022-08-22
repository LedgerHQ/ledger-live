import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { BottomDrawer } from "@ledgerhq/native-ui";
import { NavigatorName } from "../../const";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import Illustration from "../../images/illustration/Illustration";
import NanoXFolded from "../../images/devices/NanoXFolded";

import ChoiceCard from "../../components/ChoiceCard";
import { track, TrackScreen } from "../../analytics";
import { useCurrentRouteName } from "../../helpers/routeHooks";

const images = {
  light: {
    withYourLedger: require("../../images/illustration/Light/_067.png"),
    importFromYourDesktop: require("../../images/illustration/Light/_074.png"),
  },
  dark: {
    withYourLedger: require("../../images/illustration/Dark/_067.png"),
    importFromYourDesktop: require("../../images/illustration/Dark/_074.png"),
  },
};

type Props = {
  navigation: any;
  isOpened: boolean;
  onClose: () => void;
};

export default function AddAccountsModal({
  navigation,
  onClose,
  isOpened,
}: Props) {
  const { t } = useTranslation();
  const currentScreen = useCurrentRouteName();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const onClickAdd = useCallback(() => {
    track("button_clicked", {
      button: "With your Ledger",
      drawer: "AddAccountsModal",
      screen: currentScreen,
    });
    navigation.navigate(NavigatorName.AddAccounts);
    onClose();
  }, [navigation, onClose, currentScreen]);

  const onClickImport = useCallback(() => {
    track("button_clicked", {
      button: "Import from Desktop",
      drawer: "AddAccountsModal",
      screen: currentScreen,
    });
    navigation.navigate(NavigatorName.ImportAccounts);
    onClose();
  }, [navigation, onClose, currentScreen]);

  const onPressClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      drawer: "AddAccountsModal",
      screen: currentScreen,
    });
    onClose();
  }, [onClose, currentScreen]);

  return (
    <BottomDrawer
      testId="AddAccountsModal"
      isOpen={isOpened}
      onClose={onPressClose}
      title={t("portfolio.emptyState.addAccounts.addAccounts")}
    >
      <TrackScreen
        category="Add/Import accounts"
        type="drawer"
        screen={currentScreen}
      />
      {!readOnlyModeEnabled && (
        <ChoiceCard
          title={t("addAccountsModal.add.title")}
          subTitle={t("addAccountsModal.add.description")}
          Image={<NanoXFolded size={96} />}
          onPress={onClickAdd}
        />
      )}

      <ChoiceCard
        title={t("addAccountsModal.import.title")}
        subTitle={t("addAccountsModal.import.description")}
        Image={
          <Illustration
            lightSource={images.light.withYourLedger}
            darkSource={images.dark.withYourLedger}
            size={96}
          />
        }
        onPress={onClickImport}
      />
    </BottomDrawer>
  );
}
