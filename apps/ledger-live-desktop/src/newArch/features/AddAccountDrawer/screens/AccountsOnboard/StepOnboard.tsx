import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { getDefaultAccountNameForCurrencyIndex } from "@ledgerhq/live-wallet/accountName";
import { Alert, Box, Flex, Text } from "@ledgerhq/react-ui";
import { isAxiosError } from "axios";
import React, { memo } from "react";
import { Trans } from "react-i18next";
import styled, { useTheme } from "styled-components";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { FormattedAccountItem } from "../../components/FormattedAccountItem";
import { CreatableAccountsList } from "../ScanAccounts/components/CreatableAccountsList";
import { useFormatAccount } from "../ScanAccounts/useFormatAccount";
import { AccountOnboardStatus, StepProps, TranslationKeys } from "./types";

const AccountItemWrapper = styled(Box)`
  border-radius: 12px;
  padding: 16px;
`;

const SectionAccounts = memo(
  ({
    currency,
    accountName,
    editedNames,
    creatableAccount,
    importableAccounts,
    isReonboarding,
    onboardingConfig,
  }: Pick<
    StepProps,
    | "currency"
    | "accountName"
    | "editedNames"
    | "creatableAccount"
    | "importableAccounts"
    | "isReonboarding"
  > & {
    onboardingConfig: { translationKeys: TranslationKeys };
  }) => {
    const formatAccount = useFormatAccount(currency);
    const { colors } = useTheme();

    return (
      <Box>
        {importableAccounts?.length > 0 && (
          <Box mb={4}>
            <Text variant="h5Inter" fontSize="small" color="neutral.c80" mb="2">
              <Trans
                i18nKey={
                  onboardingConfig.translationKeys.onboarded ||
                  "families.canton.addAccount.onboard.onboarded"
                }
                count={importableAccounts?.length}
              />
            </Text>
            <Box>
              {importableAccounts.map((account, index) => {
                const accountFormatted = formatAccount(account);
                // Override name with edited name if available
                const overrideName =
                  editedNames[account.id] ||
                  getDefaultAccountNameForCurrencyIndex({ currency, index });
                accountFormatted.name = overrideName;
                return (
                  <Box mb={16} key={account.id}>
                    <AccountItemWrapper backgroundColor={colors.opacityDefault.c05}>
                      <FormattedAccountItem account={accountFormatted} />
                    </AccountItemWrapper>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {creatableAccount && (
          <CreatableAccountsList
            creatableAccounts={[creatableAccount]}
            currency={currency}
            newAccountSchemes={[]}
            showAllCreatedAccounts={false}
            toggleShowAllCreatedAccounts={() => {}}
            titleKey={
              isReonboarding
                ? onboardingConfig.translationKeys.account ||
                  "families.canton.addAccount.onboard.account"
                : onboardingConfig.translationKeys.newAccount ||
                  "families.canton.addAccount.onboard.newAccount"
            }
            renderAccount={(account: typeof creatableAccount) => {
              const accountFormatted = formatAccount(account);
              // Override name with accountName if provided
              if (accountName) {
                accountFormatted.name = accountName;
              }
              return (
                <Box mb={16} key={account.id}>
                  <AccountItemWrapper backgroundColor={colors.opacityDefault.c05}>
                    <FormattedAccountItem account={accountFormatted} />
                  </AccountItemWrapper>
                </Box>
              );
            }}
          />
        )}
      </Box>
    );
  },
);

SectionAccounts.displayName = "SectionAccounts";

const getStatusMessage = (
  status: AccountOnboardStatus | undefined,
  translationKeys: TranslationKeys,
): string => {
  switch (status) {
    case AccountOnboardStatus.PREPARE:
      return translationKeys.statusPrepare || "families.canton.addAccount.onboard.status.prepare";
    case AccountOnboardStatus.SUBMIT:
      return translationKeys.statusSubmit || "families.canton.addAccount.onboard.status.submit";
    default:
      return translationKeys.statusDefault || "families.canton.addAccount.onboard.status.default";
  }
};

const getErrorMessage = (
  error: Error | null,
  errorKey?: string,
  defaultErrorKey?: string,
): React.ReactNode => {
  if (error instanceof UserRefusedOnDevice || error instanceof LockedDeviceError) {
    return <Trans i18nKey={error.message} />;
  }
  return (
    <Trans i18nKey={errorKey || defaultErrorKey || "families.canton.addAccount.onboard.error"} />
  );
};

export default function StepOnboard({
  device,
  currency,
  accountName,
  editedNames,
  creatableAccount,
  importableAccounts,
  onboardingStatus,
  error,
  isReonboarding,
  onboardingConfig,
}: StepProps) {
  // Always call hook unconditionally to satisfy React hooks rules
  const learnMoreUrl = onboardingConfig?.urls.learnMore || "";
  const link = useLocalizedUrl(learnMoreUrl);
  const onClick = learnMoreUrl && link ? () => openURL(link) : undefined;

  if (!onboardingConfig) {
    // Fallback if config is missing (should not happen in normal flow)
    return null;
  }
  const renderContent = (onboardingStatus?: AccountOnboardStatus) => {
    switch (onboardingStatus) {
      case AccountOnboardStatus.INIT:
        return (
          <Box>
            <SectionAccounts
              currency={currency}
              accountName={accountName}
              editedNames={editedNames}
              creatableAccount={creatableAccount}
              importableAccounts={importableAccounts}
              isReonboarding={isReonboarding}
              onboardingConfig={onboardingConfig!}
            />

            <Box mt={2}>
              <Alert
                type={isReonboarding ? "warning" : "info"}
                containerProps={{ p: 12 }}
                renderContent={() => (
                  <Text
                    variant="paragraphLineHeight"
                    fontWeight="semiBold"
                    color="neutral.c100"
                    fontSize={13}
                  >
                    <Trans
                      i18nKey={
                        isReonboarding
                          ? onboardingConfig.translationKeys.reonboardInit
                          : onboardingConfig.translationKeys.init
                      }
                    />
                  </Text>
                )}
              />
            </Box>
          </Box>
        );

      case AccountOnboardStatus.SIGN:
        if (onboardingConfig.transactionConfirmComponent) {
          const TransactionConfirm = onboardingConfig.transactionConfirmComponent;
          return <TransactionConfirm device={device} />;
        }
        // Fallback: show a generic message if no component is provided
        return (
          <Box p={4}>
            <Text variant="body" color="neutral.c100">
              <Trans i18nKey="common.confirmOnDevice" />
            </Text>
          </Box>
        );

      case AccountOnboardStatus.SUCCESS:
        return (
          <Box>
            <SectionAccounts
              currency={currency}
              accountName={accountName}
              editedNames={editedNames}
              creatableAccount={creatableAccount}
              importableAccounts={importableAccounts}
              isReonboarding={isReonboarding}
              onboardingConfig={onboardingConfig!}
            />

            <Box mt={2}>
              <Alert
                type="success"
                containerProps={{ p: 12 }}
                renderContent={() => (
                  <Text
                    variant="paragraphLineHeight"
                    fontWeight="semiBold"
                    color="neutral.c100"
                    fontSize={13}
                  >
                    <Trans
                      i18nKey={
                        isReonboarding
                          ? onboardingConfig.translationKeys.reonboardSuccess
                          : onboardingConfig.translationKeys.success
                      }
                    />
                  </Text>
                )}
              />
            </Box>
          </Box>
        );

      case AccountOnboardStatus.ERROR:
        if (
          isAxiosError(error) &&
          error.status === 429 &&
          onboardingConfig.translationKeys.error429
        ) {
          return (
            <Box>
              <SectionAccounts
                currency={currency}
                accountName={accountName}
                editedNames={editedNames}
                creatableAccount={creatableAccount}
                importableAccounts={importableAccounts}
                isReonboarding={isReonboarding}
                onboardingConfig={onboardingConfig!}
              />

              <Box mt={2}>
                <Alert
                  type="error"
                  containerProps={{ p: 12, borderRadius: "4px" }}
                  renderContent={() => (
                    <Text variant="paragraphLineHeight" color="neutral.c80" fontSize={13}>
                      <Trans i18nKey={onboardingConfig.translationKeys.error429} />{" "}
                      {learnMoreUrl && (
                        <LinkWithExternalIcon
                          style={{
                            display: "inline-flex",
                          }}
                          onClick={onClick}
                          label={<Trans i18nKey="common.learnMore" />}
                        />
                      )}
                    </Text>
                  )}
                />
              </Box>
            </Box>
          );
        }
        return (
          <Box>
            <SectionAccounts
              currency={currency}
              accountName={accountName}
              editedNames={editedNames}
              creatableAccount={creatableAccount}
              importableAccounts={importableAccounts}
              isReonboarding={isReonboarding}
              onboardingConfig={onboardingConfig!}
            />

            <Box mt={2}>
              <Alert
                type="error"
                containerProps={{ p: 12, borderRadius: "4px" }}
                renderContent={() => (
                  <Text variant="paragraphLineHeight" color="neutral.c80" fontSize={13}>
                    {getErrorMessage(
                      error,
                      onboardingConfig.translationKeys.error,
                      onboardingConfig.translationKeys.error,
                    )}
                  </Text>
                )}
              />
            </Box>
          </Box>
        );

      default:
        return (
          <Box>
            <SectionAccounts
              currency={currency}
              accountName={accountName}
              editedNames={editedNames}
              creatableAccount={creatableAccount}
              importableAccounts={importableAccounts}
              isReonboarding={isReonboarding}
              onboardingConfig={onboardingConfig!}
            />

            <Flex
              alignItems="center"
              justifyContent="center"
              borderRadius="4px"
              px={3}
              mt={1}
              style={{
                height: "48px",
                border: "1px dashed",
                borderColor: "var(--palette-text-shade60)",
                borderRadius: "8px",
              }}
            >
              <Text ff="Inter|Regular" color="palette.text.shade60" fontSize={4}>
                <Trans
                  i18nKey={getStatusMessage(onboardingStatus, onboardingConfig.translationKeys)}
                />
              </Text>
            </Flex>
          </Box>
        );
    }
  };

  return renderContent(onboardingStatus);
}
