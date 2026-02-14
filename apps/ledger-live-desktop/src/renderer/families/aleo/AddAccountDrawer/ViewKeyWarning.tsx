import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { Flex, Link, Text } from "@ledgerhq/react-ui";
import { urls } from "~/config/urls";
import BulletRow from "~/renderer/components/BulletRow";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { modularDrawerSourceSelector } from "~/renderer/reducers/modularDrawer";
import { ADD_ACCOUNT_FLOW_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import { ActionButtons } from "LLD/features/AddAccountDrawer/screens/AccountsWarning/components";
import { useSelector } from "LLD/hooks/redux";
import { AleoTrackAddAccountScreen } from "./analytics/AleoTrackAddAccountScreen";
import { ALEO_ADD_ACCOUNT_PAGE_NAME } from "./analytics/addAccount.types";

interface Props {
  onAllow: () => void;
  onCancel: () => void;
}

const bulletPointTranslationKeys = [
  "aleo.addAccount.stepViewKeyWarning.bullets.0",
  "aleo.addAccount.stepViewKeyWarning.bullets.1",
  "aleo.addAccount.stepViewKeyWarning.bullets.2",
  "aleo.addAccount.stepViewKeyWarning.bullets.3",
  "aleo.addAccount.stepViewKeyWarning.bullets.4",
];

export function ViewKeyWarning({ onAllow, onCancel }: Props) {
  const source = useSelector(modularDrawerSourceSelector);
  const { t } = useTranslation();
  const viewKeyLearnMoreUrl = useLocalizedUrl(urls.aleo.viewKeyLearnMore);

  return (
    <>
      <AleoTrackAddAccountScreen
        page={ALEO_ADD_ACCOUNT_PAGE_NAME.VIEW_KEY_WARNING}
        source={source}
        flow={ADD_ACCOUNT_FLOW_NAME}
      />
      <Flex
        flexDirection="column"
        height="100%"
        alignItems="center"
        data-testid="view-key-warning-step"
      >
        <Flex flexDirection="column" alignItems="center" flexShrink={0} width={420}>
          <Text
            fontSize={24}
            textAlign="center"
            fontWeight="semiBold"
            color="palette.text.shade100"
            mb={4}
          >
            <Trans i18nKey="aleo.addAccount.stepViewKeyWarning.title" />
          </Text>
          <Text mb={6} fontSize={14} color="neutral.c70" lineHeight="20px" textAlign="left">
            <Trans i18nKey="aleo.addAccount.stepViewKeyWarning.description">
              <Link
                data-testid="learn-more-link"
                color="primary.c80"
                textProps={{ fontWeight: "medium" }}
                onClick={() => openURL(viewKeyLearnMoreUrl)}
              />
            </Trans>
          </Text>
          <Flex flexDirection="column" alignItems="flex-start" width="100%" mb={6}>
            {bulletPointTranslationKeys.map(i18nKey => (
              <BulletRow
                key={i18nKey}
                step={{
                  icon: (
                    <Flex marginTop="7px" justifyContent="center">
                      <Flex backgroundColor="neutral.c70" borderRadius="50%" width={6} height={6} />
                    </Flex>
                  ),
                  desc: (
                    <Text fontSize={14} color="neutral.c70" lineHeight="20px" flex={1}>
                      <Trans i18nKey={i18nKey}>
                        <Text as="span" fontWeight="semiBold" color="neutral.c70" />
                      </Trans>
                    </Text>
                  ),
                }}
              />
            ))}
          </Flex>
        </Flex>
        <ActionButtons
          primaryAction={{
            text: t("aleo.addAccount.stepViewKeyWarning.cta.allow"),
            onClick: onAllow,
          }}
          secondaryAction={{
            text: t("aleo.addAccount.stepViewKeyWarning.cta.cancel"),
            onClick: onCancel,
          }}
        />
      </Flex>
    </>
  );
}
