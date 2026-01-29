import React, { useCallback, useMemo, useState } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { Account } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
import ReadOnlyAddressField from "~/renderer/components/ReadOnlyAddressField";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
import LinkShowQRCode from "~/renderer/components/LinkShowQRCode";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import QRCode from "~/renderer/components/QRCode";
import Alert from "~/renderer/components/Alert";
import { StepProps } from "~/renderer/modals/Receive/Body";
import TrackPage from "~/renderer/analytics/TrackPage";
import { openURL } from "~/renderer/linking";

const Separator = styled.div`
  border-top: 1px solid #99999933;
  margin: 50px 0;
`;

const QRCodeWrapper = styled.div`
  border: 24px solid white;
  height: 208px;
  width: 208px;
  background: white;
`;

const Receive1ShareAddress = ({
  account,
  name,
  address,
  showQRCodeModal,
}: {
  account: Account;
  name: string;
  address: string;
  showQRCodeModal: () => void;
}) => {
  return (
    <>
      <Box horizontal alignItems="center" flow={2} mb={4}>
        <Text
          style={{
            flex: 1,
          }}
          ff="Inter|SemiBold"
          color="neutral.c100"
          fontSize={4}
        >
          {name ? (
            <Box horizontal alignItems="center" flexWrap="wrap">
              <Ellipsis>
                <Trans i18nKey="currentAddress.for">
                  {"Address for "}
                  <strong>{name}</strong>
                </Trans>
              </Ellipsis>
              <AccountTagDerivationMode account={account} />
            </Box>
          ) : (
            <Trans i18nKey="currentAddress.title" />
          )}
        </Text>
        <LinkShowQRCode onClick={showQRCodeModal} address={address} />
      </Box>
      <ReadOnlyAddressField address={address} />
    </>
  );
};

const StepReceiveFunds = ({
  parentAccount,
  account,
  token,
  onClose,
  eventType,
  currencyName,
}: StepProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const hideQRCodeModal = useCallback(() => setModalVisible(false), [setModalVisible]);
  const showQRCodeModal = useCallback(() => setModalVisible(true), [setModalVisible]);

  const mainAccount = account ? getMainAccount(account, parentAccount) : null;

  invariant(account && mainAccount, "No account given");

  const maybeAccountName = useMaybeAccountName(account);
  const name = token ? token.name : maybeAccountName || getDefaultAccountName(account);
  const address = mainAccount.freshAddress;

  const explorerUrl = useMemo(() => {
    const explorerView = getDefaultExplorerView(mainAccount.currency);
    return getAddressExplorer(explorerView, address);
  }, [mainAccount.currency, address]);

  return (
    <>
      <TrackPage
        category={`Receive Flow${eventType ? ` (${eventType})` : ""}`}
        name="Step 3"
        currencyName={currencyName}
      />

      <Box px={2}>
        <Receive1ShareAddress
          account={mainAccount}
          name={name}
          address={address}
          showQRCodeModal={showQRCodeModal}
        />

        <Separator />

        <Alert type="security">
          <Trans i18nKey="families.concordium.receive.messageIfSkipped" />{" "}
          <LinkWithExternalIcon
            style={{ display: "inline-flex" }}
            onClick={() => explorerUrl && openURL(explorerUrl)}
            label={<Trans i18nKey="families.concordium.receive.verifyLink" />}
          />
        </Alert>

        <Box
          style={{
            width: "100%",
          }}
          horizontal
          justifyContent="flex-end"
          pt={4}
        >
          <Button data-testid="modal-continue-button" primary onClick={onClose}>
            <Trans i18nKey="common.done" />
          </Button>
        </Box>
      </Box>

      <Modal isOpened={modalVisible} onClose={hideQRCodeModal} centered width={460}>
        <ModalBody
          onClose={hideQRCodeModal}
          render={() => (
            <Box alignItems="center">
              <QRCodeWrapper>
                <QRCode size={160} data={address} />
              </QRCodeWrapper>
              <Box mt={6}>
                <ReadOnlyAddressField address={address} />
              </Box>
            </Box>
          )}
        />
      </Modal>
    </>
  );
};

export default StepReceiveFunds;
