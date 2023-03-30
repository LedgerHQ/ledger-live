import { getAccountName, getMainAccount } from "@ledgerhq/live-common/account/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AccountLike } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { useCallback, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { urls } from "~/config/urls";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import Ellipsis from "~/renderer/components/Ellipsis";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import LinkShowQRCode from "~/renderer/components/LinkShowQRCode";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import QRCode from "~/renderer/components/QRCode";
import ReadOnlyAddressField from "~/renderer/components/ReadOnlyAddressField";
import Receive2NoDevice from "~/renderer/components/Receive2NoDevice";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import Text from "~/renderer/components/Text";
import useTheme from "~/renderer/hooks/useTheme";
import { openURL } from "~/renderer/linking";
import { StepProps } from "~/renderer/modals/Receive/Body";

export const LOCAL_STORAGE_KEY_PREFIX = "receive_staking_";
const Separator = styled.div`
  border-top: 1px solid #99999933;
  margin: 50px 0;
`;
const Separator2 = styled.div`
  border-top: 1px solid #99999933;
  margin-top: 50px;
`;
const QRCodeWrapper = styled.div`
  border: 24px solid white;
  height: 208px;
  width: 208px;
  background: white;
`;
const AlertBoxContainer = styled.div`
  margin-top: 20px;
`;
const Receive1ShareAddress = ({
  account,
  name,
  address,
  showQRCodeModal,
}: {
  account: AccountLike;
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
          color="palette.text.shade100"
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
const Receive2Device = ({
  onVerify,
  name,
  device,
}: {
  onVerify: () => void;
  name: string;
  device: any;
}) => {
  const type = useTheme("colors.palette.type");
  return (
    <>
      <Box horizontal alignItems="center" flow={2}>
        <Text
          style={{
            flexShrink: "unset",
          }}
          ff="Inter|SemiBold"
          color="palette.text.shade100"
          fontSize={4}
        >
          <span
            style={{
              marginRight: 10,
            }}
          >
            <Trans
              i18nKey="currentAddress.messageIfUnverified"
              value={{
                name,
              }}
            />
          </span>
          <LinkWithExternalIcon
            style={{
              display: "inline-flex",
            }}
            onClick={() => openURL(urls.recipientAddressInfo)}
            label={<Trans i18nKey="common.learnMore" />}
          />
        </Text>
      </Box>

      {renderVerifyUnwrapped({
        modelId: device.modelId,
        type,
      })}
    </>
  );
};
const StepReceiveFunds = (props: StepProps) => {
  const {
    isAddressVerified,
    account,
    parentAccount,
    device,
    onChangeAddressVerified,
    transitionTo,
    onResetSkip,
    verifyAddressError,
    token,
    onClose,
    eventType,
    currencyName,
  } = props;
  const history = useHistory();
  const receiveStakingFlowConfig = useFeature("receiveStakingFlowConfigDesktop");
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  invariant(account && mainAccount, "No account given");
  const name = token ? token.name : getAccountName(account);
  const initialDevice = useRef(device);
  const address = mainAccount.freshAddress;
  const [modalVisible, setModalVisible] = useState(false);
  const hideQRCodeModal = useCallback(() => setModalVisible(false), [setModalVisible]);
  const showQRCodeModal = useCallback(() => setModalVisible(true), [setModalVisible]);
  const onVerify = useCallback(() => {
    // if device has changed since the beginning, we need to re-entry device
    if (device !== initialDevice.current || !isAddressVerified) {
      transitionTo("device");
    }
    onChangeAddressVerified(null);
    onResetSkip();
  }, [device, onChangeAddressVerified, onResetSkip, transitionTo, isAddressVerified]);
  const onFinishReceiveFlow = useCallback(() => {
    const id = account?.currency?.id;
    const dismissModal = global.localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`) === "true";
    if (
      !dismissModal &&
      receiveStakingFlowConfig?.enabled &&
      receiveStakingFlowConfig?.params[id]?.enabled
    ) {
      track("button_clicked", {
        button: "continue",
        page: window.location.hash
          .split("/")
          .filter(e => e !== "#")
          .join("/"),
        currency: currencyName,
        modal: "receive",
        account,
      });
      transitionTo("stakingFlow");
      history.push({
        pathname: `/account/${account.id}`,
      });
    } else {
      onClose();
    }
  }, [
    account,
    currencyName,
    history,
    onClose,
    receiveStakingFlowConfig?.enabled,
    receiveStakingFlowConfig?.params,
    transitionTo,
  ]);
  return (
    <>
      <Box px={2}>
        <TrackPage
          category={`Receive Flow${eventType ? ` (${eventType})` : ""}`}
          name="Step 3"
          currencyName={currencyName}
        />
        {verifyAddressError ? (
          <ErrorDisplay error={verifyAddressError} onRetry={onVerify} />
        ) : isAddressVerified === true ? (
          // Address was confirmed on device! we display a success screen!

          <Box alignItems="center">
            <SuccessDisplay
              title={<Trans i18nKey="receive.successTitle" />}
              description={
                <LinkWithExternalIcon
                  style={{
                    display: "inline-flex",
                    marginLeft: "10px",
                  }}
                  onClick={() => openURL(urls.recipientAddressInfo)}
                  label={<Trans i18nKey="common.learnMore" />}
                />
              }
            >
              <Box flow={4} pt={4} horizontal justifyContent="center">
                <Button event="Page Receive Step 3 re-verify" outlineGrey onClick={onVerify}>
                  <Trans i18nKey="common.reverify" />
                </Button>
                <Button data-test-id="modal-continue-button" primary onClick={onFinishReceiveFlow}>
                  <Trans i18nKey="common.done" />
                </Button>
              </Box>
            </SuccessDisplay>
          </Box>
        ) : isAddressVerified === false ? (
          // User explicitly bypass device verification (no device)
          <>
            <Receive1ShareAddress
              account={mainAccount}
              name={name}
              address={address}
              showQRCodeModal={showQRCodeModal}
            />
            {mainAccount.operationsCount === 0 ? (
              <AlertBoxContainer>
                <Alert type="warning" learnMoreUrl={urls.errors.TronSendTrc20ToNewAccountForbidden}>
                  <Trans i18nKey="tron.receive.newAddressTRC20" />
                </Alert>
              </AlertBoxContainer>
            ) : null}
            <Alert type="security" learnMoreUrl={urls.recipientAddressInfo} mt={4}>
              <Trans
                i18nKey="currentAddress.messageIfSkipped"
                values={{
                  name,
                }}
              />
            </Alert>
            <Separator2 />
            <Receive2NoDevice
              onVerify={onVerify}
              onContinue={() => onChangeAddressVerified(true)}
              name={name}
            />
          </>
        ) : device ? (
          // verification with device
          <>
            <Receive1ShareAddress
              account={mainAccount}
              name={name}
              address={address}
              showQRCodeModal={showQRCodeModal}
            />
            {mainAccount.operationsCount === 0 ? (
              <AlertBoxContainer>
                <Alert type="warning" learnMoreUrl={urls.errors.TronSendTrc20ToNewAccountForbidden}>
                  <Trans i18nKey="tron.receive.newAddressTRC20" />
                </Alert>
              </AlertBoxContainer>
            ) : null}
            <Separator />
            <Receive2Device device={device} onVerify={onVerify} name={name} />
          </>
        ) : null // should not happen
        }
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
