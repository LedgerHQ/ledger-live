import { Flex } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { EthStakingModalBody } from "./EthStakingModalBody";

type Props = {
  name: string;
  account: Account;
  checkbox?: boolean;
  singleProviderRedirectMode?: boolean;
  source?: string;
};

export function EthStakingModal({
  name,
  account,
  checkbox,
  singleProviderRedirectMode,
  source,
}: Props) {
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
              <EthStakingModalBody
                onClose={onClose}
                account={account}
                checkbox={checkbox}
                singleProviderRedirectMode={singleProviderRedirectMode}
                source={source}
              />
            </Flex>
          )}
        />
      )}
    />
  );
}
