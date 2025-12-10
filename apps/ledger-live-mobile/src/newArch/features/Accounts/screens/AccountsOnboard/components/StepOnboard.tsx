import { Alert, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import SelectableAccountsList from "~/components/SelectableAccountsList";
import { AccountOnboardStatus, DynamicStepProps, StableStepProps } from "../types";

export default function StepOnboard({
  creatableAccount,
  importableAccounts,
  onboardingConfig,
  isReonboarding,
  onboardingStatus,
  error,
  isProcessing,
}: StableStepProps & DynamicStepProps) {
  const link = useLocalizedUrl(onboardingConfig?.urls.learnMore || "");

  const handleLearnMore = useCallback(() => {
    if (link) {
      Linking.openURL(link);
    }
  }, [link]);

  const accountsToDisplay = useMemo(() => {
    if (isReonboarding && creatableAccount) {
      return [creatableAccount];
    }
    return [...importableAccounts, creatableAccount].filter(Boolean);
  }, [isReonboarding, creatableAccount, importableAccounts]);

  const selectedIds = useMemo(() => accountsToDisplay.map(a => a.id), [accountsToDisplay]);

  const isSuccess = onboardingStatus === AccountOnboardStatus.SUCCESS;
  const isError = onboardingStatus === AccountOnboardStatus.ERROR;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const isAxios429Error = isError && error && "status" in error && (error as any).status === 429;

  return (
    <Flex flexDirection="column" alignItems="stretch" flex={1}>
      <Text variant="h4" fontSize="24px" color="neutral.c100" px={6}>
        <Trans
          i18nKey={
            isReonboarding
              ? onboardingConfig?.translationKeys.reonboardTitle
              : onboardingConfig?.translationKeys.title
          }
        />
      </Text>

      <Text fontWeight="semiBold" color="neutral.c70" numberOfLines={1} px={6} mt={4}>
        <Trans
          i18nKey={
            isReonboarding
              ? onboardingConfig?.translationKeys.account
              : onboardingConfig?.translationKeys.newAccount
          }
        />
      </Text>

      <SelectableAccountsList
        accounts={accountsToDisplay}
        selectedIds={selectedIds}
        isDisabled={false}
        header={null}
        index={0}
        showHint={false}
      />

      {isSuccess && (
        <Flex mt={4} px={6}>
          <Alert type="success">
            <Trans
              i18nKey={
                isReonboarding
                  ? onboardingConfig?.translationKeys.reonboardSuccess
                  : onboardingConfig?.translationKeys.success
              }
            />
          </Alert>
        </Flex>
      )}

      {isAxios429Error && (
        <Flex mt={4} px={6}>
          <Alert type="error">
            <Trans i18nKey={onboardingConfig?.translationKeys.error429} />
            <Text onPress={handleLearnMore} color="primary.c80" mt={2}>
              <Trans i18nKey="common.learnMore" />
            </Text>
          </Alert>
        </Flex>
      )}

      {isError && !isAxios429Error && (
        <Flex mt={4} px={6}>
          <Alert type="error">
            <Trans i18nKey={onboardingConfig?.translationKeys.error} />
          </Alert>
        </Flex>
      )}

      {!isSuccess && !isError && onboardingStatus !== AccountOnboardStatus.INIT && (
        <Flex mt={4} px={6} flexDirection="row" alignItems="center">
          {isProcessing && (
            <Flex mr={3}>
              <InfiniteLoader size={20} />
            </Flex>
          )}
          <Text color="neutral.c70" flex={1}>
            <Trans
              i18nKey={
                onboardingStatus === AccountOnboardStatus.PREPARE
                  ? onboardingConfig?.translationKeys.statusPrepare
                  : onboardingStatus === AccountOnboardStatus.SUBMIT
                    ? onboardingConfig?.translationKeys.statusSubmit
                    : onboardingConfig?.translationKeys.statusDefault
              }
            />
          </Text>
        </Flex>
      )}
    </Flex>
  );
}
