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

type Props = {
  connect: ReturnType<typeof useConnectViewModel>;
};

export { useConnectViewModel };

export default function Connect({ connect: { onConfirm } }: Props) {
  const accounts = useSelector(accountsSelector);
  const { colors } = useTheme();

  return (
    // <QueuedDrawer isRequestingToBeOpened={isOpened} onClose={onClose}>
    <QueuedDrawer isRequestingToBeOpened={true} onClose={() => 0}>
      <Flex alignItems={"center"}>
        <Flex
          flexDirection="row"
          alignItems={"center"}
          columnGap={7}
          borderRadius={20}
          px={3}
          py={2}
        >
          <CurrencyIcon
            currency={accounts[0].currency}
            color={colors.snackBarBg}
            size={50}
            circle
          />

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 50000,
              position: "relative",
              padding: 5,
              left: -20,
            }}
          >
            <CurrencyIcon currency={accounts[2].currency} color={colors.white} size={50} circle />
          </View>
        </Flex>
      </Flex>

      <Text fontSize={25} textAlign={"center"}>
        {"Connect to Uniswap"}
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
        <Text variant="body" color="primary.c80">
          {"Choose account"}
        </Text>
      </Flex>

      <AccountInfo account={accounts[2]} onPress={() => 0} py={4} px={6} borderRadius={14} />

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
          onPress={onConfirm}
        >
          {"Close"}
        </Button>
        <Button type="main" onPress={onConfirm} style={{ flex: 1 }}>
          {"Connect"}
        </Button>
      </Flex>
      <Text mt={6} textAlign={"center"} color="smoke">
        {"Only connect to websites you trust."}
      </Text>
    </QueuedDrawer>
  );
}
