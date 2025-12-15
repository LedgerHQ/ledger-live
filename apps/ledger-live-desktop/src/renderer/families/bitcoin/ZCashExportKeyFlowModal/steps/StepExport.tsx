import React, { useCallback, useEffect } from "react";
import invariant from "invariant";
import { firstValueFrom } from "rxjs";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { DisconnectedDevice } from "@ledgerhq/errors";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Trans } from "react-i18next";
import styled from "styled-components";
import useTheme from "~/renderer/hooks/useTheme";
import Box from "~/renderer/components/Box";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import { StepProps } from "../types";
import { Text as TextUI, Alert as AlertUI } from "@ledgerhq/react-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

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

const ExportUfvkOnDevice = ({ device }: { device: Device }) => {
  const type = useTheme().theme;

  return (
    <>
      <AlertUI
        type={"info"}
        containerProps={{ p: 12, borderRadius: 8 }}
        renderContent={() => (
          <TextUI
            variant="paragraphLineHeight"
            fontWeight="semiBold"
            color="neutral.c100"
            fontSize={13}
          >
            <Trans i18nKey="zcash.shielded.flows.export.steps.export.text" />
          </TextUI>
        )}
      />
      {renderVerifyUnwrapped({
        modelId: device.modelId,
        type,
      })}
    </>
  );
};

const StepExport = (props: StepProps) => {
  const { account, device, isUfvkExported, transitionTo, onUfvkExported } = props;

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
      ).then(value => {
        console.log(value);
      });

      onUfvkExported(true);
      transitionTo("confirmation");
    } catch (error) {}
  }, [device, mainAccount, transitionTo, onUfvkExported]);

  useEffect(() => {
    if (!isUfvkExported) {
      requestUfvkFromDevice();
    }
  }, [isUfvkExported, requestUfvkFromDevice]);

  return (
    <>
      <Box px={2}>
        <TrackPage category={"Export ZCash UFVK"} name="Step 3" />
        {
          device ? (
            <>
              <ExportUfvkOnDevice device={device} />
            </>
          ) : null // should not happen
        }
      </Box>
    </>
  );
};
export default StepExport;
