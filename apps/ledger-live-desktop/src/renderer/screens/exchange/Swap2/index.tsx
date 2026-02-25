import React from "react";
import { Routes, Route } from "react-router";
import styled, { createGlobalStyle } from "styled-components";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import SwapHistory from "./History";
import SwapNavbar from "./Navbar";
import { SwapApp } from "./App";
import { cn } from "LLD/utils/cn";
import PageHeader from "LLD/components/PageHeader";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

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
  const { t } = useTranslation();
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("desktop");

  const content = (
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

  if (shouldDisplayWallet40MainNav) {
    return (
      <div className="-mt-8 flex flex-1 flex-col gap-24 pl-16">
        <PageHeader title={t("swap.title")} />
        {content}
      </div>
    );
  }

  return content;
};

export default Swap2;
