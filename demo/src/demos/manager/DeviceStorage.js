// @flow
import React from 'react';
import styled from "styled-components";
import {findCryptoCurrencyById} from "@ledgerhq/live-common/lib/currencies";

import nanoS from "./images/nanoS.png";
import nanoX from "./images/nanoX.png";
import blue from "./images/blue.png";

const illustrations = {
  nanoS,
  nanoX,
  blue
}

const hackyData = [ // Assuming percentage :shrug:
  {
    app: "os",
    size: 20
  },
  {
    app: "bitcoin",
    size: 10
  },
  {
    app: "ethereum",
    size: 10
  },
  {
    app: "tezos",
    size: 10
  },
  {
    app: "stellar",
    size: 10
  },
  {
    app: "rest",
    size: 40
  }
]

const DeviceStorage = ({device})=> {
  return <Block>
    <DeviceIllustration device={device}/>
    <ContentWrapper>
      <StorageBar data={hackyData}/>
    </ContentWrapper>
  </Block>
};

/**
 *
 * @param data that somehow includes the size of the installed apps
 */
const StorageBar = ({data})=>{
  return <StorageBarWrapper>
    {data.map(({app, size})=>{
      const currency = findCryptoCurrencyById(app)
      const color = currency?currency.color:undefined
      return <StorageBarItem size={size} color={color}/>
    })}
  </StorageBarWrapper>
}
export const Block = styled.div`
  display:flex;
  flex-direction:row;
`
export const StorageBarWrapper = styled.div`
  display:flex;
  flex-direction:row;
  width:100%;
  border-radius:3px;
  height:23px;
`
// Dont judge me
export const StorageBarItem = styled.div`
  display:flex;
  ${p=>p.color?`background:${p.color}`:'background-image:linear-gradient(-45deg, #6490f1 16.67%, #ffffff 16.67%, #ffffff 50%, #6490f1 50%, #6490f1 66.67%, #ffffff 66.67%, #ffffff 100%)'};
  background-size:8.49px 8.49px;
  width:${p=>p.size}%;
  border-left:1px solid transparent;
  border-right:1px solid transparent;
  background-clip: content-box;
  &:first-of-type{
    border-left:none;
    border-top-left-radius:5px;
    border-bottom-left-radius:5px;
  }
  &:last-of-type{
    border-right:none;
    border-top-right-radius:5px;
    border-bottom-right-radius:5px;
    background:#ddd;
  }
`

export const DeviceIllustration = styled.img.attrs((p) => ({
  src: illustrations[p.device.id]
}))`
    max-height:200px;
`

export const ContentWrapper = styled.div`
  padding:20px;
  flex:1;
`

export default DeviceStorage;
