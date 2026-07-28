import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import { OptionButton } from "../components/OptionButton";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
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
}>;

function View({ isOpen, t, handleGoToFiat, handleGoToCrypto, handleClose }: ViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  const content = (
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
        {content}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}

const ReceiveFundsOptions = () => <View {...useReceiveFundsOptionsViewModel()} />;

export default ReceiveFundsOptions;
