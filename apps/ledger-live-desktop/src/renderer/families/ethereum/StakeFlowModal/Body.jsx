// @flow
import React, { useCallback, useState } from "react";
import type { Account } from "@ledgerhq/types-live";
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
type Props = {
  onClose: () => void,
  account: Account,
  checkbox?: boolean,
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

const Body = ({ checkbox = false, source = "stake", ...itemProps }: Props) => {
  const { t } = useTranslation();
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(false);
  const ethStakingProviders = useFeature("ethStakingProviders");
  const providers = ethStakingProviders?.params?.listProvider || [];
  const onChange = useCallback(() => {
    const value = !doNotShowAgain;
    global.localStorage.setItem(
      `${LOCAL_STORAGE_KEY_PREFIX}${itemProps?.account?.currency?.id}`,
      value,
    );
    setDoNotShowAgain(value);
    track("button_clicked", {
      button: "not_show",
      page: window.location.hash
        .split("/")
        .filter(e => e !== "#")
        .join("/"),
      modal: source,
      flow: "stake",
      value,
    });
  }, [doNotShowAgain, itemProps?.account?.currency?.id, source]);
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
                  supportLink={item.supportLink}
                  source={source}
                  {...itemProps}
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
            onClick={onChange}
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
