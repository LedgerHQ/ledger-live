import React, { useCallback, useState } from "react";
import { Account } from "@ledgerhq/types-live";
import { useHistory } from "react-router-dom";

import { Flex, Text } from "@ledgerhq/react-ui";
import { track } from "~/renderer/analytics/segment";
import {
  CheckBoxContainer,
  LOCAL_STORAGE_KEY_PREFIX,
} from "~/renderer/modals/Receive/steps/StepReceiveStakingFlow";
import { useTranslation } from "react-i18next";
import { openURL } from "~/renderer/linking";
import { ListProvider, ListProviders } from "./types";
import { getTrackProperties } from "./utils/getTrackProperties";
import { generateValidDappURLWithParams } from "~/helpers/generateValidDappURLWithParams";
import CheckBox from "~/renderer/components/CheckBox";
import { Manifest } from "~/types/manifest";
import ProviderItem from "./component/ProviderItem";

type Props = {
  account: Account;
  singleProviderRedirectMode?: boolean;
  onClose?: () => void;
  checkbox?: boolean;
  source?: string;
  listProviders?: ListProviders;
};

export type StakeOnClickProps = {
  provider: ListProvider;
  manifest: Manifest;
};

export function EthStakingModalBody({
  checkbox = false,
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
    ({ provider: { liveAppId, id, queryParams }, manifest }: StakeOnClickProps) => {
      const value = `/platform/${liveAppId}`;
      const customDappUrl = queryParams && generateValidDappURLWithParams(manifest, queryParams);
      track("button_clicked", {
        button: id,
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

  const infoOnClick = useCallback(({ liveAppId, supportLink }: ListProvider) => {
    if (supportLink) {
      track("button_clicked", {
        button: `learn_more_${liveAppId}`,
        ...getTrackProperties({ value: supportLink }),
        link: supportLink,
      });
      openURL(supportLink, "OpenURL", getTrackProperties({ value: supportLink }));
    }
  }, []);

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
    global.localStorage.setItem(
      `${LOCAL_STORAGE_KEY_PREFIX}${account?.currency?.id}`,
      value.toString(),
    );
    setDoNotShowAgain(value);
    track("button_clicked", {
      button: "not_show",
      ...getTrackProperties({ value: value.toString() }),
    });
  }, [doNotShowAgain, account?.currency?.id]);

  return (
    <Flex flexDirection={"column"} alignItems="center" width={"100%"}>
      <Flex flexDirection="column" alignItems="center" rowGap={16}>
        <Text ff="Inter|SemiBold" fontSize="24px" lineHeight="32px">
          {t("ethereum.stake.title")}
        </Text>
        <Text textAlign="center" color="neutral.c70" variant="body" maxWidth={400}>
          {t("ethereum.stake.subTitle")}
        </Text>
      </Flex>
      <Flex flexDirection={"column"} mt={5} px={20} width="100%">
        <Flex flexDirection={"column"} width="100%">
          {listProviders.map(item => (
            <Flex key={item.liveAppId} width="100%" flexDirection={"column"}>
              <ProviderItem
                provider={item}
                infoOnClick={infoOnClick}
                stakeOnClick={stakeOnClick}
                redirectIfOnlyProvider={redirectIfOnlyProvider}
              />
            </Flex>
          ))}
        </Flex>
        {!!checkbox && (
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
