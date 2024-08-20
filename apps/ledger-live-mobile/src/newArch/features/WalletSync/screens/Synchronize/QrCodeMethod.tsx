import React from "react";
import { Flex, TabSelector } from "@ledgerhq/native-ui";
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
}

const QrCodeMethod = ({ setSelectedOption, onQrCodeScanned, currentOption }: Props) => {
  const { onClickTrack } = useLedgerSyncAnalytics();
  const { t } = useTranslation();

  const handleSelectOption = (option: OptionsType) => {
    setSelectedOption(option);
    const button =
      option === Options.SCAN ? AnalyticsButton.ScanQRCode : AnalyticsButton.ShowQRCode;
    onClickTrack({
      button,
      page: AnalyticsPage.ScanQRCode,
    });
  };

  const renderSwitch = () => {
    switch (currentOption) {
      case Options.SCAN:
        return (
          <>
            <TrackScreen category={AnalyticsPage.ScanQRCode} />
            <ScanQrCode onQrCodeScanned={onQrCodeScanned} />
          </>
        );
      case Options.SHOW_QR:
        return (
          <>
            <TrackScreen category={AnalyticsPage.ShowQRCode} />
            <QrCode qrCodeValue="ledger.com" />
          </>
        );
    }
  };

  return (
    <Flex flexDirection={"column"} alignItems={"center"} rowGap={24} width={"100%"} height={"100%"}>
      <TabSelector
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
