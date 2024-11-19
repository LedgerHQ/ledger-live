import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Box } from "@ledgerhq/react-ui";
import { useSpamReportNft } from "@ledgerhq/live-nft-react";
import { NftSpamReportOpts, EventType } from "@ledgerhq/live-nft/api/simplehash";
import { InputRow } from "../components/InputRow";
import { SelectOption, SelectRow } from "../components/SelectRow";
import { ReportOption } from "./type";
import { SpamReportNftResult } from "@ledgerhq/live-nft-react/hooks/types";
import styled from "styled-components";
import { Result } from "../components/Result";
import { createOptions } from "../helper";

export type HookResult = {
  handleCollectionIdChange: (value: string) => void;
  handleContractAddressChange: (value: string) => void;
  handleChainIdChange: (option: SelectOption) => void;
  handleTokenIdChange: (value: string) => void;
  handleReportChange: (option: SelectOption) => void;
  handleReportTypeChange: (option: SelectOption) => void;
  onClick: () => void;
  reportType: ReportOption;
  report: EventType;
  tokenId: string;
  collectionId: string;
  contractAddress: string;
  displayInfo: boolean;
  chainId: string;
  spamReportMutation: SpamReportNftResult;
  closeInfo: () => void;
};

export function useHook(): HookResult {
  const [displayInfo, setDisplayInfo] = useState(false);
  const spamReportMutation = useSpamReportNft();
  const [reportType, setReportType] = useState<ReportOption>(ReportOption.contract);
  const [collectionId, setCollectionId] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [tokenId, setTokenId] = useState("");

  const [report, setReport] = useState<EventType>(EventType.mark_as_not_spam);

  const closeInfo = () => setDisplayInfo(false);
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
    });
  };

  return {
    handleCollectionIdChange,
    handleContractAddressChange,
    handleChainIdChange,
    handleTokenIdChange,
    handleReportChange,
    handleReportTypeChange,
    onClick,
    reportType,
    report,
    tokenId,
    collectionId,
    contractAddress,
    displayInfo,
    chainId,
    spamReportMutation,
    closeInfo,
  };
}

export default function SpamReport(props: HookResult) {
  const { t } = useTranslation();
  const {
    handleCollectionIdChange,
    handleContractAddressChange,
    handleChainIdChange,
    handleTokenIdChange,
    handleReportChange,
    handleReportTypeChange,
    reportType,
    report,
    tokenId,
    collectionId,
    contractAddress,
    displayInfo,
    spamReportMutation,
    chainId,
  } = props;

  if (displayInfo && !spamReportMutation.isPending) {
    return (
      <Result
        text={
          spamReportMutation.isError
            ? spamReportMutation.error?.message
            : t("settings.developer.debugSimpleHash.debugSpamNft.success")
        }
        variant={spamReportMutation.isSuccess ? "success" : "error"}
      />
    );
  }

  return (
    <Flex flexDirection="column" justifyContent="space-between">
      <SelectRow
        title={""}
        desc={t("settings.developer.debugSimpleHash.debugSpamNft.reportType.desc")}
        value={{ label: reportType, value: reportType }}
        options={[
          {
            label: t(
              `settings.developer.debugSimpleHash.debugSpamNft.reportType.${ReportOption.individual}`,
            ),
            value: ReportOption.individual,
          },
          {
            label: t(
              `settings.developer.debugSimpleHash.debugSpamNft.reportType.${ReportOption.contract}`,
            ),
            value: ReportOption.contract,
          },
          {
            label: t(
              `settings.developer.debugSimpleHash.debugSpamNft.reportType.${ReportOption.collection}`,
            ),
            value: ReportOption.collection,
          },
        ]}
        onChange={handleReportTypeChange}
      />

      <DisabledContainer disabled={reportType !== ReportOption.collection}>
        <InputRow
          disabled={reportType !== ReportOption.collection}
          title={t("settings.developer.debugSimpleHash.debugSpamNft.collectionId")}
          desc={t("settings.developer.debugSimpleHash.debugSpamNft.collectionIdDesc")}
          value={collectionId}
          onChange={handleCollectionIdChange}
        />
      </DisabledContainer>

      <DisabledContainer disabled={reportType === ReportOption.collection}>
        <InputRow
          disabled={reportType === ReportOption.collection}
          title={t("settings.developer.debugSimpleHash.debugSpamNft.contractAddress")}
          desc={t("settings.developer.debugSimpleHash.debugSpamNft.contractAddressDesc")}
          value={contractAddress}
          onChange={handleContractAddressChange}
        />

        <SelectRow
          title={t("settings.developer.debugSimpleHash.debugSpamNft.chainId")}
          desc={t("settings.developer.debugSimpleHash.debugSpamNft.chainIdDesc")}
          value={{ label: chainId, value: chainId }}
          options={createOptions()}
          onChange={handleChainIdChange}
        />
      </DisabledContainer>

      <DisabledContainer disabled={reportType !== ReportOption.individual}>
        <InputRow
          disabled={reportType !== ReportOption.individual}
          title={t("settings.developer.debugSimpleHash.debugSpamNft.tokenId")}
          desc={t("settings.developer.debugSimpleHash.debugSpamNft.tokenIdDesc")}
          value={tokenId}
          onChange={handleTokenIdChange}
        />
      </DisabledContainer>

      <SelectRow
        title={t("settings.developer.debugSimpleHash.debugSpamNft.eventType")}
        desc={t("settings.developer.debugSimpleHash.debugSpamNft.eventTypeDesc")}
        value={{ label: report, value: report }}
        onChange={handleReportChange}
        options={[
          { label: "mark_as_not_spam", value: "mark_as_not_spam" },
          { label: "mark_as_spam", value: "mark_as_spam" },
        ]}
      />
    </Flex>
  );
}

const DisabledContainer = styled(Box).attrs((p: { disabled?: boolean }) => ({
  opacity: p.disabled ? 0.3 : 1,
}))<{ disabled?: boolean }>``;
