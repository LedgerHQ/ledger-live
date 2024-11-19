import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex, Icons, IconsLegacy, Link, Tag, Text } from "@ledgerhq/react-ui";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import React, { ComponentProps, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { track } from "~/renderer/analytics/segment";
import ButtonV3 from "../../ButtonV3";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useStoryly } from "~/storyly/useStoryly";

import { StepText, StepSubtitleText } from "./shared";
import { useCustomPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { saveSettings } from "~/renderer/actions/settings";

type BackupStepProps = {
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
  getTitle: (selected?: boolean) => string;
  tag?: React.ReactNode;
  body: React.ComponentType<ChoiceBodyProps>;
};

const ChoiceText = styled(Text).attrs({
  variant: "paragraph",
  color: "neutral.c70",
})``;

const VideoLink: React.FC<{}> = () => {
  const { t } = useTranslation();
  const { ref: storylyRef, dataRef } = useStoryly(StorylyInstanceID.backupRecoverySeed);
  return (
    <Flex my={4} alignSelf={"center"}>
      <div style={{ display: "none" }}>
        {/* @ts-expect-error the `storyly-web` package doesn't provide any typings yet. */}
        <storyly-web ref={storylyRef} />
      </div>
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

const BackupBody: React.FC<ChoiceBodyProps> = ({ isOpened }) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const history = useHistory();

  const servicesConfig = useFeature("protectServicesDesktop");

  const recoverActivatePath = useCustomPath(servicesConfig, "activate", "lld-onboarding-24") || "";

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
      <ChoiceText mb={3}>{t("syncOnboarding.manual.backup.backupChoice.description")}</ChoiceText>
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
  ) : null;
};

const KeepOnPaperBody: React.FC<ChoiceBodyProps> = ({ isOpened, onPressKeepManualBackup }) => {
  const { t } = useTranslation();
  return isOpened ? (
    <Flex flexDirection={"column"} mt={3}>
      <ChoiceText mb={6}>{t("syncOnboarding.manual.backup.manualBackup.description")}</ChoiceText>
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
  ) : null;
};

const WrappedTag: React.FC<{ text: string } & ComponentProps<typeof Tag>> = ({
  text,
  ...props
}) => {
  const { t } = useTranslation();
  return (
    <Tag
      size="tiny"
      active
      {...props}
      textProps={{ uppercase: true, fontWeight: "semiBold", lineHeight: "normal" }}
    >
      {t(text)}
    </Tag>
  );
};

const choices: Choice[] = [
  {
    id: "backup",
    getTitle: selected =>
      selected
        ? "syncOnboarding.manual.backup.backupChoice.titleSelected"
        : "syncOnboarding.manual.backup.backupChoice.title",
    icon: <Icons.ShieldCheck size={"S"} color="primary.c80" />,
    tag: (
      <WrappedTag
        text={"syncOnboarding.manual.backup.backupChoice.tag"}
        type="plain"
        active
        bg="primary.c80"
      />
    ),
    body: BackupBody,
  },
  {
    id: "keep_on_paper",
    getTitle: () => "syncOnboarding.manual.backup.manualBackup.title",
    icon: <Icons.Note size={"S"} color="neutral.c80" />,
    body: KeepOnPaperBody,
  },
];

const BackupStep: React.FC<BackupStepProps> = props => {
  const { device, onPressKeepManualBackup } = props;
  const [choice, setChoice] = useState<Choice["id"] | null>(null);
  const { radii } = useTheme();

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
      {/* @ts-expect-error weird props issue with React 18 */}
      <StepText mb={2}>{t("syncOnboarding.manual.backup.description")}</StepText>
      {choices.map(({ id, getTitle, icon, tag, body: Body }) => (
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
            <Flex flexDirection="row" alignItems="center" justifyContent="flex-end">
              <Flex flexDirection="row" alignItems="center" columnGap={3} flex={1}>
                {icon}
                {/* @ts-expect-error weird props issue with React 18 */}
                <StepSubtitleText m={0} ml={3}>
                  {t(getTitle(choice === id))}
                </StepSubtitleText>
              </Flex>
              {tag ?? null}
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
