import React from "react";
import { Text, Icons } from "@ledgerhq/native-ui";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import { OptionButton } from "../components/OptionButton";
import { OptionButtonLegacy } from "../components/OptionButtonLegacy";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import useReceiveFundsOptionsViewModel from "./useReceiveFundsOptionsViewModel";
import { TFunction } from "i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QrCode, Bank } from "@ledgerhq/lumen-ui-rnative/symbols";

type ViewProps = Readonly<{
  isOpen: boolean;
  t: TFunction;
  handleGoToFiat: () => void;
  handleGoToCrypto: () => void;
  handleClose: () => void;
  isEnabled: boolean;
}>;

function View({ isOpen, t, handleGoToFiat, handleGoToCrypto, handleClose, isEnabled }: ViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  if (isEnabled) {
    const newContent = (
      <>
        <TrackScreen category="receive_drawer" type="drawer" />
        <Text fontSize={24} mb={5}>
          {t("transfer.receive.title")}
        </Text>
        <OptionButton
          onPress={handleGoToCrypto}
          title={t("transfer.receive.menu.crypto.title")}
          testID="option-button-content-crypto"
          Icon={QrCode}
        />
        <OptionButton
          onPress={handleGoToFiat}
          title={t("transfer.receive.menu.fiat.title")}
          subtitle={t("transfer.receive.menu.fiat.description")}
          Icon={Bank}
          testID="option-button-content-fiat"
        />
      </>
    );

    return (
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isOpen}
        enableDynamicSizing
        onClose={handleClose}
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
          <BottomSheetHeader />
          {newContent}
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    );
  }

  const legacyContent = (
    <>
      <TrackScreen category="receive_drawer" type="drawer" />
      <Text textAlign="center" fontSize={24} mb={5}>
        {t("transfer.receive.title")}
      </Text>
      <OptionButtonLegacy
        onPress={handleGoToFiat}
        title={t("transfer.receive.menu.fiat.title")}
        subtitle={t("transfer.receive.menu.fiat.description_legacy")}
        Icon={Icons.Bank}
        testID="option-button-content-fiat"
      />
      <OptionButtonLegacy
        onPress={handleGoToCrypto}
        title={t("transfer.receive.menu.crypto.title")}
        subtitle={t("transfer.receive.menu.crypto.description")}
        testID="option-button-content-crypto"
        Icon={Icons.CoinsCrypto}
      />
    </>
  );

  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isOpen}
      snapPoints={["35%", "55%"]}
      onClose={handleClose}
    >
      {legacyContent}
    </QueuedDrawerGorhom>
  );
}

const ReceiveFundsOptions = () => <View {...useReceiveFundsOptionsViewModel()} />;

export default ReceiveFundsOptions;
