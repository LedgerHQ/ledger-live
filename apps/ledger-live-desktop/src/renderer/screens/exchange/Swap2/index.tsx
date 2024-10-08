import React from "react";
import { Route } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import Box from "~/renderer/components/Box";
import SwapForm from "./Form";
import SwapHistory from "./History";
import SwapNavbar from "./Navbar";

import { SwapApp } from "./App";
import { useIsSwapLiveFlagEnabled } from "./hooks/useIsSwapLiveFlagEnabled";
const Body = styled(Box)`
  flex: 1;
`;

const Main = styled.main`
  display: flex;
  justify-content: center;
  flex: 1;
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 4px 6px rgba(20, 37, 51, 0.04);
  border-top: 1px solid ${p => p.theme.colors.palette.divider};

  & > * {
    width: 100%;
  }
`;

const GlobalStyle = createGlobalStyle`
  #page-scroller {
      padding-top: 0;
  }

  div#page-scroller::-webkit-scrollbar {
    width: 10px;    
  }

  div#page-scroller::-webkit-scrollbar-thumb {
    background-color: ${p => p.theme.colors.palette.neutral.c50};
    border-radius: 10px;
  }

  div#page-scroller::-webkit-scrollbar-track {
    background: ${p => p.theme.colors.palette.neutral.c20};
    border-radius: 10px;
  }
`;

const Swap2 = () => {
  const isDemo3Enabled = useIsSwapLiveFlagEnabled("ptxSwapLiveAppDemoThree");

  const SwapPage = isDemo3Enabled ? SwapApp : SwapForm;

  return (
    <Body>
      <GlobalStyle />
      <SwapNavbar />
      <Main>
        <Route path="/swap" component={SwapPage} exact />
        <Route path="/swap/history" component={SwapHistory} exact />
      </Main>
    </Body>
  );
};

export default Swap2;
