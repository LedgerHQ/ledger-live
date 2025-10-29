import React, { useCallback, useEffect } from "react";
import { Flex, VerticalTimeline, Link, Icons, ContinueOnDevice } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { StepText } from "../shared";
import SecretRecoveryPhrasePng from "../assets/secret-recovery-phrase.png";
import { trackPage, useTrack } from "~/renderer/analytics/segment";
import { CharonStatus } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { openURL } from "~/renderer/linking";
import Animation from "~/renderer/animations";
import CHARON from "~/renderer/animations/charon/charon.json";
import styled from "styled-components";

export type SeedPathStatus =
  | "choice_new_or_restore"
  | "new_seed"
  | "choice_restore_direct_or_recover"
  | "restore_seed"
  | "recover_seed"
  | "backup_charon"
  | "restore_charon";

export type Props = {
  seedPathStatus: SeedPathStatus;
  deviceName: string;
  deviceIcon: React.ComponentType<{ size: number; color?: string }>;
  charonSupported: boolean;
  charonStatus: CharonStatus | null;
};

const CHARON_LEARN_MORE_URL = "https://shop.ledger.com/products/ledger-recovery-key";

const SeedStep = ({
  seedPathStatus,
  deviceName: productName,
  deviceIcon,
  charonSupported,
  charonStatus,
}: Props) => {
  const { t } = useTranslation();
  const track = useTrack();

  const handleLearnMoreClick = useCallback(() => {
    track("button_clicked", {
      button: "Learn More",
      page: "Charon Start",
    });
    openURL(CHARON_LEARN_MORE_URL);
  }, [track]);

  const StyledAnimation = styled(Animation)`
    border-radius: 6.4px;
    box-shadow:
      0px 63.291px 50.633px 0px rgba(0, 0, 0, 0.19),
      0px 26.442px 21.153px 0px rgba(0, 0, 0, 0.14),
      0px 14.137px 11.31px 0px rgba(0, 0, 0, 0.11),
      0px 7.925px 6.34px 0px rgba(0, 0, 0, 0.09),
      0px 4.209px 3.367px 0px rgba(0, 0, 0, 0.08),
      0px 1.751px 1.401px 0px rgba(0, 0, 0, 0.05);
  `;

  useEffect(() => {
    if (seedPathStatus == "backup_charon" && charonSupported) {
      switch (charonStatus) {
        case CharonStatus.Choice:
          trackPage(`Set up ${productName}: Step 3 Charon Start`, undefined, null, true, true);
          return;
        case CharonStatus.Rejected:
          trackPage(
            `Set up ${productName}: Step 3 Charon Backup Rejected`,
            undefined,
            null,
            true,
            true,
          );
          return;
        case CharonStatus.Ready:
          trackPage(
            `Set up ${productName}: Step 3 Charon Backup Success`,
            undefined,
            null,
            true,
            true,
          );
          return;
        default:
          return;
      }
    }
  }, [seedPathStatus, charonSupported, charonStatus, track, productName]);

  return (
    <Flex flexDirection="column">
      {seedPathStatus === "new_seed" ? (
        <Flex flexDirection="column">
          <Flex alignItems="center" justifyContent="center" flexDirection="column">
            <Flex
              style={{
                width: 220,
                height: 150,
                overflow: "visible",
                justifyContent: "center",
              }}
            >
              <img
                src={SecretRecoveryPhrasePng}
                alt="Secret Recovery Phrase"
                style={{ height: 220, objectFit: "contain" }}
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
          <ContinueOnDevice
            Icon={deviceIcon}
            text={t("syncOnboarding.manual.seedContent.selectionNewSeedContinueOnDevice", {
              productName,
            })}
          />
        </Flex>
      ) : seedPathStatus === "choice_restore_direct_or_recover" ? (
        <Flex flexDirection="column">
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText mb={6}>{t("syncOnboarding.manual.seedContent.restoreDescription")}</StepText>

          <Flex mb={8}>
            <Icons.Note size="M" color="white" />
            <Flex ml={5} flexDirection="column" flex={1}>
              {/* @ts-expect-error weird props issue with React 18 */}
              <VerticalTimeline.SubtitleText mb={2}>
                {t("syncOnboarding.manual.seedContent.restoreChoiceSRPTitle")}
              </VerticalTimeline.SubtitleText>
              {/* @ts-expect-error weird props issue with React 18 */}
              <StepText>
                {t("syncOnboarding.manual.seedContent.restoreChoiceSRPDescription")}
              </StepText>
            </Flex>
          </Flex>
          {charonSupported && (
            <Flex mb={8}>
              <Icons.RecoveryKey size="M" color="white" />

              <Flex ml={5} flexDirection="column" flex={1}>
                {/* @ts-expect-error weird props issue with React 18 */}
                <VerticalTimeline.SubtitleText mb={2}>
                  {t("syncOnboarding.manual.seedContent.restoreChoiceCharonTitle")}
                </VerticalTimeline.SubtitleText>
                {/* @ts-expect-error weird props issue with React 18 */}
                <StepText>
                  {t("syncOnboarding.manual.seedContent.restoreChoiceCharonDescription")}
                </StepText>
              </Flex>
            </Flex>
          )}

          <Flex mb={0}>
            <Icons.ShieldCheck size="M" color="white" />

            <Flex ml={5} flexDirection="column" flex={1}>
              {/* @ts-expect-error weird props issue with React 18 */}
              <VerticalTimeline.SubtitleText mb={2}>
                {t("syncOnboarding.manual.seedContent.restoreChoiceRecoverTitle")}
              </VerticalTimeline.SubtitleText>
              {/* @ts-expect-error weird props issue with React 18 */}
              <StepText>
                {t("syncOnboarding.manual.seedContent.restoreChoiceRecoverDescription")}
              </StepText>
            </Flex>
          </Flex>
          <ContinueOnDevice
            Icon={deviceIcon}
            text={t("syncOnboarding.manual.seedContent.restoreChoiceContinueOnDevice", {
              productName,
            })}
          />
        </Flex>
      ) : seedPathStatus === "restore_seed" ? (
        <>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText>{t("syncOnboarding.manual.seedContent.restoreSeed", { productName })}</StepText>
          <ContinueOnDevice
            Icon={deviceIcon}
            text={t("syncOnboarding.manual.seedContent.followInstructions", { productName })}
          />
        </>
      ) : seedPathStatus === "recover_seed" ? (
        // @ts-expect-error props issue with React 18
        <StepText>{t("syncOnboarding.manual.seedContent.recoverSeed")}</StepText>
      ) : seedPathStatus === "backup_charon" ? (
        <Flex flexDirection="column">
          <Flex alignItems="center" justifyContent="center" flexDirection="column">
            <Flex
              style={{
                height: 108,
                overflow: "visible",
                justifyContent: "center",
                paddingTop: 8,
                marginBottom: 24,
              }}
            >
              <StyledAnimation animation={CHARON as object} />
            </Flex>
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText mb={24} fontWeight="semiBold" variant="largeLineHeight" color="neutral.c100">
              {t("syncOnboarding.manual.seedContent.backupCharonTitle")}
            </StepText>
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText mb={24} textAlign="center">
              {t("syncOnboarding.manual.seedContent.backupCharonDescription")}
            </StepText>
            <Flex flexDirection="column" color="neutral.c100" mb={24}>
              <Link
                alwaysUnderline
                Icon={() => <Icons.ExternalLink size="S" />}
                onClick={handleLearnMoreClick}
                style={{ justifyContent: "flex-start" }}
                textProps={{ fontSize: 14 }}
              >
                {t("syncOnboarding.manual.seedContent.backupCharonCta")}
              </Link>
            </Flex>
          </Flex>

          <ContinueOnDevice
            Icon={deviceIcon}
            text={t("syncOnboarding.manual.seedContent.backupCharonContinueOnDevice", {
              productName,
            })}
          />
        </Flex>
      ) : seedPathStatus === "restore_charon" ? (
        <Flex flexDirection="column">
          {/* @ts-expect-error weird props issue with React 18 */}
          <VerticalTimeline.SubtitleText>
            {t("syncOnboarding.manual.seedContent.restoreCharonTitle")}
          </VerticalTimeline.SubtitleText>
          {/* @ts-expect-error weird props issue with React 18 */}
          <StepText>{t("syncOnboarding.manual.seedContent.restoreCharonDescription")}</StepText>
          <ContinueOnDevice
            Icon={deviceIcon}
            text={t("syncOnboarding.manual.seedContent.restoreCharonContinueOnDevice", {
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
          <StepText>
            {charonSupported
              ? t("syncOnboarding.manual.seedContent.selectionRestoreDescriptionWithCharon")
              : t("syncOnboarding.manual.seedContent.selectionRestoreDescription")}
          </StepText>
          <ContinueOnDevice
            Icon={deviceIcon}
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
