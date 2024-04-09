import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex, Icons, IconsLegacy, Tag, Text, VerticalTimeline } from "@ledgerhq/native-ui";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/core";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import styled, { useTheme } from "styled-components/native";
import Button from "~/components/Button";
import StoryGroup from "~/components/StorylyStories/index";
import Link from "~/components/wrappedUi/Link";
import { NavigatorName, ScreenName } from "~/const";
import { SyncOnboardingScreenProps } from "../SyncOnboardingScreenProps";
import { TrackScreen, track } from "~/analytics";

const { BodyText, SubtitleText } = VerticalTimeline;

type Props = {
  device: Device;
  onPressKeepManualBackup(): void;
};

type ChoiceBodyProps = {
  isOpened: boolean;
  device: Device;
  onPressKeepManualBackup(): void;
};

type Choice = {
  id: "backup" | "keep_on_paper";
  icon: React.ReactNode;
  title: string;
  tag: string;
  tagColor?: string;
  tagType: React.ComponentProps<typeof Tag>["type"];
  body: React.ComponentType<ChoiceBodyProps>;
};

const ChoiceText = styled(Text).attrs({
  variant: "paragraph",
  color: "neutral.c70",
})``;

const VideoLink = ({ onPress }: { onPress(): void }) => {
  const { t } = useTranslation();
  return (
    <Flex my={4}>
      <Link
        size="small"
        Icon={IconsLegacy.PlayMedium}
        iconPosition="left"
        onPress={onPress}
        event="button_clicked"
        eventProperties={{ button: "How it works", flow: "Device onboarding" }}
      >
        {t("syncOnboarding.backup.backupChoice.howItWorksCta")}
      </Link>
    </Flex>
  );
};

const BackupBody: React.FC<ChoiceBodyProps> = ({ isOpened, device }) => {
  const { t } = useTranslation();
  const { space } = useTheme();
  const navigation = useNavigation<SyncOnboardingScreenProps["navigation"]>();

  const servicesConfig = useFeature("protectServicesMobile");

  const navigateToRecover = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: ScreenName.Recover,
      params: {
        device,
        redirectTo: "activate",
        platform: "protect-staging", // TODO: remove this, only for testing in debug
        // platform: servicesConfig?.params?.protectId, // TODO: reenable this
        date: new Date().toISOString(), // adding a date to reload the page in case of same device restored again
      },
    });
  }, [device, navigation, servicesConfig?.params?.protectId]);

  return isOpened ? (
    <Flex rowGap={space[3]}>
      <ChoiceText mb={3}>{t("syncOnboarding.backup.backupChoice.longDescription")}</ChoiceText>
      <Button
        size="small"
        type="main"
        title={t("syncOnboarding.backup.backupChoice.tryCta")}
        onPress={navigateToRecover}
        event="button_clicked"
        eventProperties={{ button: "Try for free", flow: "Device onboarding" }}
      />
      <Button
        size="small"
        type="main"
        outline
        title={t("syncOnboarding.backup.backupChoice.redeemCodeCta")}
        onPress={navigateToRecover}
        event="button_clicked"
        eventProperties={{ button: "Apply your redeem code", flow: "Device onboarding" }}
      />
      <StoryGroup
        instanceID={StorylyInstanceID.backupRecoverySeed}
        StoryGroupItemComponent={VideoLink}
        storyItemTextColor="#00000000"
        storyHeaderIconIsVisible={false}
      />
    </Flex>
  ) : (
    <ChoiceText>{t("syncOnboarding.backup.backupChoice.shortDescription")}</ChoiceText>
  );
};

const KeepOnPaperBody: React.FC<ChoiceBodyProps> = ({ isOpened, onPressKeepManualBackup }) => {
  const { t } = useTranslation();
  return isOpened ? (
    <Flex>
      <ChoiceText mb={3}>{t("syncOnboarding.backup.manualBackup.longDescription")}</ChoiceText>
      <Button
        type="main"
        size="small"
        onPress={onPressKeepManualBackup}
        event="button_clicked"
        eventProperties={{ button: "Keep it on Paper", flow: "Device onboarding" }}
      >
        {t("syncOnboarding.backup.manualBackup.cta")}
      </Button>
    </Flex>
  ) : (
    <ChoiceText>{t("syncOnboarding.backup.manualBackup.shortDescription")}</ChoiceText>
  );
};

const choices: Choice[] = [
  {
    id: "backup",
    title: "syncOnboarding.backup.backupChoice.title",
    icon: <Icons.ShieldCheck size={"S"} color="primary.c80" />,
    tag: "syncOnboarding.backup.backupChoice.tag",
    tagType: "color",
    body: BackupBody,
  },
  {
    id: "keep_on_paper",
    title: "syncOnboarding.backup.manualBackup.title",
    icon: <Icons.Note size={"S"} color="neutral.c80" />,
    tag: "syncOnboarding.backup.manualBackup.tag",
    tagType: "shade",
    tagColor: "opacityDefault.c10",
    body: KeepOnPaperBody,
  },
];

const Backup: React.FC<Props> = props => {
  const { device, onPressKeepManualBackup } = props;
  const [choice, setChoice] = useState<Choice["id"] | null>(null);
  const { space, radii } = useTheme();

  const { t } = useTranslation();

  useEffect(() => {
    if (choice === "backup") {
      track("button_clicked", { button: "Ledger Recover", flow: "Device onboarding" });
    } else if (choice === "keep_on_paper") {
      track("button_clicked", { button: "Manual Backup", flow: "Device onboarding" });
    }
  }, [choice]);

  return (
    <Flex rowGap={space[5]}>
      <TrackScreen flow="Device onboarding" category="Backup for your Secret Recovery Phrase" />
      <BodyText mb={2}>{t("syncOnboarding.backup.description")}</BodyText>
      {choices.map(({ id, title, icon, tag, tagColor, tagType, body: Body }) => (
        <Pressable key={id} onPress={() => setChoice(id)}>
          <Flex
            flexDirection={"column"}
            borderWidth="1px"
            borderColor={choice === id ? "primary.c80" : "transparent"}
            backgroundColor={"opacityDefault.c05"}
            borderRadius={radii[2]}
            p={6}
          >
            <Flex flexDirection="row" alignItems="center" justifyContent="flex-end" mb={3}>
              <Flex flexDirection="row" alignItems="center" columnGap={3} flex={1}>
                {icon}
                <SubtitleText m={0}>{t(title)}</SubtitleText>
              </Flex>
              <Tag type={tagType} size="small" {...(tagColor ? { bg: tagColor } : {})}>
                {t(tag)}
              </Tag>
            </Flex>
            <Body
              isOpened={choice === id}
              device={device}
              onPressKeepManualBackup={onPressKeepManualBackup}
            />
          </Flex>
        </Pressable>
      ))}
    </Flex>
  );
};

export default Backup;
