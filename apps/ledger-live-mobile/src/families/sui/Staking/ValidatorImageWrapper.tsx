import React from "react";
import ValidatorImage from "../shared/ValidatorImage";
import type { MappedStake } from "@ledgerhq/live-common/families/sui/types";

type Props = {
  size: number;
  stakingPosition?: MappedStake;
};

const ValidatorImageWrapper = ({ size, stakingPosition }: Props) => (
  <ValidatorImage
    name={stakingPosition?.validator.name ?? ""}
    url={stakingPosition?.validator.imageUrl}
    size={size}
  />
);

export default ValidatorImageWrapper;
