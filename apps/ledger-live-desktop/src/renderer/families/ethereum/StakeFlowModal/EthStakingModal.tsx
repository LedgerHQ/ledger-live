import { Flex } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";
import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { EthStakingModalBody as EthStakingModalBodyV1 } from "./v1/EthStakingModalBody";
import { EthStakingModalBody as EthStakingModalBodyV2 } from "./v2/EthStakingModalBody";
import { ListProviders, ProvidersV1 } from "./types";
import { getV2ListProviders } from "./utils/getV2ListProviders";

type Props = {
  name: string;
  account: Account;
  checkbox?: boolean;
  singleProviderRedirectMode?: boolean;
  source?: string;
  listProviders?: ListProviders;
};

export function EthStakingModal({
  name,
  account,
  checkbox,
  singleProviderRedirectMode,
  source,
  listProviders = [],
}: Props) {
  const v2Providers = useMemo(() => getV2ListProviders(listProviders), [listProviders]);

  return (
    <Modal
      name={name}
      centered
      width={500}
      render={({ onClose }) => (
        <ModalBody
          title={<Trans i18nKey="ethereum.stake.title" />}
          onClose={onClose}
          render={() => (
            <Flex justifyContent={"center"}>
              <TrackPage category="ETH Stake Modal" name="Main Modal" />
              {v2Providers.length ? (
                <EthStakingModalBodyV2
                  onClose={onClose}
                  account={account}
                  source={source}
                  listProviders={v2Providers}
                />
              ) : (
                <EthStakingModalBodyV1
                  onClose={onClose}
                  account={account}
                  checkbox={checkbox}
                  singleProviderRedirectMode={singleProviderRedirectMode}
                  source={source}
                  // safe to assume that all providers here are v1.
                  listProviders={listProviders as ProvidersV1}
                />
              )}
            </Flex>
          )}
        />
      )}
    />
  );
}
