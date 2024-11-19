import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";
import { useCheckSpamScore } from "@ledgerhq/live-nft-react";
import { InputRow } from "../components/InputRow";
import { SelectOption, SelectRow } from "../components/SelectRow";
import { CheckSpamScoreResult } from "@ledgerhq/live-nft-react/hooks/types";
import { Result } from "../components/Result";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { SimpleHashResponse } from "@ledgerhq/live-nft/api/types";
import { createOptions } from "../helper";

export type HookResult = {
  checkSpamScore: CheckSpamScoreResult;
  displayInfo: boolean;
  contractAddress: string;
  chainId: string;
  handleContractAddressChange: (value: string) => void;
  handleChainIdChange: (option: SelectOption) => void;
  onClick: () => void;
  closeInfo: () => void;
};

export function useHook(): HookResult {
  const [displayInfo, setDisplayInfo] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [chainId, setChainId] = useState("");

  const checkSpamScore = useCheckSpamScore({
    contractAddress,
    chainId,
  });

  const closeInfo = () => setDisplayInfo(false);

  const handleContractAddressChange = (value: string) => setContractAddress(value);
  const handleChainIdChange = (option: SelectOption) => setChainId(option.value);

  const onClick = () => {
    checkSpamScore.refetch().finally(() => setDisplayInfo(true));
  };

  return {
    handleContractAddressChange,
    handleChainIdChange,
    onClick,
    displayInfo,
    contractAddress,
    chainId,
    checkSpamScore,
    closeInfo,
  };
}

export default function SpamScore(props: HookResult) {
  const { t } = useTranslation();

  const {
    chainId,
    contractAddress,
    handleChainIdChange,
    handleContractAddressChange,
    checkSpamScore,
    displayInfo,
  } = props;

  if (displayInfo && !checkSpamScore.isLoading) {
    const getErrorText = (error: Error) => {
      if (error instanceof LedgerAPI4xx) {
        return t("settings.developer.debugSimpleHash.debugCheckSpamScore.error");
      }
      return (error as Error).message;
    };

    const getScore = (data?: SimpleHashResponse) => data?.nfts[0]?.collection.spam_score || 100;

    const text = checkSpamScore.isError
      ? getErrorText(checkSpamScore.error)
      : t("settings.developer.debugSimpleHash.debugCheckSpamScore.result.title", {
          score: getScore(checkSpamScore.data),
        });
    return (
      <Result
        text={text}
        description={
          checkSpamScore.isSuccess
            ? t("settings.developer.debugSimpleHash.debugCheckSpamScore.result.desc")
            : undefined
        }
        variant={checkSpamScore.isSuccess ? "success" : "error"}
      />
    );
  }

  return (
    <Flex flexDirection="column">
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
        options={createOptions()}
        onChange={handleChainIdChange}
      />
    </Flex>
  );
}
