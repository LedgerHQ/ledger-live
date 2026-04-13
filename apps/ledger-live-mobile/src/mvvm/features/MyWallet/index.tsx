import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { MyWalletHeader } from "./views/Header";
import { ProfileSection } from "./views/ProfileSection";

export function MyWalletScreen() {
  const { top } = useSafeAreaInsets();

  return (
    <Box style={{ paddingTop: top, flex: 1 }}>
      <MyWalletHeader />
      <ProfileSection />
    </Box>
  );
}
