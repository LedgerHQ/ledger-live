import React, { useCallback, useEffect, useState } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { firstValueFrom } from "rxjs";
import { Account } from "@ledgerhq/types-live";
import { ConcordiumTrustedMetadataServiceError, DisconnectedDevice } from "@ledgerhq/errors";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getEnv } from "@ledgerhq/live-env";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import useTheme from "~/renderer/hooks/useTheme";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
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
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import { StepProps } from "~/renderer/modals/Receive/Body";
import TrackPage from "~/renderer/analytics/TrackPage";

const Separator = styled.div`
  border-top: 1px solid ${p => p.theme.colors.neutral.c30};
  margin: 50px 0;
`;
const QRCodeWrapper = styled.div`
  border: 24px solid ${p => p.theme.colors.neutral.c00};
  height: 208px;
  width: 208px;
  background: ${p => p.theme.colors.neutral.c00};
`;

const ShareAddress = ({
  account,
  name,
  address,
  showQRCodeModal,
}: {
  account: Account;
  name: string;
  address: string;
  showQRCodeModal: () => void;
}) => (
  <>
    <Box horizontal alignItems="center" flow={2} mb={4}>
      <Text style={{ flex: 1 }} ff="Inter|SemiBold" color="neutral.c100" fontSize={4}>
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

const VerifyOnDevice = ({ name, device }: { name: string; device: Device }) => {
  const type = useTheme().theme;
  return (
    <>
      <Box horizontal alignItems="center" flow={2}>
        <Text style={{ flexShrink: "unset" }} ff="Inter|SemiBold" color="neutral.c100" fontSize={4}>
          <span style={{ marginRight: 10 }}>
            <Trans i18nKey="currentAddress.messageIfUnverified" value={{ name }} />
          </span>
          <LinkWithExternalIcon
            style={{ display: "inline-flex" }}
            onClick={() => openURL(urls.recipientAddressInfo)}
            label={<Trans i18nKey="common.learnMore" />}
          />
        </Text>
      </Box>
      {renderVerifyUnwrapped({ modelId: device.modelId, type })}
    </>
  );
};

const StepReceiveFunds = ({
  isAddressVerified,
  verifyAddressError,
  account,
  parentAccount,
  device,
  onChangeAddressVerified,
  onResetSkip,
  transitionTo,
  onClose,
  eventType,
  currencyName,
  token,
}: StepProps) => {
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  invariant(account && mainAccount, "No account given");

  const maybeAccountName = useMaybeAccountName(account);
  const name = token ? token.name : maybeAccountName || getDefaultAccountName(account);
  const address = mainAccount.freshAddress;

  const explorerUrl = getAddressExplorer(getDefaultExplorerView(mainAccount.currency), address);

  const [modalVisible, setModalVisible] = useState(false);
  const hideQRCodeModal = useCallback(() => setModalVisible(false), []);
  const showQRCodeModal = useCallback(() => setModalVisible(true), []);

  const isVerifyEnabled = useFeature("concordiumVerifyAddress")?.enabled === true;

  const confirmAddress = useCallback(async () => {
    if (getEnv("MOCK")) {
      setTimeout(() => {
        onChangeAddressVerified(true);
        setModalVisible(false);
      }, 3000);
      return;
    }
    try {
      if (!device) throw new DisconnectedDevice();
      await firstValueFrom(
        (await getAccountBridge(mainAccount)).receive(mainAccount, {
          deviceId: device.deviceId,
          verify: true,
        }),
      );
      onChangeAddressVerified(true);
    } catch (err) {
      // Trusted-metadata-service failures (network/5xx) are transient — route
      // to the fallback UI instead of the hard error screen.
      if (err instanceof ConcordiumTrustedMetadataServiceError) {
        onChangeAddressVerified(false, null);
      } else if (err instanceof Error) {
        onChangeAddressVerified(false, err);
      } else {
        onChangeAddressVerified(false, new Error(String(err)));
      }
    } finally {
      setModalVisible(false);
    }
  }, [device, mainAccount, onChangeAddressVerified]);

  useEffect(() => {
    if (isAddressVerified !== null) return;
    if (isVerifyEnabled) {
      confirmAddress();
    } else {
      onChangeAddressVerified(false, null);
    }
  }, [isVerifyEnabled, isAddressVerified, confirmAddress, onChangeAddressVerified]);

  const onVerify = useCallback(() => {
    onChangeAddressVerified(null);
    onResetSkip();
    transitionTo("device");
  }, [onChangeAddressVerified, onResetSkip, transitionTo]);

  const effectiveIsAddressVerified = isVerifyEnabled ? isAddressVerified : false;

  const category = eventType ? `Receive Flow (${eventType})` : "Receive Flow";

  const renderContent = () => {
    if (verifyAddressError) {
      return <ErrorDisplay error={verifyAddressError} onRetry={onVerify} />;
    }

    if (effectiveIsAddressVerified) {
      return (
        <Box alignItems="center">
          <SuccessDisplay
            title={<Trans i18nKey="receive.successTitle" />}
            description={
              <LinkWithExternalIcon
                style={{ display: "inline-flex", marginLeft: "10px" }}
                onClick={() => openURL(urls.recipientAddressInfo)}
                label={<Trans i18nKey="common.learnMore" />}
              />
            }
          >
            <Box flow={4} pt={4} horizontal justifyContent="center">
              <Button event="Page Receive Step 3 re-verify" outlineGrey onClick={onVerify}>
                <Trans i18nKey="common.reverify" />
              </Button>
              <Button data-testid="modal-continue-button" primary onClick={onClose}>
                <Trans i18nKey="common.done" />
              </Button>
            </Box>
          </SuccessDisplay>
        </Box>
      );
    }

    if (effectiveIsAddressVerified === false) {
      return (
        <>
          <ShareAddress
            account={mainAccount}
            name={name}
            address={address}
            showQRCodeModal={showQRCodeModal}
          />
          <Alert type="security" mt={4}>
            <Trans i18nKey="families.concordium.receive.messageIfSkipped" />{" "}
            <LinkWithExternalIcon
              style={{ display: "inline-flex" }}
              onClick={() => explorerUrl && openURL(explorerUrl)}
              label={<Trans i18nKey="families.concordium.receive.verifyLink" />}
            />
          </Alert>
          <Box horizontal justifyContent="flex-end" pt={4}>
            <Button data-testid="modal-continue-button" primary onClick={onClose}>
              <Trans i18nKey={isVerifyEnabled ? "common.continue" : "common.done"} />
            </Button>
          </Box>
        </>
      );
    }

    if (device) {
      return (
        <>
          <ShareAddress
            account={mainAccount}
            name={name}
            address={address}
            showQRCodeModal={showQRCodeModal}
          />
          <Separator />
          <VerifyOnDevice device={device} name={name} />
        </>
      );
    }

    return null;
  };

  return (
    <>
      <TrackPage category={category} name="Step 3" currencyName={currencyName} />

      <Box px={2}>{renderContent()}</Box>

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
