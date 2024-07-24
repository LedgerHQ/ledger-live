import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Box } from "@ledgerhq/react-ui";
import { useRefreshMetadata } from "@ledgerhq/live-nft-react";
import { RefreshOpts } from "@ledgerhq/live-nft/api/simplehash";
import { InputRow } from "../components/InputRow";
import { SelectOption, SelectRow } from "../components/SelectRow";
import { RefreshOption } from "./type";
import { RefreshMetadataResult } from "@ledgerhq/live-nft-react/hooks/types";
import styled from "styled-components";
import { Result } from "../components/Result";
import { LedgerAPI4xx } from "@ledgerhq/errors";

export type HookResult = {
  refreshMutation: RefreshMetadataResult;
  displayInfo: boolean;
  refreshType: RefreshOption;
  contractAddress: string;
  chainId: string;
  tokenId: string;
  handleContractAddressChange: (value: string) => void;
  handleChainIdChange: (option: SelectOption) => void;
  handleTokenIdChange: (value: string) => void;
  handleRefreshTypeChange: (option: SelectOption) => void;
  onClick: () => void;
  closeInfo: () => void;
};

export function useHook(): HookResult {
  const refreshMutation = useRefreshMetadata();

  const [displayInfo, setDisplayInfo] = useState(false);
  const [refreshType, setRefreshType] = useState<RefreshOption>(RefreshOption.contract);
  const [contractAddress, setContractAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [tokenId, setTokenId] = useState("");

  const closeInfo = () => setDisplayInfo(false);
  const handleContractAddressChange = (value: string) => setContractAddress(value);
  const handleChainIdChange = (option: SelectOption) => setChainId(option.value);
  const handleTokenIdChange = (value: string) => setTokenId(value);
  const handleRefreshTypeChange = (option: SelectOption) =>
    setRefreshType(option.value as RefreshOption);

  const onClick = () => {
    const data: RefreshOpts = {
      ...(contractAddress && { contractAddress }),
      ...(chainId && { chainId }),
      ...(tokenId && { tokenId }),
      refreshType,
    };

    refreshMutation.mutateAsync(data).finally(() => {
      setDisplayInfo(true);
    });
  };

  return {
    handleContractAddressChange,
    handleChainIdChange,
    handleTokenIdChange,
    handleRefreshTypeChange,
    onClick,
    closeInfo,
    displayInfo,
    refreshType,
    contractAddress,
    chainId,
    tokenId,
    refreshMutation,
  };
}

export default function RefreshMetadata(props: HookResult) {
  const { t } = useTranslation();

  const {
    refreshType,
    tokenId,
    handleRefreshTypeChange,
    chainId,
    contractAddress,
    handleChainIdChange,
    handleContractAddressChange,
    handleTokenIdChange,
    refreshMutation,
    displayInfo,
  } = props;

  if (displayInfo && !refreshMutation.isPending) {
    const getErrorText = (error: Error) => {
      if (error instanceof LedgerAPI4xx) {
        return t("settings.developer.debugSimpleHash.debugRefreshMetadata.error");
      }
      return (error as Error).message;
    };

    const text = refreshMutation.isError
      ? getErrorText(refreshMutation.error)
      : t("settings.developer.debugSimpleHash.debugRefreshMetadata.success");
    return <Result text={text} variant={refreshMutation.isSuccess ? "success" : "error"} />;
  }

  return (
    <Flex flexDirection="column">
      <SelectRow
        title={""}
        desc={t("settings.developer.debugSimpleHash.debugRefreshMetadata.refreshType.desc")}
        value={{ label: refreshType, value: refreshType }}
        options={[
          {
            label: t(
              `settings.developer.debugSimpleHash.debugRefreshMetadata.refreshType.${RefreshOption.nft}`,
            ),
            value: RefreshOption.nft,
          },
          {
            label: t(
              `settings.developer.debugSimpleHash.debugRefreshMetadata.refreshType.${RefreshOption.contract}`,
            ),
            value: RefreshOption.contract,
          },
        ]}
        onChange={handleRefreshTypeChange}
      />

      <InputRow
        title={t("settings.developer.debugSimpleHash.debugRefreshMetadata.contractAddress")}
        desc={t("settings.developer.debugSimpleHash.debugRefreshMetadata.contractAddressDesc")}
        value={contractAddress}
        onChange={handleContractAddressChange}
      />

      <SelectRow
        title={t("settings.developer.debugSimpleHash.debugRefreshMetadata.chainId")}
        desc={t("settings.developer.debugSimpleHash.debugRefreshMetadata.chainIdDesc")}
        value={{ label: chainId, value: chainId }}
        options={[
          { label: "Ethereum", value: "ethereum" },
          { label: "Polygon", value: "polygon" },
        ]}
        onChange={handleChainIdChange}
      />

      <DisabledContainer disabled={refreshType !== RefreshOption.nft}>
        <InputRow
          disabled={refreshType !== RefreshOption.nft}
          title={t("settings.developer.debugSimpleHash.debugRefreshMetadata.tokenId")}
          desc={t("settings.developer.debugSimpleHash.debugRefreshMetadata.tokenIdDesc")}
          value={tokenId}
          onChange={handleTokenIdChange}
        />
      </DisabledContainer>
    </Flex>
  );
}
const DisabledContainer = styled(Box).attrs((p: { disabled?: boolean }) => ({
  opacity: p.disabled ? 0.3 : 1,
}))<{ disabled?: boolean }>``;
