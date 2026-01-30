import React from "react";
import { Routes, Route } from "react-router";
import styled, { createGlobalStyle } from "styled-components";
import Box from "~/renderer/components/Box";
import SwapHistory from "./History";
import SwapNavbar from "./Navbar";

import { SwapApp } from "./App";
import { cn } from "LLD/utils/cn";

const Main = styled.main`
  display: flex;
  justify-content: center;
  flex: 1;

  & > * {
    width: 100%;
  }
`;

const GlobalStyle = createGlobalStyle`
  #page-scroller {
    padding-top: 8px;
    padding-bottom: 0;
    padding-left: 0;
    padding-right: 0;
    scrollbar-width: none;
  }

  #page-scroller::-webkit-scrollbar {
    display: none;
  }
`;

const Swap2 = () => {
  return (
    <Box className={cn(["bg-canvas", "flex-1"])}>
      <GlobalStyle />
      <SwapNavbar />
      <Main>
        <Routes>
          <Route path="/" element={<SwapApp />} />
          <Route path="/history" element={<SwapHistory />} />
        </Routes>
      </Main>
    </Box>
  );
};

export default Swap2;
