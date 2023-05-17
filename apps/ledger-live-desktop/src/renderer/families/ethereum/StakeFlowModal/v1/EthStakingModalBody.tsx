import React, { useCallback, useState } from "react";
import { Account } from "@ledgerhq/types-live";
import { useHistory } from "react-router-dom";
import EthStakeIllustration from "../assets/EthStakeIlustration";
import ProviderItem from "./ProviderItem";
import { Flex } from "@ledgerhq/react-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import CheckBox from "~/renderer/components/CheckBox";
import { track } from "~/renderer/analytics/segment";
import {
  LOCAL_STORAGE_KEY_PREFIX,
  CheckBoxContainer,
} from "~/renderer/modals/Receive/steps/StepReceiveStakingFlow";
import { useTranslation } from "react-i18next";
import { openURL } from "~/renderer/linking";
import { Provider } from "./types";
import { getTrackProperties } from "../utils/getTrackProperties";
type Props = {
  onClose?: () => void;
  account: Account;
  checkbox?: boolean;
  singleProviderRedirectMode?: boolean;
  source?: string;
};
export const EthStakingModalBody = ({
  checkbox = false,
  singleProviderRedirectMode = true,
  source = "stake",
  onClose,
  account,
}: Props) => {
  const { t } = useTranslation();
  const history = useHistory();
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(false);
  const ethStakingProviders = useFeature<{
    listProvider: Array<{
      name: string;
      minAccountBalance: number;
      liveAppId: string;
      supportLink: string;
    }>;
  }>("ethStakingProviders");
  const providers = ethStakingProviders?.params?.listProvider || [];

  const stakeOnClick = useCallback(
    (provider: Provider) => {
      const value = `/platform/${provider.liveAppId}`;
      track("button_clicked", {
        button: provider.name,
        ...getTrackProperties({ value, locationHash: window.location.hash, source }),
      });
      history.push({
        pathname: value,
        state: {
          accountId: account.id,
        },
      });
      onClose?.();
    },
    [history, account.id, onClose, source],
  );
  const infoOnClick = useCallback(
    (provider: Provider) => {
      const { liveAppId, supportLink } = provider;
      track("button_clicked", {
        button: `learn_more_${liveAppId}`,
        ...getTrackProperties(supportLink),
        link: supportLink,
      });
      openURL(supportLink, "OpenURL", getTrackProperties(supportLink));
    },
    [getTrackProperties],
  );
  if (singleProviderRedirectMode && providers.length === 1) {
    stakeOnClick(providers[0]);
  }
  const checkBoxOnChange = useCallback(() => {
    const value = !doNotShowAgain;
    global.localStorage.setItem(
      `${LOCAL_STORAGE_KEY_PREFIX}${account?.currency?.id}`,
      value.toString(),
    );
    setDoNotShowAgain(value);
    track("button_clicked", {
      button: "not_show",
      ...getTrackProperties(value),
    });
  }, [doNotShowAgain, account?.currency?.id, getTrackProperties]);
  return (
    <Flex flexDirection={"column"} alignItems="center" width={"100%"}>
      <EthStakeIllustration size={140} />
      <Flex flexDirection={"column"} mt={7} px={20} width="100%">
        <Flex flexDirection={"column"} width="100%">
          {providers.map(item => (
            <Flex key={item.liveAppId} width="100%" flexDirection={"column"}>
              <ProviderItem
                id={item.liveAppId}
                name={item.name}
                provider={item}
                infoOnClick={infoOnClick}
                stakeOnClick={stakeOnClick}
              />
            </Flex>
          ))}
        </Flex>
        {checkbox && (
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
};
