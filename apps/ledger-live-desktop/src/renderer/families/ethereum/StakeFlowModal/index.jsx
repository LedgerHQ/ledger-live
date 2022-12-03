// @flow

import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Body from "./Body";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Flex } from "@ledgerhq/react-ui";
import type { Account } from "@ledgerhq/types-live";

type Props = { name: string, account: Account, checkbox?: boolean, source?: string };
export default class DelegationModal extends PureComponent<Props> {
  render() {
    const { name, account, checkbox, source } = this.props;
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
                <Body onClose={onClose} account={account} checkbox={checkbox} source={source} />
              </Flex>
            )}
          />
        )}
      />
    );
  }
}
