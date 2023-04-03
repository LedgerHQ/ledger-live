import React from "react";
import { Trans } from "react-i18next";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Body from "./Body";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Flex } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";
type Props = {
  name: string;
  account: Account;
  checkbox?: boolean;
  singleProviderRedirectMode?: boolean;
  source?: string;
};
const DelegationModal = ({
  name,
  account,
  checkbox,
  singleProviderRedirectMode,
  source,
}: Props) => {
  return (
    <Modal
      name={name}
      centered
      title={<Trans i18nKey="ethereum.stake.title" />}
      width={500}
      render={({ onClose }) => (
        <ModalBody
          title={<Trans i18nKey="ethereum.stake.title" />}
          onClose={onClose}
          render={() => (
            <Flex justifyContent={"center"}>
              <TrackPage category="ETH Stake Modal" name="Main Modal" />
              <Body
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
};
export default DelegationModal;
