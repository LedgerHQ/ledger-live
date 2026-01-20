import React from "react";
import styled from "styled-components";
import { Routes, Route } from "react-router";
import AccountCrumb from "./AccountCrumb";
import AssetCrumb from "./AssetCrumb";
import MarketCrumb from "./MarketCrumb";
const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
  width: 0;
  flex-shrink: 1;
  text-overflow: ellipsis;
  break-word: break-all;
  white-space: nowrap;
  > * {
    font-family: "Inter";
    font-weight: 600;
    font-size: 12px;
    color: ${p => p.theme.colors.neutral.c70};
  }

  > :first-child {
    padding: 0px;
    &:hover {
      background: transparent;
      text-decoration: underline;
    }
  }
`;
const Breadcrumb = () => (
  <Wrapper>
    <Routes>
      <Route path="/account/*" element={<AccountCrumb />} />
      <Route path="/asset/:assetId/*" element={<AssetCrumb />} />
      <Route path="/market/:currencyId/" element={<MarketCrumb />} />
    </Routes>
  </Wrapper>
);
export default Breadcrumb;
