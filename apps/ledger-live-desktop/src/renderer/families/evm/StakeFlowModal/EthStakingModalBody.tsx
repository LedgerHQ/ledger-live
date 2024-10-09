import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/platform/utils/appendQueryParamsToDappURL";
import { Flex } from "@ledgerhq/react-ui";
import { Account, EthStakingProvider } from "@ledgerhq/types-live";
import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { track } from "~/renderer/analytics/segment";
import { ProviderItem } from "./component/ProviderItem";
import { getTrackProperties } from "./utils/getTrackProperties";

type Props = {
  account: Account;
  onClose?: () => void;
  source?: string;
  providers: EthStakingProvider[];
};

export type StakeOnClickProps = {
  provider: EthStakingProvider;
  manifest: LiveAppManifest;
};
export function EthStakingModalBody({ source, onClose, account, providers }: Props) {
  const history = useHistory();

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

  return (
    <Flex flexDirection="column" rowGap={2} width="100%">
      {providers.map(x => (
        <Flex key={x.id} flexDirection="column">
          <ProviderItem provider={x} stakeOnClick={stakeOnClick} />
        </Flex>
      ))}
    </Flex>
  );
}
