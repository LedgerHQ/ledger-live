import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import { Alert, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import type { Account } from "@ledgerhq/types-live";
import React from "react";
import { Trans, useTranslation } from "~/context/Locale";
import { ErrorSection } from "./ErrorSection";
import { OnboardLayout } from "./OnboardLayout";

export interface ContentSectionViewModel {
  readonly displayStatus: OnboardStatus | AuthorizeStatus;
  readonly showError: boolean;
  readonly successKey: string;
  readonly statusTranslationKey: string;
}

interface ContentSectionProps {
  readonly status: {
    readonly onboarding: OnboardStatus;
    readonly authorize: AuthorizeStatus;
    readonly isProcessing: boolean;
    readonly hasResult: boolean;
  };
  readonly accounts: {
    readonly toDisplay: Account[];
    readonly selectedIds: string[];
    readonly isReonboarding: boolean;
  };
  readonly error: Error | null;
  readonly onRetry: () => void;
  readonly viewModel: ContentSectionViewModel;
}

export function ContentSection({
  status,
  accounts,
  error,
  onRetry,
  viewModel,
}: ContentSectionProps) {
  const { t } = useTranslation();
  const { isProcessing } = status;
  const { toDisplay: accountsToDisplay, selectedIds, isReonboarding } = accounts;

  return (
    <OnboardLayout
      accounts={accountsToDisplay}
      selectedIds={selectedIds}
      isReonboarding={isReonboarding}
    >
      {isReonboarding && (
        <Flex mx={6} mt={8}>
          <Alert type="warning">
            <Flex flexDirection="column" rowGap={4} flex={1} flexShrink={1}>
              <Text
                variant="bodyLineHeight"
                fontWeight="semiBold"
                color="neutral.c100"
                flexShrink={1}
              >
                {t("canton.onboard.reonboard.warning.title")}
              </Text>
              <Text variant="body" color="neutral.c100" flexShrink={1}>
                {t("canton.onboard.reonboard.warning.description")}
              </Text>
            </Flex>
          </Alert>
        </Flex>
      )}

      {viewModel.displayStatus === OnboardStatus.SUCCESS && (
        <Flex mx={6} mt={8}>
          <Alert type="success">
            <Trans i18nKey={viewModel.successKey} />
          </Alert>
        </Flex>
      )}

      {viewModel.showError && (
        <ErrorSection error={error} disabled={isProcessing} onRetry={onRetry} />
      )}

      {!viewModel.showError &&
        viewModel.displayStatus !== OnboardStatus.INIT &&
        viewModel.displayStatus !== OnboardStatus.SUCCESS && (
          <Flex flexDirection="row" alignItems="center" px={4} py={6} mx={6} my={4}>
            <InfiniteLoader size={16} />
            <Text ml={4}>
              <Trans i18nKey={viewModel.statusTranslationKey} />
            </Text>
          </Flex>
        )}
    </OnboardLayout>
  );
}
