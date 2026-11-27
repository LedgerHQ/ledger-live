import { TrackScreen } from "@shared/analytics-react";
import React from "react";

import { Flex, Text } from "@ledgerhq/native-ui";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useTranslation } from "~/context/Locale";
import type { KeyRingMember, KeyRingMemberId } from "@features/platform-key-ring";
import { TinyCard } from "../TinyCard";
import { Scene } from "../../screens/ManageInstances/useManageInstanceDrawer";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";

type Props = {
  onClickInstance: (member: KeyRingMember) => void;
  members?: KeyRingMember[];
  isCurrentInstance: (memberId: KeyRingMemberId) => boolean;
  changeScene: (scene: Scene) => void;
};

export function ListInstances({ onClickInstance, changeScene, members, isCurrentInstance }: Props) {
  const { t } = useTranslation();

  function handleAutoRemove() {
    changeScene(Scene.AutoRemove);
  }

  function handleGoDeleteInstance(instance: KeyRingMember) {
    onClickInstance(instance);
  }

  function renderItem({ item }: ListRenderItemInfo<KeyRingMember>) {
    const instance = item;
    const isCurrent = isCurrentInstance(instance.id);
    return (
      <TinyCard
        key={instance.id}
        testID={`walletSync-manage-instance-${instance.id}`}
        text={instance.name}
        cta={t("walletSync.walletSyncActivated.manageInstances.remove")}
        onClick={isCurrent ? handleAutoRemove : () => handleGoDeleteInstance(instance)}
        currentInstance={isCurrent}
      />
    );
  }

  return (
    <Flex pb={4}>
      <TrackScreen name={AnalyticsPage.ManageSyncInstances} />
      <Text variant="h5" fontWeight="semiBold" color="neutral.c100" mb={4}>
        {t("walletSync.walletSyncActivated.manageInstances.title")}
      </Text>

      <FlatList
        data={members}
        renderItem={renderItem}
        keyExtractor={s => s.id}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        ItemSeparatorComponent={() => <Flex height={12} />}
      />
    </Flex>
  );
}
