import React, {
  useCallback,
  memo,
  useState,
  ComponentType,
  ReactElement,
  ReactNode,
} from "react";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";
import { AccountLike, Account } from "@ledgerhq/live-common/types/index";
import { useSelector } from "react-redux";

import { BottomDrawer, ScrollContainer } from "@ledgerhq/native-ui";
import ChoiceButton from "../ChoiceButton";
import InfoModal from "../InfoModal";
import Button from "../wrappedUi/Button";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { track } from "../../analytics";
import { ModalOnDisabledClickComponentProps } from "../index";
import { useTranslation } from "react-i18next";

function ZeroBalanceDisabledModalContent({
  account,
  currency,
  isOpen,
}: ModalOnDisabledClickComponentProps) {
  const { t } = useTranslation();
  return (
    <BottomDrawer
      isOpen={isOpen}
      onClose={() => 0}
      title={t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbTitle")}
      description={t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbTitle")}
    ></BottomDrawer>
  );
}

export default ZeroBalanceDisabledModalContent;
