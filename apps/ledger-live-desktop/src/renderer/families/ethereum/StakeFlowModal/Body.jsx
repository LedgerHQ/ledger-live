// @flow
import React, { useCallback, useState } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useHistory } from "react-router-dom";
import EthStakeIllustration from "./assets/EthStakeIlustration.tsx";
import ProviderItem from "./component/ProviderItem";
import { Flex } from "@ledgerhq/react-ui";
import styled from "styled-components";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import CheckBox from "~/renderer/components/CheckBox";
import { track } from "~/renderer/analytics/segment";
import { LOCAL_STORAGE_KEY_PREFIX } from "~/renderer/modals/Receive/steps/StepReceiveStakingFlow";
import { useTranslation } from "react-i18next";
import { openURL } from "~/renderer/linking";

type Props = {
  onClose: () => void,
  account: Account,
  checkbox?: boolean,
  singleProviderRedirectMode?: boolean,
  source?: string,
};

export const Separator: ThemedComponent<{}> = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${p => p.theme.colors.palette.divider};
`;
export const CheckBoxContainer: ThemedComponent<{}> = styled(Flex)`
  & > div {
    column-gap: 15px;
  }
  & span {
    font-size: 14px;
    line-height: 18px;
  }
`;

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
        state: { accountId: account.id },
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
              <Flex ml={3} width="auto" flexDirection={"column"}>
                <ProviderItem
                  id={item.liveAppId}
                  name={item.name}
                  provider={item}
                  infoOnClick={infoOnClick}
                  stakeOnClick={stakeOnClick}
                />
              </Flex>
              {i !== providers.length - 1 && <Separator />}
            </Flex>
          ))}
        </Flex>
        {checkbox && (
          <CheckBoxContainer
            p={3}
            borderColor="neutral.c50"
            borderRadius={8}
            borderWidth={1}
            borderStyle={"solid"}
            width={"100%"}
            onClick={checkBoxOnChange}
            mt={15}
            style={{ columnGap: 3, color: "red" }}
          >
            <CheckBox isChecked={doNotShowAgain} label={t("receive.steps.staking.notShow")} />
          </CheckBoxContainer>
        )}
      </Flex>
    </Flex>
  );
};

export default Body;
