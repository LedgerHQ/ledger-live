import React from "react";
import { Image } from "react-native";
import type { Baker } from "@ledgerhq/live-common/families/tezos/types";
import Circle from "~/components/Circle";

type Props = {
  size?: number;
  baker?: Baker | null | undefined;
};

const BakerImage = ({ baker, size = 64 }: Props) => (
  <Circle crop size={size}>
    <Image
      style={{
        width: size,
        height: size,
      }}
      source={
        baker
          ? {
              uri: baker.logoURL,
            }
          : require("./custom.png")
      }
    />
  </Circle>
);

export default BakerImage;
