import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, NavBarDescription, NavBarTitle } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../testIds";

type Props = Readonly<{
  title: string;
  address: string;
  ledgerId: string;
  ticker: string;
}>;

export function AccountDetailNavBarCenter({ title, address, ledgerId, ticker }: Props) {
  return (
    <>
      <NavBarTitle testID={ACCOUNT_DETAIL_TEST_IDS.navBarTitle}>{title}</NavBarTitle>
      <Box lx={descriptionRowStyle}>
        <NavBarDescription testID={ACCOUNT_DETAIL_TEST_IDS.navBarAddress}>
          {address}
        </NavBarDescription>
        <CryptoIcon
          ledgerId={ledgerId}
          ticker={ticker}
          size={20}
          shape="square"
          testID={ACCOUNT_DETAIL_TEST_IDS.navBarNetworkIcon}
        />
      </Box>
    </>
  );
}

const descriptionRowStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "s4",
};
