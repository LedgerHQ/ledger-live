import React, { useState, useEffect, useMemo } from "react";
import { reduce } from "rxjs/operators";
import TrackPage from "~/renderer/analytics/TrackPage";
import DeviceAction from "~/renderer/components/DeviceAction";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import {
  type AccountDescriptor,
  scanDescriptors,
} from "@ledgerhq/live-common/families/bitcoin/logic";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import BigSpinner from "~/renderer/components/BigSpinner";
import Text from "~/renderer/components/Text";
import OpenUserDataDirectoryBtn from "~/renderer/components/OpenUserDataDirectoryBtn";
import { Trans } from "react-i18next";
import { FullNodeSteps, ConnectionStatus, CheckWrapper, connectionStatus } from "..";
import IconCheck from "~/renderer/icons/Check";
import { Device } from "@ledgerhq/types-devices";
import { ScannedDescriptor } from "../../types";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";

const StepConnectDevice = ({
  setScannedDescriptors,
  numberOfAccountsToScan,
  setError,
}: {
  setScannedDescriptors: (a: { descriptor: AccountDescriptor }[]) => void;
  numberOfAccountsToScan: number;
  setError: (a: Error) => void;
}) => {
  const currency = getCryptoCurrencyById("bitcoin");
  const [device, setDevice] = useState<Device>(null);
  const [scanStatus, setScanStatus] = useState<ConnectionStatus>(connectionStatus.IDLE);
  const request = useMemo(() => ({ currency }), [currency]);
  const action = useConnectAppAction();

  useEffect(() => {
    if (device) {
      const sub = scanDescriptors(
        device.deviceId,
        getCryptoCurrencyById("bitcoin"),
        numberOfAccountsToScan,
      )
        // I don't know what you want.
        .pipe<ScannedDescriptor[]>(
          reduce(
            (acc: ScannedDescriptor[], item) =>
              acc.concat({
                descriptor: item,
              }),
            [],
          ),
        )
        .subscribe({
          next: descriptors => {
            setScanStatus(connectionStatus.SUCCESS);
            setScannedDescriptors(descriptors);
          },
          error: setError,
        });
      return () => sub.unsubscribe();
    }
  }, [device, numberOfAccountsToScan, setError, setScannedDescriptors]);
  return (
    <>
      <TrackPage category="FullNode" name="Step3" currencyName={currency.name} />
      {scanStatus === connectionStatus.IDLE ? (
        <DeviceAction
          action={action}
          request={request}
          onResult={({ device }) => {
            setDevice(device);
            setScanStatus(connectionStatus.PENDING);
          }}
        />
      ) : scanStatus === connectionStatus.SUCCESS ? (
        <Box alignItems="center">
          <CheckWrapper size={50}>
            <IconCheck size={20} />
          </CheckWrapper>
          <Text ff="Inter|SemiBold" textAlign={"center"} mt={32} fontSize={6} color="neutral.c100">
            <Trans i18nKey="fullNode.modal.steps.device.connectionSteps.success.header" />
          </Text>
          <Text ff="Inter|Regular" mt={2} textAlign={"center"} fontSize={3} color="neutral.c70">
            <Trans i18nKey="fullNode.modal.steps.device.connectionSteps.success.description" />
          </Text>
        </Box>
      ) : (
        <Box alignItems="center">
          <BigSpinner size={50} />
          <Text ff="Inter|SemiBold" textAlign={"center"} mt={32} fontSize={6} color="neutral.c100">
            <Trans i18nKey="fullNode.modal.steps.device.connectionSteps.pending.header" />
          </Text>
          <Text ff="Inter|Regular" mt={2} textAlign={"center"} fontSize={3} color="neutral.c70">
            <Trans i18nKey="fullNode.modal.steps.device.connectionSteps.pending.description" />
          </Text>
        </Box>
      )}
    </>
  );
};
export const StepDeviceFooter = ({
  onClose,
  onStepChange,
  scannedDescriptors,
}: {
  onClose: () => void;
  onStepChange: (a: FullNodeSteps) => void;
  scannedDescriptors?: ScannedDescriptor[];
}) => (
  <Box horizontal alignItems={"flex-end"}>
    {scannedDescriptors ? (
      <OpenUserDataDirectoryBtn outlineGrey mr={2}>
        <Trans i18nKey="fullNode.modal.steps.device.connectionSteps.success.cta" />
      </OpenUserDataDirectoryBtn>
    ) : (
      <Button onClick={onClose} mr={3}>
        <Trans i18nKey="common.cancel" />
      </Button>
    )}
    <Button primary onClick={() => onStepChange("satstack")} disabled={!scannedDescriptors}>
      <Trans i18nKey="common.continue" />
    </Button>
  </Box>
);
export default StepConnectDevice;
