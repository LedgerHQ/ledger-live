import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Flex, Link, Icons, ContinueOnDevice } from "@ledgerhq/react-ui";
import StepText from "LLD/features/Onboarding/components/StepText";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import Animation from "~/renderer/animations";
import CHARON from "~/renderer/animations/charon/charon.json";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import SeedStepWrapper from "./SeedStepWrapper";

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

const LinkIcon = () => <Icons.ExternalLink size="S" />;

export type Props = {
  productName: string;
  deviceIcon: React.ComponentType<{ size: number; color?: string }>;
};

const BackupCharonStep = ({ productName, deviceIcon }: Props) => {
  const { t } = useTranslation();
  const charonLearnMoreUrl = useLocalizedUrl(urls.charonLearnMore);

  const handleLearnMoreClick = useCallback(() => {
    track("button_clicked", {
      button: "Learn More",
      page: "Charon Start",
    });
    openURL(charonLearnMoreUrl);
  }, [charonLearnMoreUrl]);

  return (
    <SeedStepWrapper testId="backup-charon-step">
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
              Icon={LinkIcon}
              onClick={handleLearnMoreClick}
              style={{ justifyContent: "flex-start" }}
              textProps={{ fontSize: 14 }}
              data-testid="learn-more-link"
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
    </SeedStepWrapper>
  );
};

export default BackupCharonStep;
