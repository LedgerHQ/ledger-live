import React from "react";
import { Flex, VerticalTimeline, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { StepText } from "./shared";
import ContinueOnDeviceWithAnim from "./ContinueOnDeviceWithAnim";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
import ExternalLink from "~/renderer/components/ExternalLink";
import RecoveryKeyPng from "./assets/recovery-key.png";
import SecretRecoveryPhrasePng from "./assets/secret-recovery-phrase.png";

export type SeedPathStatus =
  | "choice_new_or_restore"
  | "new_seed"
  | "choice_restore_direct_or_recover"
  | "restore_seed"
  | "recover_seed"
  | "backup_recovery_key"
  | "restore_recovery_key";

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
          <Flex alignItems="center" justifyContent="center" flexDirection="column">
            <Flex style={{ width: 220, height: 170, overflow: "visible" }}>
              <img
                src={SecretRecoveryPhrasePng}
                alt="Secret Recovery Phrase"
                style={{ width: 220, height: 220 }}
              />
            </Flex>
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText
              mb={6}
              fontWeight="semiBold"
              variant="largeLineHeight"
              color="neutral.c100"
              textAlign="center"
            >
              {t("syncOnboarding.manual.seedContent.selectionNewSeedTitle")}
            </StepText>
            {/* @ts-expect-error weird props issue with React 18 */}
            <VerticalTimeline.SubtitleText textAlign="center">
              {t("syncOnboarding.manual.seedContent.selectionNewSeedSubtitle")}
            </VerticalTimeline.SubtitleText>
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText mb={6} justifyContent={"center"} textAlign="center">
              {t("syncOnboarding.manual.seedContent.selectionNewSeedDescription")}
            </StepText>
          </Flex>
          <ContinueOnDeviceWithAnim
            deviceModelId={deviceModelId}
            text={t("syncOnboarding.manual.seedContent.selectionNewSeedContinueOnDevice", {
              productName,
            })}
          />
        </Flex>
      ) : seedPathStatus === "choice_restore_direct_or_recover" ? (
        <Flex flexDirection="column">
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText mb={6}>{t("syncOnboarding.manual.seedContent.restoreDescription")}</StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <VerticalTimeline.SubtitleText>
            {t("syncOnboarding.manual.seedContent.restoreChoiceSRPTitle")}
          </VerticalTimeline.SubtitleText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText mb={6}>
            {t("syncOnboarding.manual.seedContent.restoreChoiceSRPDescription")}
          </StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <VerticalTimeline.SubtitleText>
            {t("syncOnboarding.manual.seedContent.restoreChoiceRecoveryKeyTitle")}
          </VerticalTimeline.SubtitleText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText mb={6}>
            {t("syncOnboarding.manual.seedContent.restoreChoiceRecoveryKeyDescription")}
          </StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <VerticalTimeline.SubtitleText>
            {t("syncOnboarding.manual.seedContent.restoreChoiceRecoverTitle")}
          </VerticalTimeline.SubtitleText>
          {/* @ts-expect-error weird props issue with React 18 */}
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
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText>{t("syncOnboarding.manual.seedContent.restoreSeed", { productName })}</StepText>
          <ContinueOnDeviceWithAnim
            deviceModelId={deviceModelId}
            text={t("syncOnboarding.manual.seedContent.followInstructions", { productName })}
          />
        </>
      ) : seedPathStatus === "recover_seed" ? (
        // @ts-expect-error props issue with React 18
        <StepText>{t("syncOnboarding.manual.seedContent.recoverSeed")}</StepText>
      ) : seedPathStatus === "backup_recovery_key" ? (
        <Flex flexDirection="column">
          <Flex alignItems="center" justifyContent="center" flexDirection="column">
            <Flex style={{ width: 220, height: 170, overflow: "visible" }}>
              <img src={RecoveryKeyPng} alt="Recovery Key" style={{ width: 220, height: 220 }} />
            </Flex>
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText mb={6} fontWeight="semiBold" variant="largeLineHeight" color="neutral.c100">
              {t("syncOnboarding.manual.seedContent.backupRecoveryKeyTitle")}
            </StepText>
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText mb={6}>
              {t("syncOnboarding.manual.seedContent.backupRecoveryKeyDescription")}
            </StepText>

            <Flex flexDirection="column" color="neutral.c100" mb={6}>
              <ExternalLink
                label={
                  <Text fontWeight="bold" variant="body" color="neutral.c80">
                    {t("syncOnboarding.manual.seedContent.backupRecoveryKeyCta")}
                  </Text>
                }
                onClick={() => {}} // TODO: Add link
                isInternal={false}
              />
            </Flex>
          </Flex>

          <ContinueOnDeviceWithAnim
            deviceModelId={deviceModelId}
            text={t("syncOnboarding.manual.seedContent.backupRecoveryKeyContinueOnDevice", {
              productName,
            })}
          />
        </Flex>
      ) : seedPathStatus === "restore_recovery_key" ? (
        <Flex flexDirection="column">
          {/* @ts-expect-error weird props issue with React 18 */}
          <VerticalTimeline.SubtitleText>
            {t("syncOnboarding.manual.seedContent.restoreRecoveryKeyTitle")}
          </VerticalTimeline.SubtitleText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText>
            {t("syncOnboarding.manual.seedContent.restoreRecoveryKeyDescription")}
          </StepText>
          <ContinueOnDeviceWithAnim
            deviceModelId={deviceModelId}
            text={t("syncOnboarding.manual.seedContent.restoreRecoveryKeyContinueOnDevice", {
              productName,
            })}
          />
        </Flex>
      ) : (
        <Flex flexDirection="column">
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText mb={6}>
            {t("syncOnboarding.manual.seedContent.selection", {
              productName,
            })}
          </StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <VerticalTimeline.SubtitleText>
            {t("syncOnboarding.manual.seedContent.selectionNewLedgerTitle")}
          </VerticalTimeline.SubtitleText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText mb={6}>
            {t("syncOnboarding.manual.seedContent.selectionNewLedgerDescription")}
          </StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <VerticalTimeline.SubtitleText>
            {t("syncOnboarding.manual.seedContent.selectionRestoreTitle")}
          </VerticalTimeline.SubtitleText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText>{t("syncOnboarding.manual.seedContent.selectionRestoreDescription")}</StepText>
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
