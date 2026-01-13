import React, { useRef, useCallback, useState } from "react";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { CantonAccount } from "@ledgerhq/coin-canton/types";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import useTheme from "~/renderer/hooks/useTheme";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
import ReadOnlyAddressField from "~/renderer/components/ReadOnlyAddressField";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import LinkShowQRCode from "~/renderer/components/LinkShowQRCode";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import Receive2NoDevice from "~/renderer/components/Receive2NoDevice";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import { Account } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import Alert from "~/renderer/components/Alert";
import QRCode from "~/renderer/components/QRCode";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
import { FeatureToggle, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { LOCAL_STORAGE_KEY_PREFIX } from "~/renderer/modals/Receive/steps/StepReceiveStakingFlow";
import { StepProps } from "~/renderer/modals/Receive/Body";
import { useAccountName } from "~/renderer/reducers/wallet";
import { UTXOAddressAlert } from "~/renderer/components/UTXOAddressAlert";
import { isUTXOCompliant } from "@ledgerhq/live-common/currencies/helpers";
import MemoTagInfo from "LLD/features/MemoTag/components/MemoTagInfo";
import { MEMO_TAG_COINS } from "LLD/features/MemoTag/constants";
import { useSelector } from "LLD/hooks/redux";
import { onboardingReceiveFlowSelector } from "~/renderer/reducers/onboarding";

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
  const { currency } = account;

  const isUTXOCompliantCurrency = isUTXOCompliant(currency.family);
  const shouldRenderMemoTagInfo = currency.family && MEMO_TAG_COINS.includes(currency.family);

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

      {isUTXOCompliantCurrency && (
        <Box mt={3}>
          <UTXOAddressAlert />
        </Box>
      )}
      <FeatureToggle featureId="lldMemoTag">
        {shouldRenderMemoTagInfo && (
          <Box mt={3}>
            <MemoTagInfo />
          </Box>
        )}
      </FeatureToggle>
    </>
  );
};
const Receive2Device = ({ name, device }: { name: string; device: Device }) => {
  const type = useTheme().theme;
  return (
    <>
      <Box horizontal alignItems="center" flow={2}>
        <Text
          style={{
            flexShrink: "unset",
          }}
          ff="Inter|SemiBold"
          color="neutral.c100"
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
const StepReceiveFunds = ({
  isAddressVerified,
  account,
  parentAccount,
  device,
  onClose,
  onChangeAddressVerified,
  transitionTo,
  onResetSkip,
  verifyAddressError,
  eventType,
  currencyName,
  receiveTokenMode,
  isFromPostOnboardingEntryPoint,
}: StepProps) => {
  const mainAccount = account
    ? getMainAccount<CantonAccount>(account as CantonAccount, parentAccount as CantonAccount)
    : null;
  invariant(account && mainAccount?.xpub, "No account given");
  const name = useAccountName(account);
  const initialDevice = useRef(device);
  const isOnboardingReceiveFlow = useSelector(onboardingReceiveFlowSelector);
  const address = mainAccount.xpub;
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
  }, [device, isAddressVerified, onChangeAddressVerified, onResetSkip, transitionTo]);

  const receiveStakingFlowConfig = useFeature("receiveStakingFlowConfigDesktop");
  const receivedCurrencyId: string | undefined =
    account && account.type !== "TokenAccount" ? account?.currency?.id : undefined;
  const isStakingEnabledForAccount =
    !!receivedCurrencyId &&
    receiveStakingFlowConfig?.enabled &&
    receiveStakingFlowConfig?.params?.[receivedCurrencyId]?.enabled;
  const onFinishReceiveFlow = useCallback(() => {
    const dismissModal =
      global.localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${receivedCurrencyId}`) === "true";
    if (
      !dismissModal &&
      !receiveTokenMode &&
      isStakingEnabledForAccount &&
      !isFromPostOnboardingEntryPoint &&
      !isOnboardingReceiveFlow
    ) {
      track("button_clicked2", {
        button: "continue",
        page: window.location.hash
          .split("/")
          .filter(e => e !== "#")
          .join("/"),
        currency: currencyName,
        modal: "receive",
        account: name,
      });

      transitionTo("stakingFlow");
    } else {
      onClose();
    }
  }, [
    receivedCurrencyId,
    isFromPostOnboardingEntryPoint,
    receiveTokenMode,
    isStakingEnabledForAccount,
    currencyName,
    name,
    onClose,
    transitionTo,
    isOnboardingReceiveFlow,
  ]);
  return (
    <>
      <Box px={2}>
        <TrackPage
          category={`Receive Flow${eventType ? ` (${eventType})` : ""}`}
          name="Step 3"
          currencyName={currencyName}
        />
        {
          verifyAddressError ? (
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
                  <Button data-testid="modal-continue-button" primary onClick={onFinishReceiveFlow}>
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
              {/* {CustomPostAlertReceiveFunds && <CustomPostAlertReceiveFunds {...props} />} */}
              <Alert type="security" learnMoreUrl={urls.recipientAddressInfo} mt={4}>
                <Trans
                  i18nKey="currentAddress.messageIfSkipped"
                  values={{
                    name,
                  }}
                />
              </Alert>
              <Separator2 />
              <Receive2NoDevice onVerify={onVerify} onContinue={onFinishReceiveFlow} />
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
              {/* {CustomPostAlertReceiveFunds && <CustomPostAlertReceiveFunds {...props} />} */}
              <Separator />
              <Receive2Device device={device} name={name} />
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
