import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/platform/utils/appendQueryParamsToDappURL";
import { Flex } from "@ledgerhq/react-ui";
import { Account, EthStakingProvider } from "@ledgerhq/types-live";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { track } from "~/renderer/analytics/segment";
import CheckBox from "~/renderer/components/CheckBox";
import {
  CheckBoxContainer,
  LOCAL_STORAGE_KEY_PREFIX,
} from "~/renderer/modals/Receive/steps/StepReceiveStakingFlow";
import { ProviderItem } from "./component/ProviderItem";
import { getTrackProperties } from "./utils/getTrackProperties";

type Props = {
  account: Account;
  onClose?: () => void;
  hasCheckbox?: boolean;
  source?: string;
  providers: EthStakingProvider[];
};

export type StakeOnClickProps = {
  provider: EthStakingProvider;
  manifest: LiveAppManifest;
};
export function EthStakingModalBody({
  hasCheckbox = false,
  source,
  onClose,
  account,
  providers,
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

  const checkBoxOnChange = useCallback(() => {
    const value = !doNotShowAgain;
    global.localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${account?.currency?.id}`, `${value}`);
    setDoNotShowAgain(value);
    track("button_clicked2", {
      button: "not_show",
      ...getTrackProperties({ value, modal: source }),
    });
  }, [doNotShowAgain, account?.currency?.id, source]);

  return (
    <Flex flexDirection="column" width="100%">
      <Flex flexDirection="column" rowGap={2}>
        {providers.map(x => (
          <Flex key={x.id} flexDirection="column">
            <ProviderItem provider={x} stakeOnClick={stakeOnClick} />
          </Flex>
        ))}
      </Flex>
      {hasCheckbox && (
        <CheckBoxContainer
          p={3}
          borderRadius={8}
          borderWidth={0}
          width="100%"
          onClick={checkBoxOnChange}
          mt={15}
        >
          <CheckBox isChecked={doNotShowAgain} label={t("receive.steps.staking.notShow")} />
        </CheckBoxContainer>
      )}
    </Flex>
  );
}
