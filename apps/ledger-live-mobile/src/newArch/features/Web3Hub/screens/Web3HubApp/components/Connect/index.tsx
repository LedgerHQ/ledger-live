import React from "react";
import { Flex, Text, Button, Icons } from "@ledgerhq/native-ui";
import QueuedDrawer from "~/components/QueuedDrawer";
import useConnectViewModel from "./useConnectViewModel";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/reducers/accounts";
import AccountInfo from "./AccountInfo";
import CurrencyIcon from "~/components/CurrencyIcon";
import { View } from "react-native";
import { useTheme } from "@react-navigation/native";
import LedgerLogo from "~/images/logo.png";
import { Image } from "react-native";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import ChooseAccountButton from "./ChooseAccount";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { useCurrentAccountHistDB } from "~/screens/Platform/v2/hooks";
import { useDappCurrentAccount } from "@ledgerhq/live-common/wallet-api/useDappLogic";

type Props = {
  connect: ReturnType<typeof useConnectViewModel>;
  manifest: LiveAppManifest;
};

export { useConnectViewModel };

export default function Connect({ connect: { onConnect, onClose, isOpened }, manifest }: Props) {
  const accounts = useSelector(accountsSelector);
  const currentAccountHistDb: CurrentAccountHistDB = useCurrentAccountHistDB();
  const { currentAccount } = useDappCurrentAccount(currentAccountHistDb);

  const { colors } = useTheme();
  const { name, icon, dapp } = manifest;
  const firstLetter = typeof name === "string" && name[0] ? name[0].toUpperCase() : "";

  if (!dapp) return null;

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpened}>
      <Flex alignItems={"center"}>
        <Flex
          flexDirection="row"
          alignItems={"center"}
          columnGap={7}
          borderRadius={20}
          px={3}
          py={2}
        >
          <Image
            source={LedgerLogo}
            style={{ width: 70, height: 70, position: "relative", right: -13 }}
          />

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 1000,
              position: "relative",
              padding: 5,
              left: -18,
            }}
          >
            {icon ? (
              <Image
                source={{ uri: icon }}
                style={{
                  width: 50,
                  height: 50,
                  position: "relative",
                  borderRadius: 1000,
                }}
              />
            ) : (
              <Flex
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 1000,
                  backgroundColor: colors.black,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  fontWeight="semiBold"
                  variant="h2"
                  style={{
                    color: colors.white,
                  }}
                >
                  {firstLetter}
                </Text>
              </Flex>
            )}
          </View>
        </Flex>
      </Flex>

      <Text fontSize={25} textAlign={"center"}>
        {`Connect to ${name}`}
      </Text>

      <Text variant="large" mt={2} textAlign={"center"} color="smoke">
        {"on the following network"}
      </Text>

      <Flex alignItems={"center"} mb={40} mt={5}>
        <Flex
          flexDirection="row"
          backgroundColor={"translucentGrey"}
          columnGap={7}
          borderRadius={20}
          px={3}
          py={2}
        >
          <CurrencyIcon currency={accounts[2].currency} color={colors.white} size={22} circle />
          <Text fontSize={18}>{"Ethereum"}</Text>
        </Flex>
      </Flex>

      <Flex mx={2} mb={3} flexDirection={"row"} justifyContent={"space-between"}>
        <Text variant="body" lineHeight={"22px"} color="smoke">
          {"ACCOUNT"}
        </Text>
        <ChooseAccountButton manifest={manifest} currentAccountHistDb={currentAccountHistDb} />
      </Flex>

      <AccountInfo account={currentAccount} onPress={() => 0} py={4} px={6} borderRadius={14} />

      <Text mt={6} color="smoke">
        {"This website will be able to:"}
      </Text>

      <Flex mt={6} rowGap={5}>
        <Flex flexDirection={"row"} columnGap={5} alignItems={"center"}>
          <Icons.Check color={"green"} />
          <Text fontSize={12} color="black">
            {"Check your account balance and activity"}
          </Text>
        </Flex>
        <Flex flexDirection={"row"} columnGap={5} alignItems={"center"}>
          <Icons.Check color={"green"} />
          <Text fontSize={12} color="black">
            {"Request approvals for transactions"}
          </Text>
        </Flex>
      </Flex>

      <Flex mt={6} columnGap={10} flexDirection={"row"}>
        <Button
          type="default"
          style={{ flex: 1, borderColor: "gray", borderWidth: 1 }}
          onPress={onClose}
        >
          {"Close"}
        </Button>
        <Button type="main" onPress={onConnect} style={{ flex: 1 }}>
          {"Connect"}
        </Button>
      </Flex>
      <Text mt={6} textAlign={"center"} color="smoke">
        {"Only connect to websites you trust."}
      </Text>
    </QueuedDrawer>
  );
}
