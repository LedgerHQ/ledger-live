import React, { useCallback } from "react";
import { Account } from "@ledgerhq/types-live";
import { useHistory } from "react-router-dom";

import { Flex, Text } from "@ledgerhq/react-ui";
import { track } from "~/renderer/analytics/segment";
import { useTranslation } from "react-i18next";
import { openURL } from "~/renderer/linking";
import { ListProvider, ListProviders } from "./types";
import { getTrackProperties } from "./utils/getTrackProperties";
import { generateValidDappURLWithParams } from "~/helpers/generateValidDappURLWithParams";
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
  singleProviderRedirectMode = true,
  source,
  onClose,
  account,
  listProviders = [],
}: Props) {
  const { t } = useTranslation();
  const history = useHistory();

  const stakeOnClick = useCallback(
    ({
      provider: { liveAppId, id: providerConfigID, queryParams },
      manifest,
    }: StakeOnClickProps) => {
      const value = `/platform/${liveAppId}`;
      const customDappUrl = queryParams && generateValidDappURLWithParams(manifest, queryParams);
      track("button_clicked", {
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

  const infoOnClick = useCallback(({ supportLink, id: providerConfigID }: ListProvider) => {
    if (supportLink) {
      track("button_clicked", {
        button: `learn_more_${providerConfigID}`,
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

  return (
    <Flex flexDirection={"column"} alignItems="center" width={"100%"}>
      <Flex flexDirection="column" alignItems="center" rowGap={16}>
        <Text ff="Inter|SemiBold" fontSize="24px" lineHeight="32px">
          {t("ethereum.stake.title")}
        </Text>
        <Text textAlign="center" color="neutral.c70" fontSize={14} maxWidth={360}>
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
      </Flex>
    </Flex>
  );
}
