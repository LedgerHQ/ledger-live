import React, { useMemo, useCallback, useEffect, useState } from "react";
import invariant from "invariant";
import { firstValueFrom } from "rxjs";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { DisconnectedDevice } from "@ledgerhq/errors";
import DeviceAction from "~/renderer/components/DeviceAction";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import useTheme from "~/renderer/hooks/useTheme";
import Box from "~/renderer/components/Box";
import { renderVerifyUnwrapped, Title } from "~/renderer/components/DeviceAction/rendering";
import TrackPage from "~/renderer/analytics/TrackPage";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import type { StepProps } from "../types";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { Container } from "../shared/Container";

export default function StepDevice(props: StepProps) {
  const { account } = props;
  const [deviceIsReady, setDeviceIsReady] = useState(false);
  const mainAccount = account ? getMainAccount(account) : null;
  const action = useConnectAppAction();

  const request = useMemo(
    () => ({
      account: mainAccount || undefined,
    }),
    [mainAccount],
  );

  return deviceIsReady ? (
    <StepExport {...props} />
  ) : (
    <DeviceAction
      action={action}
      request={request}
      onResult={() => setDeviceIsReady(true)}
      analyticsPropertyFlow="exportUfvk"
      location={HOOKS_TRACKING_LOCATIONS.receiveModal}
    />
  );
}

const StepExport = (props: StepProps) => {
  const { account, device, transitionTo, onUfvkChanged, ufvk, ufvkExportError } = props;

  const [ufvkRequestSent, setUfvkRequestSent] = useState(false);

  const mainAccount = account ? getMainAccount(account) : null;
  invariant(account && mainAccount, "No account given");

  const requestUfvkFromDevice = useCallback(async () => {
    try {
      if (!device) {
        throw new DisconnectedDevice();
      }
      await firstValueFrom(
        getAccountBridge(mainAccount).receive(mainAccount, {
          deviceId: device.deviceId,
          verify: true,
        }),
      ).finally(() => setUfvkRequestSent(true));
      onUfvkChanged(
        "uview16j9eaejmtpsj9q69tyhnh6spml5nhkjhn2vmxl9adjmewl4eyjksnewn9ucca7qdq86cs3njl2gmu7mkre63uqjxf0vs9fvwy2e7q929zvspkst9y80f7rjvvsugj8razy2fsxljkcjk9h9xe6a8cavuw7mny6pxta782z8d2csyxn6dxr6fm2t9u4qwtyj4mck53fmmtzpgjuaa88qakkt65xslacr8m3xzv68plnnqks24jwgjt3g8hx0dstg0f8c2znh3gz8mrvzrwk5a7xpu93j5tatljc5r58chq5tjrfhtxjvykl9772das3n5s4ychzjzewdjvlkxup87unzt8gg02gta20ak0dkrjcs3j0wln4xjtnclmwtv0wd78hxz3c9dkjt0272s74dqmgn0rrm8yuqmn27uphgw5e0acn3634a6sfp3my4sywsgnguucu05gd9uem6wr0tqvvs28rpy53uhkrzq4klt243hn3xw0g8aflr7",
      );
      transitionTo("confirmation");
    } catch (error) {
      onUfvkChanged("", error as Error);
    }
  }, [device, mainAccount, transitionTo, onUfvkChanged]);

  useEffect(() => {
    if (!ufvk && !ufvkExportError && !ufvkRequestSent) {
      requestUfvkFromDevice();
    }
  }, [ufvk, ufvkExportError, ufvkRequestSent, requestUfvkFromDevice]);

  if (ufvkExportError) {
    return (
      <Container>
        <TrackPage
          category="Export ZCash key"
          name="Step Confirmation Error"
          flow="exportUfvk"
          currency="zcash"
        />
        <ErrorDisplay error={ufvkExportError} withExportLogs />
      </Container>
    );
  }

  return (
    <Box px={2}>
      <TrackPage
        category="Export ZCash key"
        name="Step device"
        flow="exportUfvk"
        currency="zcash"
      />
      {
        device ? <ExportUfvkOnDevice device={device} /> : null // should not happen
      }
    </Box>
  );
};

const ExportUfvkOnDevice = ({ device }: { device: Device }) => {
  const type = useTheme().theme;

  return (
    <>
      {renderVerifyUnwrapped({
        modelId: device.modelId,
        type,
      })}
      <Title>
        <Trans i18nKey="zcash.shielded.flows.export.steps.device.text" />
      </Title>
    </>
  );
};

export function StepDeviceFooter({ onRetry, error, closeModal }: Readonly<StepProps>) {
  if (error) {
    return (
      <Box horizontal alignItems="right">
        <Button data-testid="modal-close-button" ml={2} onClick={closeModal}>
          <Trans i18nKey="common.close" />
        </Button>
        <RetryButton primary ml={2} onClick={onRetry} />
      </Box>
    );
  }
  return null;
}
