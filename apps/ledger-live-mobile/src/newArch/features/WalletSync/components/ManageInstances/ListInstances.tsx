import React from "react";

import { Flex, Text } from "@ledgerhq/native-ui";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useTranslation } from "react-i18next";
import { TrustchainMember } from "@ledgerhq/trustchain/types";
import { TinyCard } from "../TinyCard";

type Props = {
  onClickDelete: () => void;
  members?: TrustchainMember[];
  currentInstance?: string;
};

export function ListInstances({ onClickDelete, members, currentInstance }: Props) {
  const { t } = useTranslation();

  // eslint-disable-next-line no-console
  const handleAutoRemove = () => console.log("auto remove, IMPLEMENTED IN NEXT PR");

  const handleGoDeleteInstance = (instance: TrustchainMember) => {
    // eslint-disable-next-line no-console
    console.log("delete instance IMPLEMENTED IN NEXT PR", instance);
    onClickDelete();
  };

  const renderItem = ({ item }: ListRenderItemInfo<TrustchainMember>) => {
    const instance = item;
    return (
      <TinyCard
        key={instance.id}
        testId={`walletSync-manage-instance-${instance.id}`}
        text={instance.name}
        cta={t("walletSync.walletSyncActivated.manageInstances.remove")}
        onClick={
          currentInstance == instance.id ? handleAutoRemove : () => handleGoDeleteInstance(instance)
        }
        currentInstance={currentInstance === instance.id}
      />
    );
  };

  return (
    <Flex pb={4}>
      <Text variant="h5" fontWeight="semiBold" color="neutral.c100" mb={4}>
        {t("walletSync.walletSyncActivated.manageInstances.title")}
      </Text>

      <FlatList
        data={members}
        renderItem={renderItem}
        keyExtractor={s => s.id}
        contentContainerStyle={{
          paddingBottom: 10,
        }}
        ItemSeparatorComponent={() => <Flex height={12} />}
      />
    </Flex>
  );
}
