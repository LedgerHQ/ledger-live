import React, { useCallback, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import {
  Alert,
  Button,
  Divider,
  Flex,
  IconsLegacy,
  Link,
  Switch,
  Tag,
  Text,
} from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/native";
import { useFeatureFlags } from "@ledgerhq/live-config/featureFlags/FeatureFlagsContext";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";

import Stories from "~/components/StorylyStories";
import FeatureFlagDetails from "../../../FeatureFlagsSettings/FeatureFlagDetails";
import { useLocale } from "~/context/Locale";
import { ScreenName } from "~/const";
import { languages } from "../../../../languages";
import StoriesConfig from "~/components/StorylyStories/StoriesConfig";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

const appLanguageParagraphs = [
  "App language affects which story groups are displayed in the app.",
  '- If the language is English, the story groups displayed will be all the ones that have the segment "lang_en".',
  '- If the language is French (for example) AND THERE ARE story groups with the segment "lang_fr", then these are the story groups that will be displayed.',
  '- If the language is French (for example) AND THERE ARE NO story groups with the segment "lang_fr", then the story groups with the segment "lang_en" are the ones that will be displayed.',
];

const DebugStoryly = () => {
  const [nonce, setNonce] = useState(0);
  const [verticalLayout, setVerticalLayout] = useState(true);
  const [keepOriginalOrder, setKeepOriginalOrder] = useState(true);
  const [flagSettingsOpened, setFlagSettingsOpened] = useState(false);
  const navigation =
    useNavigation<StackNavigatorProps<SettingsNavigatorStackParamList>["navigation"]>();

  const refreshAll = useCallback(() => {
    setNonce(nonce + 1);
  }, [setNonce, nonce]);

  const { locale } = useLocale();
  const { resetFeature } = useFeatureFlags();
  const storylyFeature = useFeature("storyly");

  const stringifiedFeature = useMemo(() => JSON.stringify(storylyFeature), [storylyFeature]);

  return (
    <SafeAreaView edges={["bottom"]}>
      <ScrollView>
        <Flex backgroundColor="background.main" flex={1} p={6}>
          <Alert
            type="warning"
            title={
              "This is a tool provided as-is for the team to validate storyly instances used in the app."
            }
          />
          <Divider />
          <Flex flexShrink={1} pr={4}>
            <Flex flexDirection="row" mb={3}>
              <Text variant="h5">App language</Text>
              <Flex flex={1} />
              <Link
                type="color"
                Icon={IconsLegacy.ChevronRightMedium}
                onPress={() => navigation.navigate(ScreenName.OnboardingLanguage)}
              >
                {languages[locale]}
              </Link>
            </Flex>
            <Alert>
              <Flex flexShrink={1}>
                {appLanguageParagraphs.map((text, index, arr) => (
                  <Alert.BodyText key={index} mb={index === arr.length - 1 ? 0 : 4}>
                    {text}
                  </Alert.BodyText>
                ))}
              </Flex>
            </Alert>
          </Flex>
          <Divider />
          <Text variant="h5">Stories options</Text>
          <Text mb={3}>Applies to this screen only</Text>
          <Switch label="Vertical layout" checked={verticalLayout} onChange={setVerticalLayout} />
          <Flex height={4} />
          <Switch
            label="Keep stories of a group in their initial order"
            checked={keepOriginalOrder}
            onChange={setKeepOriginalOrder}
          />
          <Divider />
          <Text variant="h4">Stories</Text>
          <Flex mb={3} flexDirection="row" alignItems="center">
            <Button mr={2} size="small" type="shade" outline onPress={refreshAll}>
              Refresh
            </Button>
            <Button size="small" type="shade" outline onPress={() => resetFeature("storyly")}>
              Reset remote config
            </Button>
          </Flex>
          {Object.entries(StorylyInstanceID).map(([key, value], index) => (
            <Flex key={index} flex={1}>
              <Tag type="color" alignSelf="flex-start" uppercase={false} mb={3}>
                {key}
              </Tag>
              <StoriesConfig instanceID={value as StorylyInstanceID} />
              <Flex borderWidth={1} borderColor="neutral.c40" p={5}>
                <Text pb={5}>Preview: </Text>
                <Stories
                  key={nonce.toString() + stringifiedFeature}
                  vertical={verticalLayout}
                  instanceID={value as StorylyInstanceID}
                  keepOriginalOrder={keepOriginalOrder}
                />
              </Flex>
              <Divider />
            </Flex>
          ))}
          <Text variant="h5">Feature flag / Remote configuration</Text>
          <FeatureFlagDetails
            flagName={"storyly"}
            focused={flagSettingsOpened}
            setFocusedName={val => setFlagSettingsOpened(!!val)}
            isLast
          />
        </Flex>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DebugStoryly;
