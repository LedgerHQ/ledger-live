import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex, Icons, IconsLegacy, Link, Tag, Text } from "@ledgerhq/react-ui";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { track } from "~/renderer/analytics/segment";
import ButtonV3 from "../../ButtonV3";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useStoryly } from "~/storyly/useStoryly";

import { StepText as BodyText, StepSubtitleText as SubtitleText } from "./shared";
import { useCustomPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { saveSettings } from "~/renderer/actions/settings";

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

const VideoLink = () => {
  const { t } = useTranslation();
  const { ref: storylyRef, dataRef } = useStoryly(StorylyInstanceID.backupRecoverySeed, {
    styleProps: {
      storyGroupTextVisibility: false,
      storyItemTextColor: "#00000000",
      storyHeaderIconIsVisible: false,
    },
  });
  return (
    <Flex my={4} alignSelf={"center"}>
      {/* invisible div */}
      {/* <div style={{ display: "none" }}> */}
      <storyly-web ref={storylyRef} />
      {/* </div> */}
      <Link
        size="small"
        Icon={IconsLegacy.PlayMedium}
        iconPosition="left"
        onClick={() => {
          track("button_clicked", { button: "How it works", flow: "Device onboarding" });
          storylyRef.current?.openStory({
            group: dataRef.current?.at(0)?.id.toString(10),
          });
        }}
      >
        {t("syncOnboarding.manual.backup.backupChoice.howItWorksCta")}
      </Link>
    </Flex>
  );
};

const BackupBody: React.FC<ChoiceBodyProps> = ({ isOpened, device }) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const history = useHistory();

  const servicesConfig = useFeature("protectServicesDesktop");

  const recoverActivatePath =
    useCustomPath(
      {
        ...servicesConfig,
        params: {
          ...servicesConfig?.params,
          protectId:
            servicesConfig?.params.protectId === "protect-local-dev"
              ? "protect-staging"
              : servicesConfig?.params.protectId,
        },
      },
      "activate",
      "lld-stax-onboarding",
    ) || "";

  const navigateToRecover = useCallback(() => {
    console.log("recoverActivatePath", recoverActivatePath);
    const [pathname, search] = recoverActivatePath.split("?");
    dispatch(
      saveSettings({
        hasCompletedOnboarding: true,
      }),
    );
    history.push({
      pathname,
      search: search ? `?${search}` : undefined,
      state: { fromOnboarding: false },
    });
  }, [dispatch, history, recoverActivatePath]);

  return isOpened ? (
    <Flex rowGap={3} flexDirection={"column"}>
      <ChoiceText mb={3}>
        {t("syncOnboarding.manual.backup.backupChoice.longDescription")}
      </ChoiceText>
      <ButtonV3
        size="small"
        variant="main"
        onClick={navigateToRecover}
        event="button_clicked"
        eventProperties={{ button: "Try for free", flow: "Device onboarding" }}
      >
        {t("syncOnboarding.manual.backup.backupChoice.tryCta")}
      </ButtonV3>
      <ButtonV3
        size="small"
        variant="shade"
        onClick={navigateToRecover}
        event="button_clicked"
        eventProperties={{ button: "Apply your redeem code", flow: "Device onboarding" }}
      >
        {t("syncOnboarding.manual.backup.backupChoice.redeemCodeCta")}
      </ButtonV3>
      <VideoLink />
    </Flex>
  ) : (
    <ChoiceText>{t("syncOnboarding.manual.backup.backupChoice.shortDescription")}</ChoiceText>
  );
};

const KeepOnPaperBody: React.FC<ChoiceBodyProps> = ({ isOpened, onPressKeepManualBackup }) => {
  const { t } = useTranslation();
  return isOpened ? (
    <Flex flexDirection={"column"}>
      <ChoiceText mb={6}>
        {t("syncOnboarding.manual.backup.manualBackup.longDescription")}
      </ChoiceText>
      <ButtonV3
        size="small"
        variant="main"
        onClick={onPressKeepManualBackup}
        event="button_clicked"
        eventProperties={{ button: "Keep it on Paper", flow: "Device onboarding" }}
      >
        {t("syncOnboarding.manual.backup.manualBackup.cta")}
      </ButtonV3>
    </Flex>
  ) : (
    <ChoiceText>{t("syncOnboarding.manual.backup.manualBackup.shortDescription")}</ChoiceText>
  );
};

const choices: Choice[] = [
  {
    id: "backup",
    title: "syncOnboarding.manual.backup.backupChoice.title",
    icon: <Icons.ShieldCheck size={"S"} color="primary.c80" />,
    tag: "syncOnboarding.manual.backup.backupChoice.tag",
    tagType: "color",
    body: BackupBody,
  },
  {
    id: "keep_on_paper",
    title: "syncOnboarding.manual.backup.manualBackup.title",
    icon: <Icons.Note size={"S"} color="neutral.c80" />,
    tag: "syncOnboarding.manual.backup.manualBackup.tag",
    tagType: "shade",
    tagColor: "opacityDefault.c10",
    body: KeepOnPaperBody,
  },
];

const BackupStep: React.FC<Props> = props => {
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
    <Flex rowGap={5} flex={1} flexDirection={"column"}>
      <TrackPage flow="Device onboarding" category="Backup for your Secret Recovery Phrase" />
      <BodyText mb={2}>{t("syncOnboarding.manual.backup.description")}</BodyText>
      {choices.map(({ id, title, icon, tag, tagColor, tagType, body: Body }) => (
        <div key={id} onClick={() => setChoice(id)}>
          <Flex
            flexDirection={"column"}
            borderWidth="1px"
            borderStyle={"solid"}
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
              <Tag
                size="small"
                style={{ textTransform: "uppercase" }}
                type="plain"
                active
                backgroundColor={"primary.c80"}
              >
                {t(tag)}
              </Tag>
            </Flex>
            <Body
              isOpened={choice === id}
              device={device}
              onPressKeepManualBackup={onPressKeepManualBackup}
            />
          </Flex>
        </div>
      ))}
    </Flex>
  );
};

export default BackupStep;
