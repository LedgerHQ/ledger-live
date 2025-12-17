import React from "react";
import { Route } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import Box from "~/renderer/components/Box";
import SwapHistory from "./History";
import SwapNavbar from "./Navbar";

import { SwapApp } from "./App";
const Body = styled(Box)`
  flex: 1;
`;

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
      padding-top: 0;
  }

  div#page-scroller::-webkit-scrollbar {
    width: 10px;
  }

  div#page-scroller::-webkit-scrollbar-thumb {
    background-color: ${p => p.theme.colors.neutral.c50};
    border-radius: 10px;
  }

  div#page-scroller::-webkit-scrollbar-track {
    background: ${p => p.theme.colors.neutral.c20};
    border-radius: 10px;
  }
`;

const Swap2 = () => {
  return (
    <Body>
      <GlobalStyle />
      <SwapNavbar />
      <Main>
        <Route path="/swap" component={SwapApp} exact />
        <Route path="/swap/history" component={SwapHistory} exact />
      </Main>
    </Body>
  );
};

export default Swap2;
