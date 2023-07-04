import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Link, Flex, Text, Icons } from "@ledgerhq/react-ui";
import { Bullet } from "./Bullet";
import { Status as SoftwareCheckStatus } from "./types";

export type Props = {
  genuineCheckStatus: SoftwareCheckStatus;
  firmwareUpdateStatus: SoftwareCheckStatus;
  availableFirmwareVersion: string;
  modelName: string;
  onClickStartChecks: () => void;
  onClickWhyPerformSecurityChecks: () => void;
  onClickResumeGenuineCheck: () => void;
  onClickViewUpdate: () => void;
  onClickContinueToSetup: () => void;
};

const SoftwareCheckContent = ({
  genuineCheckStatus,
  firmwareUpdateStatus,
  availableFirmwareVersion,
  modelName,
  onClickStartChecks,
  onClickWhyPerformSecurityChecks,
  onClickResumeGenuineCheck,
  onClickViewUpdate,
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
        {firmwareUpdateStatus === SoftwareCheckStatus.updateAvailable && (
          <Button variant="main" size="small" outline={false} mr={6} onClick={onClickViewUpdate}>
            {t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.viewUpdate")}
          </Button>
        )}
      </Bullet>
      {genuineCheckStatus === SoftwareCheckStatus.inactive ||
      genuineCheckStatus === SoftwareCheckStatus.requested ? (
        <Flex flexDirection={"column"} mt={12} rowGap={12}>
          <Link
            Icon={Icons.ExternalLinkMedium}
            alignSelf={"flex-start"}
            iconPosition="right"
            onClick={onClickWhyPerformSecurityChecks}
          >
            {t("syncOnboarding.manual.softwareCheckContent.whyPerformChecksLink")}
          </Link>
          <Button onClick={onClickStartChecks} variant="main" size="large" outline={false}>
            {t("syncOnboarding.manual.softwareCheckContent.startChecksCTA")}
          </Button>
        </Flex>
      ) : null}
      {genuineCheckStatus === SoftwareCheckStatus.completed &&
      firmwareUpdateStatus === SoftwareCheckStatus.completed ? (
        <Flex flexDirection={"column"} mt={12} rowGap={12}>
          <Button
            onClick={onClickContinueToSetup}
            variant="main"
            size="large"
            outline={false}
            Icon={Icons.ArrowRightMedium}
            iconPosition="right"
          >
            {t("syncOnboarding.manual.softwareCheckContent.continueCTA")}
          </Button>
        </Flex>
      ) : null}
    </Flex>
  );
};

export default SoftwareCheckContent;
