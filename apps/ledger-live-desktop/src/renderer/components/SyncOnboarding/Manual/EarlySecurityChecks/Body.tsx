import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, Link, Flex, Text, IconsLegacy, InfiniteLoader } from "@ledgerhq/react-ui";
import { Bullet } from "./Bullet";
import { Status as SoftwareCheckStatus } from "../types";
import Animation from "~/renderer/animations";
import ConfettiLottie from "~/renderer/animations/common/confetti.json";

export type Props = {
  genuineCheckStatus: SoftwareCheckStatus;
  firmwareUpdateStatus: SoftwareCheckStatus;
  availableFirmwareVersion: string;
  modelName: string;
  updateSkippable?: boolean;
  loading?: boolean;
  onClickStartChecks: () => void;
  onClickWhyPerformSecurityChecks: () => void;
  onClickResumeGenuineCheck: () => void;
  onClickViewUpdate: () => void;
  onClickSkipUpdate: () => void;
  onClickContinueToSetup: () => void;
  onClickRetryUpdate: () => void;
};

const ConfettiAnimation = styled(Animation)`
  position: absolute;
  top: 80px;
  left: 30%;
  width: 40%;
  max-width: 100% !important;
  max-height: 100% !important;
  pointer-events: none;
`;

const SoftwareCheckContent = ({
  genuineCheckStatus,
  firmwareUpdateStatus,
  availableFirmwareVersion,
  modelName,
  updateSkippable,
  loading,
  onClickStartChecks,
  onClickWhyPerformSecurityChecks,
  onClickResumeGenuineCheck,
  onClickViewUpdate,
  onClickSkipUpdate,
  onClickRetryUpdate,
  onClickContinueToSetup,
}: Props) => {
  const { t } = useTranslation();
  return (
    <Flex flexDirection="column" alignContent="start" flexShrink={1} width={"432px"}>
      <Text variant="h4Inter" mb={12} whiteSpace="pre-wrap">
        {genuineCheckStatus === SoftwareCheckStatus.completed &&
        firmwareUpdateStatus === SoftwareCheckStatus.completed
          ? t("syncOnboarding.manual.softwareCheckContent.title.completed", { modelName })
          : t("syncOnboarding.manual.softwareCheckContent.title.active", { modelName })}
      </Text>
      <Bullet
        mb={8}
        bulletText="1"
        status={genuineCheckStatus}
        title={
          genuineCheckStatus === SoftwareCheckStatus.completed
            ? t("syncOnboarding.manual.softwareCheckContent.genuineCheck.title.completed", {
                modelName,
              })
            : genuineCheckStatus === SoftwareCheckStatus.cancelled
            ? t("syncOnboarding.manual.softwareCheckContent.genuineCheck.title.cancelled", {
                modelName,
              })
            : t("syncOnboarding.manual.softwareCheckContent.genuineCheck.title.active", {
                modelName,
              })
        }
        subtitle={
          genuineCheckStatus === SoftwareCheckStatus.completed
            ? undefined
            : genuineCheckStatus === SoftwareCheckStatus.cancelled
            ? t("syncOnboarding.manual.softwareCheckContent.genuineCheck.subtitle.cancelled", {
                modelName,
              })
            : t("syncOnboarding.manual.softwareCheckContent.genuineCheck.subtitle.active", {
                modelName,
              })
        }
      >
        {genuineCheckStatus === SoftwareCheckStatus.cancelled ? (
          <Button
            variant="main"
            size="small"
            outline={false}
            mr={6}
            onClick={onClickResumeGenuineCheck}
          >
            {t("syncOnboarding.manual.softwareCheckContent.genuineCheck.resumeCTA")}
          </Button>
        ) : null}
      </Bullet>
      <Bullet
        bulletText="2"
        status={firmwareUpdateStatus}
        title={
          firmwareUpdateStatus === SoftwareCheckStatus.completed
            ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.title.completed", {
                modelName,
              })
            : firmwareUpdateStatus === SoftwareCheckStatus.updateAvailable
            ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.title.updateAvailable", {
                modelName,
                firmwareVersion: availableFirmwareVersion,
              })
            : t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.title.active", {
                modelName,
              })
        }
        subtitle={
          firmwareUpdateStatus === SoftwareCheckStatus.completed
            ? undefined
            : firmwareUpdateStatus === SoftwareCheckStatus.updateAvailable
            ? t(
                "syncOnboarding.manual.softwareCheckContent.firmwareUpdate.subtitle.updateAvailable",
                {
                  modelName,
                },
              )
            : t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.subtitle.active", {
                modelName,
              })
        }
      >
        {firmwareUpdateStatus === SoftwareCheckStatus.updateAvailable ? (
          <Flex flexDirection="row" alignItems="center" columnGap={6}>
            <Button variant="main" size="medium" outline={false} onClick={onClickViewUpdate}>
              {updateSkippable
                ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.resumeUpdateCTA")
                : t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.viewUpdateCTA", {
                    modelName,
                  })}
            </Button>
            {updateSkippable ? (
              <Button
                variant="shade"
                size="medium"
                outline
                onClick={onClickSkipUpdate}
                Icon={loading ? InfiniteLoader : undefined}
              >
                {t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.skipUpdateCTA")}
              </Button>
            ) : null}
          </Flex>
        ) : firmwareUpdateStatus === SoftwareCheckStatus.failed ? (
          <Flex flexDirection="row" alignItems="center" columnGap={6}>
            <Button variant="main" size="small" outline={false} onClick={onClickRetryUpdate}>
              {t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.retryUpdateCTA")}
            </Button>
            <Button
              variant="shade"
              size="small"
              outline
              onClick={onClickSkipUpdate}
              Icon={loading ? InfiniteLoader : undefined}
            >
              {t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.skipUpdateCTA")}
            </Button>
          </Flex>
        ) : null}
      </Bullet>
      {genuineCheckStatus === SoftwareCheckStatus.inactive ? (
        <Flex flexDirection={"column"} mt={12} rowGap={12}>
          <Link
            Icon={IconsLegacy.ExternalLinkMedium}
            alignSelf={"flex-start"}
            iconPosition="right"
            onClick={onClickWhyPerformSecurityChecks}
          >
            {t("syncOnboarding.manual.softwareCheckContent.whyPerformChecksLink")}
          </Link>
          <Button onClick={onClickStartChecks} variant="main" size="large" outline={false}>
            {t("syncOnboarding.manual.softwareCheckContent.startChecksCTA", {
              modelName,
            })}
          </Button>
        </Flex>
      ) : null}
      {genuineCheckStatus === SoftwareCheckStatus.completed &&
      firmwareUpdateStatus === SoftwareCheckStatus.completed ? (
        <>
          <Flex flexDirection={"column"} mt={12} rowGap={12}>
            <Button
              onClick={onClickContinueToSetup}
              variant="main"
              size="large"
              outline={false}
              Icon={loading ? InfiniteLoader : IconsLegacy.ArrowRightMedium}
              iconPosition="right"
            >
              {t("syncOnboarding.manual.softwareCheckContent.continueCTA")}
            </Button>
          </Flex>
          <ConfettiAnimation animation={ConfettiLottie} loop={false} />
        </>
      ) : null}
    </Flex>
  );
};

export default SoftwareCheckContent;
