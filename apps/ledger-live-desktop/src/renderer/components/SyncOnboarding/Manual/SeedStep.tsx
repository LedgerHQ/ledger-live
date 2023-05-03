import React from "react";
import { Divider, Flex, VerticalTimeline } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { StepText } from "./shared";
import ContinueOnDeviceWithAnim from "./ContinueOnDeviceWithAnim";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";

export type SeedPathStatus =
  | "choice_new_or_restore"
  | "new_seed"
  | "choice_restore_direct_or_recover"
  | "restore_seed"
  | "recover_seed";

export type Props = {
  seedPathStatus: SeedPathStatus;
  deviceModelId: DeviceModelId;
};

const SeedStep = ({ seedPathStatus, deviceModelId }: Props) => {
  const { t } = useTranslation();
  const productName = getDeviceModel(deviceModelId).productName;

  return (
    <Flex flexDirection="column">
      {seedPathStatus === "new_seed" ? (
        <Flex flexDirection="column">
          <StepText>
            {t("syncOnboarding.manual.seedContent.newSeedDescription", {
              productName,
            })}
          </StepText>
          <ContinueOnDeviceWithAnim
            deviceModelId={deviceModelId}
            text={t("syncOnboarding.manual.seedContent.newSeedContinueOnDevice", {
              productName,
            })}
          />
        </Flex>
      ) : seedPathStatus === "choice_restore_direct_or_recover" ? (
        <Flex flexDirection="column">
          <VerticalTimeline.SubtitleText>
            {t("syncOnboarding.manual.seedContent.restoreChoiceSRPTitle")}
          </VerticalTimeline.SubtitleText>
          <StepText>{t("syncOnboarding.manual.seedContent.restoreChoiceSRPDescription")}</StepText>
          <Divider text={t("common.or")} my={6} />
          <VerticalTimeline.SubtitleText>
            {t("syncOnboarding.manual.seedContent.restoreChoiceRecoverTitle")}
          </VerticalTimeline.SubtitleText>
          <StepText>
            {t("syncOnboarding.manual.seedContent.restoreChoiceRecoverDescription")}
          </StepText>
          <ContinueOnDeviceWithAnim
            deviceModelId={deviceModelId}
            text={t("syncOnboarding.manual.seedContent.restoreChoiceContinueOnDevice", {
              productName,
            })}
          />
        </Flex>
      ) : seedPathStatus === "restore_seed" ? (
        <>
          <StepText>{t("syncOnboarding.manual.seedContent.restoreSeed", { productName })}</StepText>
          <ContinueOnDeviceWithAnim
            deviceModelId={deviceModelId}
            text={t("syncOnboarding.manual.continueOnDevice", { productName })}
          />
        </>
      ) : seedPathStatus === "recover_seed" ? (
        <StepText>{t("syncOnboarding.manual.seedContent.recoverSeed")}</StepText>
      ) : (
        <Flex flexDirection="column">
          <StepText>
            {t("syncOnboarding.manual.seedContent.selection", {
              productName,
            })}
          </StepText>
          <ContinueOnDeviceWithAnim
            deviceModelId={deviceModelId}
            text={t("syncOnboarding.manual.seedContent.selectionContinueOnDevice", {
              productName,
            })}
          />
        </Flex>
      )}
    </Flex>
  );
};

export default SeedStep;
