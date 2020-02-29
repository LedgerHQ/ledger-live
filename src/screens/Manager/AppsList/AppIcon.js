// @flow
import React, { useMemo } from "react";
import { Image } from "react-native";
import manager from "@ledgerhq/live-common/lib/manager";

type Props = {
  icon: string,
  size: number,
};

export default ({ size = 38, icon }: Props) => {
  const uri = useMemo(() => manager.getIconUrl(icon), [icon]);
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      fadeDuration={0}
    />
  );
};
