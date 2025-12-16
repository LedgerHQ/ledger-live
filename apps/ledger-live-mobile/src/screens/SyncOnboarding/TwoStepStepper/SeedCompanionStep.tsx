import React, { useCallback } from "react";
import { OnboardingState, CharonStatus } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { Flex, Link, Text, VerticalTimeline } from "@ledgerhq/native-ui";
import { TrackScreen, useTrack } from "~/analytics";
import { Image, Linking } from "react-native";
import SecretRecoveryPhraseImage from "../assets/srp.png";
import ContinueOnDeviceWithAnim from "./ContinueOnDeviceWithAnim";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTranslation } from "react-i18next";
import {
  ExternalLinkMedium,
  RecoveryKey,
  Note,
  ShieldCheck,
} from "@ledgerhq/native-ui/assets/icons";
import { ShadowedView } from "react-native-fast-shadow";
import Animation from "~/components/Animation";
import { useLottieAsset } from "~/utils/lottieAsset";

const charonAsset = require("~/animations/device/charon/charon.lottie.json");
import { SeedPathStatus } from "./types";

const { BodyText, SubtitleText } = VerticalTimeline;

const CHARON_LEARN_MORE_URL = "https://shop.ledger.com/products/ledger-recovery-key";

interface SeedCompanionStepProps {
  seedPathStatus: SeedPathStatus;
  charonSupported?: OnboardingState["charonSupported"];
  charonStatus?: OnboardingState["charonStatus"];
  productName: string;
  device: Device;
}

const SeedStep = ({
  seedPathStatus,
  charonSupported,
  charonStatus,
  productName,
  device,
}: SeedCompanionStepProps) => {
  const { t } = useTranslation();
  const track = useTrack();
  const CHARON = useLottieAsset(charonAsset);

  const handleLearnMoreClick = useCallback(() => {
    track("button_clicked", {
      button: "Learn More",
      page: "Charon Start",
      flow: "onboarding",
    });
    Linking.openURL(CHARON_LEARN_MORE_URL);
  }, [track]);

  if (seedPathStatus === "new_seed") {
    return (
      <Flex pb={1}>
        <Flex alignItems="center" justifyContent="center">
          <Flex style={{ overflow: "visible", height: 150 }}>
            <Image source={SecretRecoveryPhraseImage} height={200} />
          </Flex>
          <Text variant="h5" fontWeight="semiBold" mb={6}>
            {t("syncOnboarding.seedStep.newSeedTitle")}
          </Text>
          <BodyText mb={2} textAlign="center">
            {t("syncOnboarding.seedStep.newSeedDescription")}
          </BodyText>
        </Flex>

        <ContinueOnDeviceWithAnim
          deviceModelId={device.modelId}
          text={t("syncOnboarding.seedStep.newSeedContinueOnDevice", {
            productName,
          })}
        />
      </Flex>
    );
  }

  if (seedPathStatus === "choice_restore_direct_or_recover") {
    return (
      <Flex>
        <BodyText color="neutral.c80">
          {t("syncOnboarding.seedStep.selectionRestoreChoice.description")}
        </BodyText>
        {/* Secret Recovery Phrase */}
        <Flex flexDirection="row" mt={6}>
          <Note size="M" />
          <Flex ml={5} flex={1}>
            <SubtitleText mb={2}>
              {t("syncOnboarding.seedStep.selectionRestoreChoice.secretRecoveryPhrase.title")}
            </SubtitleText>
            <BodyText>
              {t("syncOnboarding.seedStep.selectionRestoreChoice.secretRecoveryPhrase.description")}
            </BodyText>
          </Flex>
        </Flex>
        {/* Recovery Key */}
        {charonSupported && (
          <Flex flexDirection="row" mt={6}>
            <RecoveryKey size="M" />
            <Flex ml={5} flex={1}>
              <SubtitleText mb={2}>
                {t("syncOnboarding.seedStep.selectionRestoreChoice.ledgerCharon.title")}
              </SubtitleText>
              <BodyText>
                {t("syncOnboarding.seedStep.selectionRestoreChoice.ledgerCharon.description")}
              </BodyText>
            </Flex>
          </Flex>
        )}
        {/* Recover subscription */}
        <Flex flexDirection="row" mt={6} mb={6}>
          <ShieldCheck size="M" />
          <Flex ml={5} flex={1}>
            <SubtitleText mb={2}>
              {t("syncOnboarding.seedStep.selectionRestoreChoice.ledgerRecover.title")}
            </SubtitleText>
            <BodyText>
              {t("syncOnboarding.seedStep.selectionRestoreChoice.ledgerRecover.description")}
            </BodyText>
          </Flex>
        </Flex>
        <ContinueOnDeviceWithAnim
          deviceModelId={device.modelId}
          text={t("syncOnboarding.seedStep.selectionRestoreChoice.continueOnDevice", {
            productName,
          })}
        />
      </Flex>
    );
  }

  if (seedPathStatus === "restore_seed") {
    return (
      <Flex>
        <SubtitleText>{t("syncOnboarding.seedStep.restoreSeed.title")}</SubtitleText>
        <BodyText>{t("syncOnboarding.seedStep.restoreSeed.description")}</BodyText>
        <ContinueOnDeviceWithAnim
          deviceModelId={device.modelId}
          text={t("syncOnboarding.seedStep.restoreSeed.continueOnDevice", {
            productName,
          })}
        />
      </Flex>
    );
  }

  if (seedPathStatus === "recover_seed") {
    <BodyText>{t("syncOnboarding.seedStep.recoverSeed")}</BodyText>;
  }

  if (seedPathStatus === "backup_charon") {
    return (
      <Flex>
        {charonStatus === CharonStatus.Choice && (
          <TrackScreen category="Set up device: Step 3 Charon Start" flow="onboarding" />
        )}
        {charonStatus === CharonStatus.Rejected && (
          <TrackScreen category="Set up device: Step 3 Charon Backup Rejected" flow="onboarding" />
        )}
        {charonStatus === CharonStatus.Ready && (
          <TrackScreen category="Set up device: Step 3 Charon Backup Success" flow="onboarding" />
        )}
        <Flex alignItems="center" justifyContent="center">
          <Flex style={{ overflow: "visible", height: 100 }} mt={16} mb={24}>
            <ShadowedView
              style={{
                shadowOpacity: 0.15,
                shadowRadius: 35.633,
                shadowOffset: {
                  width: 0,
                  height: 53.291,
                },
              }}
            >
              <ShadowedView
                style={{
                  shadowOpacity: 0.14,
                  shadowRadius: 21.153,
                  shadowOffset: {
                    width: 0,
                    height: 26.442,
                  },
                }}
              >
                <ShadowedView
                  style={{
                    shadowOpacity: 0.11,
                    shadowRadius: 11.31,
                    shadowOffset: {
                      width: 0,
                      height: 14.137,
                    },
                  }}
                >
                  <ShadowedView
                    style={{
                      shadowOpacity: 0.09,
                      shadowRadius: 6.34,
                      shadowOffset: {
                        width: 0,
                        height: 7.925,
                      },
                    }}
                  >
                    <ShadowedView
                      style={{
                        shadowOpacity: 0.08,
                        shadowRadius: 3.367,
                        shadowOffset: {
                          width: 0,
                          height: 4.209,
                        },
                      }}
                    >
                      <ShadowedView
                        style={{
                          shadowOpacity: 0.05,
                          shadowRadius: 1.401,
                          shadowOffset: {
                            width: 0,
                            height: 1.751,
                          },
                        }}
                      >
                        <Animation style={{ height: 100 }} source={CHARON} />
                      </ShadowedView>
                    </ShadowedView>
                  </ShadowedView>
                </ShadowedView>
              </ShadowedView>
            </ShadowedView>
          </Flex>
          <Text variant="h5" fontWeight="semiBold" mb={24}>
            {t("syncOnboarding.seedStep.backupCharon.title")}
          </Text>
          <BodyText mb={24} textAlign="center">
            {t("syncOnboarding.seedStep.backupCharon.desc")}
          </BodyText>
        </Flex>
        <Flex mb={6} width="100%" justifyContent="center" alignItems="center">
          <Link
            Icon={ExternalLinkMedium}
            onPress={handleLearnMoreClick}
            style={{ justifyContent: "flex-start" }}
          >
            {t("syncOnboarding.seedStep.backupCharon.cta")}
          </Link>
        </Flex>
        <ContinueOnDeviceWithAnim
          deviceModelId={device.modelId}
          text={t("syncOnboarding.seedStep.backupCharon.continueOnDevice", {
            productName,
          })}
        />
      </Flex>
    );
  }

  if (seedPathStatus === "restore_charon") {
    return (
      <Flex>
        <SubtitleText>{t("syncOnboarding.seedStep.restoreLedgerCharon.title")}</SubtitleText>
        <BodyText>{t("syncOnboarding.seedStep.restoreLedgerCharon.description")}</BodyText>
        <ContinueOnDeviceWithAnim
          deviceModelId={device.modelId}
          text={t("syncOnboarding.seedStep.restoreLedgerCharon.continueOnDevice", {
            productName,
          })}
        />
      </Flex>
    );
  }

  return (
    <Flex>
      <BodyText color="neutral.c80">
        {t("syncOnboarding.seedStep.selection", {
          productName,
        })}
      </BodyText>

      <Flex mt={6}>
        <Text color="neutral.c100" fontWeight="semiBold" mb={3}>
          {t("syncOnboarding.seedStep.selectionNewLedger.title")}
        </Text>
        <Text color="neutral.c80">{t("syncOnboarding.seedStep.selectionNewLedger.desc")}</Text>
      </Flex>
      <Flex my={6}>
        <Text color="neutral.c100" fontWeight="semiBold" mb={3}>
          {t("syncOnboarding.seedStep.selectionRestore.title")}
        </Text>
        <Text color="neutral.c80">
          {charonSupported
            ? t("syncOnboarding.seedStep.selectionRestore.descWithCharon")
            : t("syncOnboarding.seedStep.selectionRestore.desc")}
        </Text>
      </Flex>
      <ContinueOnDeviceWithAnim
        deviceModelId={device.modelId}
        text={t("syncOnboarding.seedStep.selectionContinueOnDevice", {
          productName,
        })}
      />
    </Flex>
  );
};

const SeedCompanionStep = (props: SeedCompanionStepProps) => {
  return (
    <Flex>
      <TrackScreen category={"Set up device: Step 3 Seed Intro"} flow="onboarding" />
      <SeedStep {...props} />
    </Flex>
  );
};

export default SeedCompanionStep;
