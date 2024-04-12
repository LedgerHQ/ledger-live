import React, { useState } from "react";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { useTranslation } from "react-i18next";
import { Text, Flex } from "@ledgerhq/react-ui";
import Switch from "~/renderer/components/Switch";
import Button from "~/renderer/components/ButtonV3";
import Input from "~/renderer/components/Input";
import Select from "~/renderer/components/Select";
import { useSpamReportNft } from "@ledgerhq/live-nft-react";
import { NftSpamReportOpts, EventType } from "@ledgerhq/live-nft/api/simplehash";

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
  const spamReportMutation = useSpamReportNft();
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

  const onClick = () => {
    const data: NftSpamReportOpts = {
      ...(contractAddress && { contractAddress }),
      ...(collectionId && { collectionId }),
      ...(chainId && { chainId }),
      ...(tokenId && { tokenId }),
      eventType: report,
    };

    spamReportMutation.mutate(data);
  };
  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <div>{t("settings.developer.debugSpamNft.debugNFTSpamReportDesc")}</div>
      {allowReport && (
        <Flex mt={3} flexDirection="column" justifyContent="space-between">
          <InputRow
            title={t("settings.developer.debugSpamNft.collectionId")}
            desc={t("settings.developer.debugSpamNft.collectionIdDesc")}
            value={collectionId}
            onChange={handleCollectionIdChange}
          />
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

          <InputRow
            title={t("settings.developer.debugSpamNft.tokenId")}
            desc={t("settings.developer.debugSpamNft.tokenIdDesc")}
            value={tokenId}
            onChange={handleTokenIdChange}
          />

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

          <Button alignSelf={"flex-start"} mt={3} variant="color" onClick={onClick}>
            {t("settings.developer.debugSpamNft.report")}
          </Button>
        </Flex>
      )}
    </Flex>
  );
}

const InputRow = ({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <Flex flexDirection="column" mb={2}>
      <Text mb={2}>{title}</Text>
      <Input placeholder={desc} value={value} onChange={onChange} />
    </Flex>
  );
};

type SelectOption = { value: string; label: string };
const SelectRow = ({
  title,
  desc,
  value,
  options,
  onChange,
}: {
  title: string;
  desc: string;
  options: SelectOption[];
  value: SelectOption;
  onChange: (value: SelectOption) => void;
}) => {
  const avoidEmptyValue = (option?: SelectOption | null) => option && onChange(option);
  return (
    <Flex flexDirection="column" mb={2}>
      <Text mb={2}>{title}</Text>
      <Text mb={2}>{desc}</Text>
      <Select
        onChange={avoidEmptyValue}
        options={options}
        value={value}
        isSearchable={false}
        defaultValue={options[0]}
        required
      />
    </Flex>
  );
};
