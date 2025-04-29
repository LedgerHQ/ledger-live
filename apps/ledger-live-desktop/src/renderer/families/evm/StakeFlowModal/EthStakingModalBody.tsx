import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { appendQueryParamsToManifestURL } from "@ledgerhq/live-common/wallet-api/utils/appendQueryParamsToManifestURL";
import { Flex } from "@ledgerhq/react-ui";
import { AccountLike, EthStakingProvider } from "@ledgerhq/types-live";
import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { track } from "~/renderer/analytics/segment";
import { ProviderItem } from "./component/ProviderItem";
import { getTrackProperties } from "./utils/getTrackProperties";
import { getWalletApiIdFromAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { deriveAccountIdForManifest } from "@ledgerhq/live-common/wallet-api/utils/deriveAccountIdForManifest";

type Props = {
  account: AccountLike;
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
      const trackProperties = getTrackProperties({
        value,
        modal: source,
      });
      track("button_clicked2", {
        button: providerConfigID,
        ...trackProperties,
      });
      const customDappUrl = queryParams && appendQueryParamsToManifestURL(manifest, queryParams);

      history.push({
        pathname: value,
        ...(customDappUrl ? { customDappUrl } : {}),
        state: {
          accountId: deriveAccountIdForManifest(
            account.id,
            getWalletApiIdFromAccountId(account.id),
            manifest,
          ),
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
