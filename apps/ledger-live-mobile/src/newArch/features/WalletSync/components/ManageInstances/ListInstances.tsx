import React from "react";

import { Flex, Text } from "@ledgerhq/native-ui";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useTranslation } from "react-i18next";
import { TrustchainMember } from "@ledgerhq/trustchain/types";
import { TinyCard } from "../TinyCard";
import { Scene } from "../../screens/ManageInstances/useManageInstanceDrawer";

type Props = {
  onClickInstance: (member: TrustchainMember) => void;
  members?: TrustchainMember[];
  currentInstance?: string;
  changeScene: (scene: Scene) => void;
};

export function ListInstances({ onClickInstance, changeScene, members, currentInstance }: Props) {
  const { t } = useTranslation();

  const handleAutoRemove = () => changeScene(Scene.AutoRemove);

  const handleGoDeleteInstance = (instance: TrustchainMember) => {
    // eslint-disable-next-line no-console
    console.log("delete instance IMPLEMENTED IN NEXT PR", instance);
    onClickInstance(instance);
  };

  const renderItem = ({ item }: ListRenderItemInfo<TrustchainMember>) => {
    const instance = item;
    return (
      <TinyCard
        key={instance.id}
        testID={`walletSync-manage-instance-${instance.id}`}
        text={instance.name}
        cta={t("walletSync.walletSyncActivated.manageInstances.remove")}
        onClick={
          currentInstance === instance.id
            ? handleAutoRemove
            : () => handleGoDeleteInstance(instance)
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
