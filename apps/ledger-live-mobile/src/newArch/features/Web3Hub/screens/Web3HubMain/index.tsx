import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { FlashList } from "@shopify/flash-list";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";
import type { Web3HubStackParamList } from "../../Navigator";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import AppCard from "~/screens/Platform/Catalog/AppCard";
// Temporary and will be replaced with proper mocks in hooks using tanstack query
import { data } from "../../__integrations__/mocks/manifests";

type Props = BaseComposite<NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubMain>>;

function ManifestItem({
  manifest,
  navigation,
}: {
  manifest: AppManifest;
  navigation: Props["navigation"];
}) {
  return (
    <AppCard
      manifest={manifest}
      onPress={() => {
        navigation.push(ScreenName.Web3HubApp, {
          manifestId: manifest.id,
        });
      }}
    />
  );
}

export default function Web3HubMain({ navigation }: Props) {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      isFlex
      style={{
        flexDirection: "column",
        gap: 26,
        marginHorizontal: 24,
        marginTop: 114,
      }}
    >
      <FlashList
        renderItem={({ item }) => {
          return <ManifestItem manifest={item} navigation={navigation} />;
        }}
        estimatedItemSize={50}
        data={data}
      />
    </SafeAreaView>
  );
}
