import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getAppAndVersion from "@ledgerhq/live-common/hw/getAppAndVersion";
import { Subscription, from } from "rxjs";
import styled from "styled-components";
import {
  Wrapper,
  Title,
  SubTitle,
  renderLoading,
} from "~/renderer/components/DeviceAction/rendering";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { useHistory } from "react-router-dom";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import nanoS from "./assets/nanoS.png";
import blue from "./assets/blue.png";
import nanoX from "./assets/nanoX.png";
import nanoSP from "./assets/nanoSP.png";
import nanoSDark from "./assets/nanoS_dark.png";
import blueDark from "./assets/blue_dark.png";
import nanoXDark from "./assets/nanoX_dark.png";
import nanoSPDark from "./assets/nanoSP_dark.png";
import stax from "./assets/stax.png";

const illustrations = {
  nanoX: {
    light: nanoX,
    dark: nanoXDark,
    width: 332,
    height: 50,
  },
  nanoS: {
    light: nanoS,
    dark: nanoSDark,
    width: 290,
    height: 50,
  },
  nanoSP: {
    light: nanoSP,
    dark: nanoSPDark,
    width: 332,
    height: 50,
  },
  stax: {
    light: stax,
    dark: stax,
    width: 141,
    height: 223,
  },
  blue: {
    light: blue,
    dark: blueDark,
    width: 64,
    height: 64,
  },
};
const Illustration = styled.div<{
  modelId: string;
}>`
  // prettier-ignore
  background: url('${p =>
    illustrations[p.modelId as keyof typeof illustrations][
      p.theme.colors.palette.type || "light"
    ]}')
    no-repeat top right;
  width: ${p => illustrations[p.modelId as keyof typeof illustrations].width}px;
  height: ${p => illustrations[p.modelId as keyof typeof illustrations].height}px;
  background-size: contain;
`;
const Disconnected = ({ onTryAgain }: { onTryAgain: (a: boolean) => void }) => {
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const modelId = process.env.OVERRIDE_MODEL_ID || lastSeenDevice?.modelId || "nanoS";
  const [readyToDecide, setReadyToDecide] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const device = useSelector(getCurrentDevice);
  const history = useHistory();
  const onReopenManager = useCallback(() => {
    onTryAgain(false);
  }, [onTryAgain]);
  const onBackToPortfolio = useCallback(() => {
    history.push({
      pathname: "/",
    });
  }, [history]);
  useEffect(() => {
    setTimeout(() => {
      setReadyToDecide(true);
    }, 3000);
  }, []);
  useEffect(() => {
    let sub: Subscription;
    if (readyToDecide) {
      if (!device) {
        onTryAgain(false); // Device is disconnected
      } else {
        sub = withDevice(device.deviceId)(transport => from(getAppAndVersion(transport))).subscribe(
          {
            next: appAndVersion => {
              if (["BOLOS", "OLOS\u0000"].includes(appAndVersion?.name)) {
                onTryAgain(false); // Device is in dashboard
              } else {
                setShowSpinner(false);
              }
            },
            error: () => onTryAgain(false), // Fallback if error
          },
        );
      }
    }

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [readyToDecide, device, onTryAgain]);

  if (showSpinner) return <Wrapper>{renderLoading()}</Wrapper>;
  return (
    <Wrapper>
      <Illustration modelId={modelId} />
      <Box mt={60}>
        <Title>
          <Trans i18nKey={"manager.disconnected.title"} />
        </Title>
        <SubTitle>
          <Trans i18nKey={"manager.disconnected.subtitle"} />
        </SubTitle>
      </Box>
      <Box flex={0} mt={32}>
        <Button primary onClick={onReopenManager}>
          <Trans i18nKey={"manager.disconnected.ctaReopen"} />
        </Button>
        <Button secondary mt={3} onClick={onBackToPortfolio}>
          <Trans i18nKey={"manager.disconnected.ctaPortfolio"} />
        </Button>
      </Box>
    </Wrapper>
  );
};
export default Disconnected;
