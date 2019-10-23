// @flow
import React from "react";
import styled from "styled-components";

import type { AppsDistribution } from "./sizes";

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
  max-height: 200px;
`;

export const StorageBar = ({
  distribution
}: {
  distribution: AppsDistribution
}) => (
  <StorageBarWrapper>
    <StorageBarItem ratio={distribution.osBlocks / distribution.totalBlocks} />
    {distribution.apps.map(({ name, currency, blocks }) => {
      const color = currency ? currency.color : "black"; // unknown color?
      return (
        <StorageBarItem
          key={name}
          style={{ background: color }}
          ratio={blocks / distribution.totalBlocks}
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
// Dont judge me
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
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  background-clip: content-box;
`;
