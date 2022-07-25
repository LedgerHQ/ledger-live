import React, { memo, useCallback, useMemo, useState } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { usePlatformApp } from "@ledgerhq/live-common/platform/PlatformAppProvider/index";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { filterPlatformApps } from "@ledgerhq/live-common/platform/PlatformAppProvider/helpers";
import { ScrollView, TouchableOpacity } from "react-native";
import { AppManifest } from "@ledgerhq/live-common/platform/types";
import { useNavigation } from "@react-navigation/native";
import AppIcon from "../Platform/AppIcon";
import { useBanner } from "../../components/banners/hooks";
import { ScreenName } from "../../const";
import DAppDisclaimer from "../Platform/DAppDisclaimer";

const DAPP_DISCLAIMER_ID = "PlatformAppDisclaimer";

function DiscoverSection() {
  const navigation = useNavigation();
  const { manifests } = usePlatformApp();
  const experimental = useEnv("PLATFORM_EXPERIMENTAL_APPS");

  const filteredManifests = useMemo(() => {
    const branches = ["stable", ...(experimental ? ["experimental"] : [])];

    return filterPlatformApps(Array.from(manifests.values()), {
      version: "0.0.1",
      platform: "mobile",
      branches,
    });
  }, [manifests, experimental]);

  const [disclaimerOpts, setDisclaimerOpts] = useState<any>(null);
  const [disclaimerOpened, setDisclaimerOpened] = useState<boolean>(false);
  const [disclaimerDisabled, setDisclaimerDisabled] = useBanner(
    DAPP_DISCLAIMER_ID,
  );

  const handlePressCard = useCallback(
    (manifest: AppManifest) => {
      const openDApp = () =>
        navigation.navigate(ScreenName.PlatformApp, {
          platform: manifest.id,
          name: manifest.name,
        });

      if (!disclaimerDisabled) {
        setDisclaimerOpts({
          disableDisclaimer: () => setDisclaimerDisabled(),
          closeDisclaimer: () => setDisclaimerOpened(false),
          icon: manifest.icon,
          onContinue: openDApp,
        });
        setDisclaimerOpened(true);
      } else {
        openDApp();
      }
    },
    [navigation, setDisclaimerDisabled, disclaimerDisabled],
  );

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filteredManifests.map((manifest, i) => (
          <TouchableOpacity
            key={manifest.id + i}
            onPress={() => handlePressCard(manifest)}
          >
            <Flex ml={3} alignItems={"center"} width={"72px"}>
              <AppIcon size={58} name={manifest.name} icon={manifest.icon} />
              <Text
                variant={"paragraph"}
                fontWeight={"medium"}
                numberOfLines={1}
                mt={3}
              >
                {manifest.name}
              </Text>
            </Flex>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {disclaimerOpts ? (
        <DAppDisclaimer
          disableDisclaimer={disclaimerOpts.disableDisclaimer}
          closeDisclaimer={disclaimerOpts.closeDisclaimer}
          onContinue={disclaimerOpts.onContinue}
          isOpened={disclaimerOpened}
          icon={disclaimerOpts.icon}
        />
      ) : null}
    </>
  );
}

export default memo(DiscoverSection);
