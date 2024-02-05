import { Flex, Text } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";
import React, { useCallback, useState } from "react";
import { useHistory } from "react-router-dom";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";

import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/platform/utils/appendQueryParamsToDappURL";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { track } from "~/renderer/analytics/segment";
import CheckBox from "~/renderer/components/CheckBox";
import EthStakeIllustration from "~/renderer/icons/EthStakeIllustration";

import {
  CheckBoxContainer,
  LOCAL_STORAGE_KEY_PREFIX,
} from "~/renderer/modals/Receive/steps/StepReceiveStakingFlow";
import { ListProvider, ListProviders } from "./types";
import { getTrackProperties } from "./utils/getTrackProperties";

import ProviderItem from "./component/ProviderItem";

const ethMagnitude = getCryptoCurrencyById("ethereum").units[0].magnitude;

const ETH_LIMIT = BigNumber(32).times(BigNumber(10).pow(ethMagnitude));

// Comparison fns for sorting providers by minimum ETH required
const ascending = (a: ListProvider, b: ListProvider) => (a?.min || 0) - (b?.min || 0);
const descending = (a: ListProvider, b: ListProvider) => (b?.min || 0) - (a?.min || 0);

type Props = {
  account: Account;
  singleProviderRedirectMode?: boolean;
  onClose?: () => void;
  hasCheckbox?: boolean;
  source?: string;
  listProviders?: ListProviders;
};

export type StakeOnClickProps = {
  provider: ListProvider;
  manifest: LiveAppManifest;
};

export function EthStakingModalBody({
  hasCheckbox = false,
  singleProviderRedirectMode = true,
  source,
  onClose,
  account,
  listProviders = [],
}: Props) {
  const { t } = useTranslation();
  const history = useHistory();
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(false);

  const stakeOnClick = useCallback(
    ({
      provider: { liveAppId, id: providerConfigID, queryParams },
      manifest,
    }: StakeOnClickProps) => {
      const value = `/platform/${liveAppId}`;
      const customDappUrl = queryParams && appendQueryParamsToDappURL(manifest, queryParams);
      track("button_clicked2", {
        button: providerConfigID,
        ...getTrackProperties({ value, modal: source }),
      });
      history.push({
        pathname: value,
        ...(customDappUrl ? { customDappUrl } : {}),
        state: {
          accountId: account.id,
        },
      });
      onClose?.();
    },
    [history, account.id, onClose, source],
  );

  const redirectIfOnlyProvider = useCallback(
    (stakeOnClickProps: StakeOnClickProps) => {
      if (singleProviderRedirectMode && listProviders.length === 1) {
        stakeOnClick(stakeOnClickProps);
      }
    },
    [singleProviderRedirectMode, listProviders.length, stakeOnClick],
  );

  const checkBoxOnChange = useCallback(() => {
    const value = !doNotShowAgain;
    global.localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${account?.currency?.id}`, `${value}`);
    setDoNotShowAgain(value);
    track("button_clicked2", {
      button: "not_show",
      ...getTrackProperties({ value, modal: source }),
    });
  }, [doNotShowAgain, account?.currency?.id, source]);

  const hasMinValidatorEth = account.spendableBalance.isGreaterThan(ETH_LIMIT);

  const listProvidersSorted = listProviders.sort(hasMinValidatorEth ? descending : ascending);

  return (
    <Flex flexDirection={"column"} alignItems="center" width={"100%"}>
      <Flex flexDirection="column" alignItems="center" rowGap={16}>
        <Text ff="Inter|SemiBold" fontSize="24px" lineHeight="32px">
          {t("ethereum.stake.title")}
        </Text>
        {listProviders.length <= 1 && (
          <Flex justifyContent="center" py={20} width="100%">
            <EthStakeIllustration size={140} />
          </Flex>
        )}
        <Text textAlign="center" color="neutral.c70" fontSize={14} maxWidth={360}>
          {t("ethereum.stake.subTitle")}
        </Text>
      </Flex>
      <Flex flexDirection={"column"} mt={5} px={20} width="100%">
        <Flex flexDirection={"column"} width="100%">
          {listProvidersSorted.map(item => (
            <Flex key={item.id} width="100%" flexDirection={"column"}>
              <ProviderItem
                provider={item}
                stakeOnClick={stakeOnClick}
                redirectIfOnlyProvider={redirectIfOnlyProvider}
              />
            </Flex>
          ))}
        </Flex>
        {hasCheckbox && (
          <CheckBoxContainer
            p={3}
            borderRadius={8}
            borderWidth={0}
            width={"100%"}
            onClick={checkBoxOnChange}
            mt={15}
          >
            <CheckBox isChecked={doNotShowAgain} label={t("receive.steps.staking.notShow")} />
          </CheckBoxContainer>
        )}
      </Flex>
    </Flex>
  );
}
