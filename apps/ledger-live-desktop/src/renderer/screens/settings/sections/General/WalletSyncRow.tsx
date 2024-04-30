import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import React, { PropsWithChildren, useState } from "react";
import Button from "~/renderer/components/Button";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import useTheme from "~/renderer/hooks/useTheme";

const LogoWrapper = ({ children }: PropsWithChildren) => (
  <Box>
    <Flex padding="7px" borderRadius="13px">
      <Flex
        style={{
          borderRadius: "9px",
          backgroundColor: "hsla(248, 100%, 85%, 0.08)",
          padding: "5px",
          opacity: "70%",
        }}
      >
        {children}
      </Flex>
    </Flex>
  </Box>
);

const SideContentActivateWalletSync = () => {
  const { colors } = useTheme();

  return (
    <Flex
      flexDirection="column"
      height="100%"
      paddingX="64px"
      alignSelf="center"
      justifyContent="center"
      rowGap="48px"
    >
      <Flex flexDirection="column" alignSelf="center" justifyContent="center" rowGap="24px">
        <Flex justifyContent="center" alignItems="center">
          <LogoWrapper>
            <Icons.Mobile color={colors.constant.purple} />
          </LogoWrapper>

          <LogoWrapper>
            <Icons.Refresh size="L" color={colors.constant.purple} />
          </LogoWrapper>

          <LogoWrapper>
            <Icons.Desktop color={colors.constant.purple} />
          </LogoWrapper>
        </Flex>

        <Text fontSize={24} variant="h4Inter" textAlign="center">
          Activate sallet sync
        </Text>
        <Text fontSize={14} variant="body" color="hsla(0, 0%, 58%, 1)" textAlign="center">
          Create a secure backup of your Ledger Live and synchronize multiple instances of Ledger
          Live, both on mobile and desktop.
        </Text>
        <Flex justifyContent="center">
          <ButtonV3 variant="main">Create a backup</ButtonV3>
        </Flex>
      </Flex>

      <Box>
        <Flex
          flexDirection="row"
          padding="18px"
          borderRadius="12px"
          backgroundColor={colors.opacityDefault.c05}
          justifyContent="space-between"
        >
          <Text variant="body" fontSize={14} flexShrink={1}>
            Already created a back-up on another Device ?
          </Text>
          <Box>
            <ButtonV3 variant="shade">Synchronize</ButtonV3>
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
};

const SideContentWalletSync = () => {
  return <div>Wallet Sync</div>;
};

const WalletSyncRow = () => {
  const lldWalletSync = useFeature("lldWalletSync");
  const [open, setOpen] = useState(false);

  return (
    <>
      <SideDrawer isOpen={open} onRequestClose={() => setOpen(false)} direction="left">
        {lldWalletSync?.enabled ? <SideContentWalletSync /> : <SideContentActivateWalletSync />}
      </SideDrawer>

      <Button small event="Manage WalletSync" primary onClick={() => setOpen(true)}>
        Manage
      </Button>
    </>
  );
};
export default WalletSyncRow;
