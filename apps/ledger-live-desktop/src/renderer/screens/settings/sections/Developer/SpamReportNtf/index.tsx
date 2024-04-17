import React, { useState } from "react";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { useTranslation } from "react-i18next";
import { Text, Flex } from "@ledgerhq/react-ui";
import Switch from "~/renderer/components/Switch";
import Button from "~/renderer/components/ButtonV3";
import { useSpamReportNft } from "@ledgerhq/live-nft-react";
import { NftSpamReportOpts, EventType } from "@ledgerhq/live-nft/api/simplehash";
import { InputRow } from "./InputRow";
import { SelectRow } from "./SelectRow";
import { ReportOption, SelectOption } from "./type";

export default function SpamReportNtf() {
  const { t } = useTranslation();
  const [allowReport, setAllowReport] = useState(false);

  return (
    <Row
      title={t("settings.developer.debugSpamNft.debugNFTSpamReport")}
      desc={<Body allowReport={allowReport} />}
    >
      <Switch
        isChecked={allowReport}
        onChange={setAllowReport}
        data-test-id="settings-allow-debug-nft-spam-report"
      />
    </Row>
  );
}

function Body({ allowReport }: { allowReport: boolean }) {
  const { t } = useTranslation();
  const [displayInfo, setDisplayInfo] = useState(false);
  const spamReportMutation = useSpamReportNft();
  const [reportType, setReportType] = useState<ReportOption>(ReportOption.contract);
  const [collectionId, setCollectionId] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [tokenId, setTokenId] = useState("");

  const [report, setReport] = useState<EventType>(EventType.mark_as_not_spam);

  const handleCollectionIdChange = (value: string) => setCollectionId(value);
  const handleContractAddressChange = (value: string) => setContractAddress(value);
  const handleChainIdChange = (option: SelectOption) => setChainId(option.value);
  const handleTokenIdChange = (value: string) => setTokenId(value);
  const handleReportChange = (option: SelectOption) => setReport(option.value as EventType);
  const handleReportTypeChange = (option: SelectOption) =>
    setReportType(option.value as ReportOption);

  const onClick = () => {
    const data: NftSpamReportOpts = {
      ...(contractAddress && { contractAddress }),
      ...(collectionId && { collectionId }),
      ...(chainId && { chainId }),
      ...(tokenId && { tokenId }),
      eventType: report,
    };

    spamReportMutation.mutateAsync(data).finally(() => {
      setDisplayInfo(true);
      setTimeout(() => {
        setDisplayInfo(false);
      }, 5000);
    });
  };

  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <div>{t("settings.developer.debugSpamNft.debugNFTSpamReportDesc")}</div>
      {allowReport && (
        <Flex mt={3} flexDirection="column" justifyContent="space-between">
          <SelectRow
            title={""}
            desc={t("settings.developer.debugSpamNft.reportType.desc")}
            value={{ label: reportType, value: reportType }}
            options={[
              {
                label: t(`settings.developer.debugSpamNft.reportType.${ReportOption.individual}`),
                value: ReportOption.individual,
              },
              {
                label: t(`settings.developer.debugSpamNft.reportType.${ReportOption.contract}`),
                value: ReportOption.contract,
              },
              {
                label: t(`settings.developer.debugSpamNft.reportType.${ReportOption.collection}`),
                value: ReportOption.collection,
              },
            ]}
            onChange={handleReportTypeChange}
          />

          {reportType === ReportOption.collection && (
            <InputRow
              title={t("settings.developer.debugSpamNft.collectionId")}
              desc={t("settings.developer.debugSpamNft.collectionIdDesc")}
              value={collectionId}
              onChange={handleCollectionIdChange}
            />
          )}

          {(reportType === ReportOption.contract || reportType === ReportOption.individual) && (
            <>
              <InputRow
                title={t("settings.developer.debugSpamNft.contractAddress")}
                desc={t("settings.developer.debugSpamNft.contractAddressDesc")}
                value={contractAddress}
                onChange={handleContractAddressChange}
              />

              <SelectRow
                title={t("settings.developer.debugSpamNft.chainId")}
                desc={t("settings.developer.debugSpamNft.chainIdDesc")}
                value={{ label: chainId, value: chainId }}
                options={[
                  { label: "Ethereum", value: "ethereum" },
                  { label: "Polygon", value: "polygon" },
                ]}
                onChange={handleChainIdChange}
              />
            </>
          )}

          {reportType === ReportOption.individual && (
            <InputRow
              title={t("settings.developer.debugSpamNft.tokenId")}
              desc={t("settings.developer.debugSpamNft.tokenIdDesc")}
              value={tokenId}
              onChange={handleTokenIdChange}
            />
          )}

          <SelectRow
            title={t("settings.developer.debugSpamNft.eventType")}
            desc={t("settings.developer.debugSpamNft.eventTypeDesc")}
            value={{ label: report, value: report }}
            onChange={handleReportChange}
            options={[
              { label: "mark_as_not_spam", value: "mark_as_not_spam" },
              { label: "mark_as_spam", value: "mark_as_spam" },
            ]}
          />

          {displayInfo && (
            <Flex flexDirection="column">
              <Text color={spamReportMutation.isSuccess ? "success.c70" : "error.c70"}>
                {spamReportMutation.isSuccess
                  ? t("settings.developer.debugSpamNft.success")
                  : t("settings.developer.debugSpamNft.error")}
              </Text>
              {spamReportMutation.isError && (
                <Text color="error.c70" mt={2}>
                  {spamReportMutation.error?.message}
                </Text>
              )}
            </Flex>
          )}

          <Button alignSelf={"flex-start"} mt={3} variant="color" onClick={onClick}>
            {t("settings.developer.debugSpamNft.report")}
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
