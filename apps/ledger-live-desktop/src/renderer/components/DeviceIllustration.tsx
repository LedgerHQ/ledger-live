import React from "react";
import styled, { DefaultTheme, StyledComponent } from "styled-components";
import stax from "~/renderer/images/stax.svg";
import europa from "~/renderer/images/europa.svg";
import nanoX from "~/renderer/images/nanoX.svg";
import nanoS from "~/renderer/images/nanoS.svg";
import nanoSP from "~/renderer/images/nanoSP.svg";
import { registerAssets } from "~/renderer/components/Onboarding/preloadAssets";
import { DeviceModelId } from "@ledgerhq/devices";

registerAssets([nanoX, nanoS, nanoSP, stax, europa]);

const NanoS = styled.div`
  // prettier-ignore
  background: url('${nanoS}') no-repeat center;
`;

const NanoSP = styled.div`
  // prettier-ignore
  background: url('${nanoSP}') no-repeat center;
`;

const NanoX = styled.div`
  // prettier-ignore
  background: url('${nanoX}') no-repeat center;
`;

const Stax = styled.div`
  // prettier-ignore
  background: url('${stax}') no-repeat center;
`;

const Europa = styled.div`
  // prettier-ignore
  background: url('${europa}') no-repeat center;
`;

type Illustration = {
  Illustration: StyledComponent<"div", DefaultTheme, Record<string, unknown>, never>;
  width: number;
  height: number;
};

const illustrations: { [key in DeviceModelId]: Illustration } = {
  nanoS: {
    Illustration: NanoS,
    width: 200,
    height: 200,
  },
  nanoSP: {
    Illustration: NanoSP,
    width: 200,
    height: 200,
  },
  nanoX: {
    Illustration: NanoX,
    width: 200,
    height: 200,
  },
  stax: {
    Illustration: Stax,
    width: 200,
    height: 200,
  },
  europa: {
    Illustration: Europa,
    width: 200,
    height: 200,
  },
  blue: {
    Illustration: NanoS,
    width: 200,
    height: 200,
  },
};

type DeviceIllustrationProps = {
  deviceId: DeviceModelId;
  size?: number;
  height?: number;
  width?: number;
};

const DeviceIllustration = ({
  deviceId = DeviceModelId.nanoS,
  size,
  height,
  width,
  ...props
}: DeviceIllustrationProps) => {
  const illus = illustrations[deviceId];
  if (!illus) return null;
  const { Illustration, width: iW, height: iH } = illus;
  const sH = `${height || size || iH}px`;
  const sW = `${width || (size ? (size / iH) * iW : iW)}px`;
  return (
    <Illustration
      style={{
        height: sH,
        width: sW,
        backgroundSize: "contain",
      }}
      {...props}
    />
  );
};

export default DeviceIllustration;
