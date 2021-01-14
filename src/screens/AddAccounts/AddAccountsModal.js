// @flow

import React, { useCallback } from "react";
import Icon from "react-native-vector-icons/dist/Feather";
import IconFa from "react-native-vector-icons/dist/FontAwesome";
import SafeAreaView from "react-native-safe-area-view";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { NavigatorName } from "../../const";
import BottomModal from "../../components/BottomModal";
import BottomModalChoice from "../../components/BottomModalChoice";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";

type Props = {
  navigation: any,
  isOpened: boolean,
  onClose: () => void,
};

const forceInset = { bottom: "always" };

export default function AddAccountsModal({
  navigation,
  onClose,
  isOpened,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const onClickAdd = useCallback(() => {
    navigation.navigate(NavigatorName.AddAccounts);
    onClose();
  }, [navigation, onClose]);

  const onClickImport = useCallback(() => {
    navigation.navigate(NavigatorName.ImportAccounts);
    onClose();
  }, [navigation, onClose]);

  const IconPlus = () => <Icon name="plus" color={colors.live} size={18} />;
  const IconQr = () => <IconFa name="qrcode" color={colors.live} size={18} />;

  return (
    <BottomModal id="AddAccountsModal" isOpened={isOpened} onClose={onClose}>
      <SafeAreaView forceInset={forceInset}>
        {!readOnlyModeEnabled && (
          <BottomModalChoice
            event="AddAccountWithDevice"
            title={t("addAccountsModal.ctaAdd")}
            onPress={onClickAdd}
            Icon={IconPlus}
          />
        )}
        <BottomModalChoice
          event="AddAccountWithQR"
          title={t("addAccountsModal.ctaImport")}
          onPress={onClickImport}
          Icon={IconQr}
        />
      </SafeAreaView>
    </BottomModal>
  );
}
