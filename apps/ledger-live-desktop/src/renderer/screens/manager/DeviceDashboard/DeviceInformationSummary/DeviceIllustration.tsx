import styled from "styled-components";
import { DeviceModel } from "@ledgerhq/devices";
import nanoS from "~/renderer/images/devices/nanoS.png";
import nanoSDark from "~/renderer/images/devices/nanoS_dark.png";
import nanoSP from "~/renderer/images/devices/nanoSP.png";
import nanoSPDark from "~/renderer/images/devices/nanoSP_dark.png";
import nanoX from "~/renderer/images/devices/nanoX.png";
import nanoXDark from "~/renderer/images/devices/nanoX_dark.png";
import stax from "~/renderer/images/devices/stax.png";
import staxDark from "~/renderer/images/devices/stax_dark.png";
import europa from "~/renderer/images/devices/europa.png";
import europaDark from "~/renderer/images/devices/europa_dark.png";
import blue from "~/renderer/images/devices/blue.png";

const illustrations = {
  nanoS: {
    light: nanoS,
    dark: nanoSDark,
  },
  nanoSP: {
    light: nanoSP,
    dark: nanoSPDark,
  },
  nanoX: {
    light: nanoX,
    dark: nanoXDark,
  },
  stax: {
    light: stax,
    dark: staxDark,
  },
  europa: {
    light: europa,
    dark: europaDark,
  },
  blue: {
    light: blue,
    dark: blue,
  },
};

export const DeviceIllustration = styled.img.attrs<{
  deviceModel: DeviceModel;
}>(p => ({
  src: illustrations[
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (process.env.OVERRIDE_MODEL_ID || p.deviceModel.id) as keyof typeof illustrations
  ][p.theme.colors.palette.type || "light"],
}))<{
  deviceModel: DeviceModel;
}>`
  position: absolute;
  top: 0;
  left: 50%;
  max-height: 100%;
  filter: drop-shadow(0px 5px 7px ${p => p.theme.colors.palette.text.shade10});
  transform: translateX(-50%);
  user-select: none;
  pointer-events: none;
`;
