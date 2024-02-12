import React from "react";
import { Divider, Flex, VerticalTimeline, Text } from "@ledgerhq/react-ui";
import { useTranslation, Trans } from "react-i18next";
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
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText>
            {t("syncOnboarding.manual.seedContent.newSeedDescription1", {
              productName,
            })}
          </StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText mb={6}>
            <Trans i18nKey="syncOnboarding.manual.seedContent.newSeedDescription2">
              <Text fontWeight="bold" variant="body" color="neutral.c80">
                {""}
              </Text>
            </Trans>
          </StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText mb={6}>{t("syncOnboarding.manual.seedContent.newSeedDescription3")}</StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText mb={6}>{t("syncOnboarding.manual.seedContent.newSeedDescription4")}</StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText>{t("syncOnboarding.manual.seedContent.newSeedDescription5")}</StepText>
          <ContinueOnDeviceWithAnim
            deviceModelId={deviceModelId}
            text={t("syncOnboarding.manual.seedContent.newSeedContinueOnDevice", {
              productName,
            })}
          />
        </Flex>
      ) : seedPathStatus === "choice_restore_direct_or_recover" ? (
        <Flex flexDirection="column">
          {/* @ts-expect-error weird props issue with React 18 */}
          <VerticalTimeline.SubtitleText>
            {t("syncOnboarding.manual.seedContent.restoreChoiceSRPTitle")}
          </VerticalTimeline.SubtitleText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText>{t("syncOnboarding.manual.seedContent.restoreChoiceSRPDescription")}</StepText>
          <Divider text={t("common.or")} my={6} />
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
      ) : (
        <Flex flexDirection="column">
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText>
            {t("syncOnboarding.manual.seedContent.selection", {
              productName,
            })}
          </StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText mb={6}>
            <Trans
              i18nKey="syncOnboarding.manual.seedContent.selectionNewLedger"
              values={{ deviceName: productName }}
            >
              <Text fontWeight="bold" variant="body" color="neutral.c80">
                {""}
              </Text>
            </Trans>
          </StepText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText>
            <Trans
              i18nKey="syncOnboarding.manual.seedContent.selectionRestore"
              values={{ deviceName: productName }}
            >
              <Text fontWeight="bold" variant="body" color="neutral.c80">
                {""}
              </Text>
            </Trans>
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
