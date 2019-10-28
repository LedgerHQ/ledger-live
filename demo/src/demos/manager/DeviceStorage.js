// @flow
import React from "react";
import ReactTooltip from "react-tooltip";
import styled from "styled-components";
import type { AppsDistribution } from "@ledgerhq/live-common/lib/apps/types";

import nanoS from "./images/nanoS.png";
import nanoX from "./images/nanoX.png";
import blue from "./images/blue.png";

const illustrations = {
  nanoS,
  nanoX,
  blue
};

export const DeviceIllustration = styled.img.attrs(p => ({
  src: illustrations[p.deviceModel.id]
}))`
  max-height: 153px;
  margin-right: 56px;
  filter: drop-shadow(0px 10px 10px rgba(0, 0, 0, 0.2));
`;

export const StorageBar = ({
  distribution
}: {
  distribution: AppsDistribution
}) => (
  <StorageBarWrapper>
    <ReactTooltip effect="solid" />
    {/*
    <StorageBarItem
      data-for="tooltip"
      data-tip={JSON.stringify({
        name: "Firmware OS",
        bytes: distribution.osBytes
      })}
      ratio={0.1}
    />
    */}
    {distribution.apps.map(({ name, currency, bytes, blocks }) => {
      const color = currency ? currency.color : "black";
      return (
        <StorageBarItem
          data-for="tooltip"
          data-tip={JSON.stringify({ name, bytes })}
          key={name}
          style={{ background: color }}
          ratio={blocks / (distribution.totalBlocks - distribution.osBlocks)}
        />
      );
    })}
  </StorageBarWrapper>
);

export const StorageBarWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  border-radius: 3px;
  height: 23px;
  background: #f3f3f3;
  overflow: hidden;
`;

export const StorageBarItem = styled.div.attrs(props => ({
  width: `${(props.ratio * 100).toFixed(3)}%`
}))`
  display: flex;
  background: linear-gradient(
    -45deg,
    #6490f1 16.67%,
    #ffffff 16.67%,
    #ffffff 50%,
    #6490f1 50%,
    #6490f1 66.67%,
    #ffffff 66.67%,
    #ffffff 100%
  );
  background-size: 8.49px 8.49px;
  width: ${p => p.width};
  background-clip: content-box !important;

  position: relative;
  &::after {
    content: " ";
    width: 1px;
    height: 100%;
    position: absolute;
    right: 0;
    background: #f3f3f3;
  }
`;
