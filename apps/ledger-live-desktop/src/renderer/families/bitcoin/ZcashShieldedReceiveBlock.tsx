import React, { useCallback, useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Ellipsis from "~/renderer/components/Ellipsis";
import LinkShowQRCode from "~/renderer/components/LinkShowQRCode";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import QRCode from "~/renderer/components/QRCode";
import ReadOnlyAddressField from "~/renderer/components/ReadOnlyAddressField";
import Text from "~/renderer/components/Text";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "LLD/hooks/redux";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { getDefaultAccountName } from "@domain/entity-account-name";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { ZcashAccount as CoinZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getEnv } from "@shared/env";
import { useZcashBridge } from "./useZcashShieldedSync";

const AlertBoxContainer = styled.div`
  margin-top: 20px;
`;

const QRCodeWrapper = styled.div`
  border: 24px solid white;
  height: 208px;
  width: 208px;
  background: white;
`;

type ZcashShieldedVerifyProps = {
  account: CoinZcashAccount;
  shieldedAddress: string;
  device: Device | undefined | null;
  isAddressVerified: boolean | undefined | null;
  onChangeAddressVerified: (b?: boolean | null, a?: Error | null) => void;
};

// Mounts only for Zcash+shielded, so useZcashBridge is always safe to call here.
function ZcashShieldedVerify({
  account,
  shieldedAddress,
  device,
  isAddressVerified,
  onChangeAddressVerified,
}: ZcashShieldedVerifyProps) {
  const bridge = useZcashBridge(account);
  // Ref so background sync producing new account object references does not
  // cancel and re-dispatch a 0x51 call while the user is confirming on device.
  const accountRef = useRef(account);
  accountRef.current = account;

  useEffect(() => {
    if (!device || isAddressVerified !== null) return;

    let cancelled = false;

    if (getEnv("MOCK")) {
      const t = setTimeout(() => {
        if (!cancelled) onChangeAddressVerified(true);
      }, 1000);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    // A single 0x51 call covers both addresses: the device derives the
    // transparent address from account.freshAddressPath (the bridge default)
    // and shows it alongside the UA, so no second 0x40 call is needed.
    // The returned UA is compared against the persisted value to catch both
    // a wrong device and a host/device derivation divergence.
    bridge
      .getShieldedAddress(accountRef.current, { deviceId: device.deviceId, display: true })
      .then(({ address }) => {
        if (cancelled) return;
        const match = address === shieldedAddress;
        onChangeAddressVerified(match, match ? null : new Error("Address mismatch"));
      })
      .catch(err => {
        if (cancelled) return;
        // Do not log err — IPC/device errors can echo UFVK back in the message
        onChangeAddressVerified(
          false,
          err instanceof Error ? err : new Error("Verification failed"),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [bridge, shieldedAddress, device, isAddressVerified, onChangeAddressVerified]);

  return null;
}

export type ZcashShieldedReceiveBlockProps = {
  account: ZcashAccount;
  device: Device | undefined | null;
  isAddressVerified: boolean | undefined | null;
  onChangeAddressVerified: (b?: boolean | null, a?: Error | null) => void;
  closeModal: () => void;
};

export function ZcashShieldedReceiveBlock({
  account,
  device,
  isAddressVerified,
  onChangeAddressVerified,
  closeModal,
}: ZcashShieldedReceiveBlockProps) {
  const dispatch = useDispatch();
  const maybeAccountName = useMaybeAccountName(account);
  const name = maybeAccountName || getDefaultAccountName(account);

  const [privateQRVisible, setPrivateQRVisible] = useState(false);
  const showPrivateQR = useCallback(() => setPrivateQRVisible(true), []);
  const hidePrivateQR = useCallback(() => setPrivateQRVisible(false), []);

  const privateInfo = account.privateInfo as ZcashPrivateInfo | undefined;
  const shieldedAddress = privateInfo?.shieldedAddress ?? null;
  const ufvk = privateInfo?.ufvk ?? null;

  if (shieldedAddress) {
    return (
      <>
        <ZcashShieldedVerify
          account={account as unknown as CoinZcashAccount}
          shieldedAddress={shieldedAddress}
          device={device}
          isAddressVerified={isAddressVerified}
          onChangeAddressVerified={onChangeAddressVerified}
        />
        <AlertBoxContainer data-testid="receive-private-address-block">
          <Box horizontal alignItems="center" flow={2} mb={4}>
            <Text ff="Inter|SemiBold" color="neutral.c100" fontSize={4} style={{ flex: 1 }}>
              <Ellipsis>
                <Trans i18nKey="zcash.shielded.receive.privateFor">
                  {"Private address for "}
                  <strong>{name}</strong>
                </Trans>
              </Ellipsis>
            </Text>
            <LinkShowQRCode onClick={showPrivateQR} address={shieldedAddress} />
          </Box>
          <ReadOnlyAddressField address={shieldedAddress} />
          <Modal isOpened={privateQRVisible} onClose={hidePrivateQR} centered width={460}>
            <ModalBody
              onClose={hidePrivateQR}
              render={() => (
                <Box alignItems="center">
                  <QRCodeWrapper>
                    <QRCode size={160} data={shieldedAddress} />
                  </QRCodeWrapper>
                  <Box mt={6}>
                    <ReadOnlyAddressField address={shieldedAddress} />
                  </Box>
                </Box>
              )}
            />
          </Modal>
        </AlertBoxContainer>
      </>
    );
  }

  if (!ufvk) {
    return (
      <AlertBoxContainer>
        <Alert type="secondary">
          <Trans i18nKey="zcash.receive.noUfvk.description" />
        </Alert>
        <Box mt={3}>
          <Button
            primary
            onClick={() => {
              closeModal();
              dispatch(
                openModal("MODAL_ZCASH_EXPORT_KEY", {
                  account,
                  source: "receive",
                }),
              );
            }}
          >
            <Trans i18nKey="zcash.receive.noUfvk.cta" />
          </Button>
        </Box>
      </AlertBoxContainer>
    );
  }

  return null;
}
