import { Account } from "@ledgerhq/types-live";
import React from "react";
import { Trans } from "react-i18next";

import Modal, { ModalBody } from "~/renderer/components/Modal";

import { EthStakingModalBody } from "./EthStakingModalBody";
import { Providers } from "./types";
import TrackPage from "~/renderer/analytics/TrackPage";

type Props = {
  name: string;
  account: Account;
  checkbox?: boolean;
  singleProviderRedirectMode?: boolean;
  source?: string;
  providers: Providers;
};

export function EthStakingModal(props: Props) {
  return (
    <Modal
      name={props.name}
      centered
      width={500}
      render={({ onClose }) => (
        <>
          <TrackPage category="ETH Stake Modal" name="Main Modal" />
          <ModalBody
            title={<Trans i18nKey="ethereum.stake.title" />}
            onClose={onClose}
            render={() => <EthStakingModalBody {...props} onClose={onClose} />}
          />
        </>
      )}
    />
  );
}
