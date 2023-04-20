import React, { useCallback, useState } from "react";
import { Account } from "@ledgerhq/types-live";
import { useHistory } from "react-router-dom";
import EthStakeIllustration from "./assets/EthStakeIlustration.tsx";
import ProviderItem from "./component/ProviderItem";
import { Flex } from "@ledgerhq/react-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import CheckBox from "~/renderer/components/CheckBox";
import { track } from "~/renderer/analytics/segment";
import { LOCAL_STORAGE_KEY_PREFIX } from "~/renderer/modals/Receive/steps/StepReceiveStakingFlow";
import { useTranslation } from "react-i18next";
import { openURL } from "~/renderer/linking";
import { CheckBoxContainer } from "~/renderer/modals/Receive/steps/StepReceiveStakingFlow.tsx";
type Props = {
  onClose: () => void;
  account: Account;
  checkbox?: boolean;
  singleProviderRedirectMode?: boolean;
  source?: string;
};
const Body = ({
  checkbox = false,
  singleProviderRedirectMode = true,
  source = "stake",
  onClose,
  account,
}: Props) => {
  const { t } = useTranslation();
  const history = useHistory();
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(false);
  const ethStakingProviders = useFeature("ethStakingProviders");
  const providers = ethStakingProviders?.params?.listProvider || [];
  const getTrackProperties = useCallback(
    value => {
      return {
        page: window.location.hash
          .split("/")
          .filter(e => e !== "#")
          .join("/"),
        modal: source,
        flow: "stake",
        value,
      };
    },
    [source],
  );
  const stakeOnClick = useCallback(
    provider => {
      const value = `/platform/${provider.liveAppId}`;
      track("button_clicked", {
        button: `${name}`,
        ...getTrackProperties(value),
      });
      history.push({
        pathname: value,
        state: {
          accountId: account.id,
        },
      });
      onClose();
    },
    [getTrackProperties, history, account.id, onClose],
  );
  const infoOnClick = useCallback(
    provider => {
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
    global.localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${account?.currency?.id}`, value);
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
          {providers.map((item, i) => (
            <Flex key={item.id} width="100%" flexDirection={"column"}>
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
export default Body;
