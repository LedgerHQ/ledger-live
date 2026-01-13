import React from "react";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";
import AccountItem from "../../AccountsListView/components/AccountItem";
import { AccountLike } from "@ledgerhq/types-live";

type Props = {
  account: AccountLike | null;
  onClose: () => void;
  backgroundColor: string;
  iconColor: string;
};

const CustomHeader = ({ account, onClose, backgroundColor, iconColor }: Props) =>
  !account ? null : (
    <Flex
      flexDirection="row"
      width="100%"
      p={16}
      borderBottom={5}
      borderBottomColor="opacityDefault.c10"
      borderBottomWidth={1}
    >
      <AccountItem account={account} balance={account.balance} hideBalanceInfo />
      <Flex alignItems="flex-end">
        <TouchableOpacity onPress={onClose}>
          <Flex
            justifyContent="center"
            alignItems="center"
            p={3}
            borderRadius={32}
            backgroundColor={backgroundColor}
          >
            <Icons.Close size={"XS"} color={iconColor} />
          </Flex>
        </TouchableOpacity>
      </Flex>
    </Flex>
  );

export default CustomHeader;
