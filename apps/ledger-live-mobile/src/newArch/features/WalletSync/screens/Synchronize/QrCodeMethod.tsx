import React from "react";
import { DrawerTabSelector, Flex } from "@ledgerhq/native-ui";
import QrCode from "LLM/features/WalletSync/components/Synchronize/QrCode";
import ScanQrCode from "../../components/Synchronize/ScanQrCode";
import { Options, OptionsType } from "LLM/features/WalletSync/types/Activation";
import { useTranslation } from "react-i18next";
import {
  useLedgerSyncAnalytics,
  AnalyticsPage,
  AnalyticsButton,
} from "../../hooks/useLedgerSyncAnalytics";
import { TrackScreen } from "~/analytics";

interface Props {
  setSelectedOption: (option: OptionsType) => void;
  onQrCodeScanned: (data: string) => void;
  currentOption: Options;
  qrCodeValue?: string | null;
}

const QrCodeMethod = ({
  setSelectedOption,
  onQrCodeScanned,
  currentOption,
  qrCodeValue,
}: Props) => {
  const { onClickTrack } = useLedgerSyncAnalytics();
  const { t } = useTranslation();

  const handleSelectOption = (option: OptionsType) => {
    setSelectedOption(option);
    const button =
      option === Options.SCAN ? AnalyticsButton.ShowQRCode : AnalyticsButton.ScanQRCode;
    const page = option === Options.SCAN ? AnalyticsPage.ShowQRCode : AnalyticsPage.ScanQRCode;
    onClickTrack({
      button,
      page,
    });
  };

  const renderSwitch = () => {
    switch (currentOption) {
      case Options.SCAN:
        return (
          <>
            <TrackScreen name={AnalyticsPage.ScanQRCode} />
            <ScanQrCode onQrCodeScanned={onQrCodeScanned} />
          </>
        );
      case Options.SHOW_QR:
        return (
          <>
            <TrackScreen name={AnalyticsPage.ShowQRCode} />
            <QrCode qrCodeValue={qrCodeValue} />
          </>
        );
    }
  };

  return (
    <Flex flexDirection={"column"} alignItems={"center"} rowGap={24} width={"100%"} height={"100%"}>
      <DrawerTabSelector
        options={[Options.SCAN, Options.SHOW_QR]}
        selectedOption={currentOption}
        handleSelectOption={handleSelectOption}
        labels={{
          [Options.SCAN]: t("walletSync.synchronize.qrCode.scan.title"),
          [Options.SHOW_QR]: t("walletSync.synchronize.qrCode.show.title"),
        }}
      />
      {renderSwitch()}
    </Flex>
  );
};

export default QrCodeMethod;
