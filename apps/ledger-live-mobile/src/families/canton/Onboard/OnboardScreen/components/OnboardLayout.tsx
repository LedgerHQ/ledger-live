import { Checkbox, Flex, IconBox, Text } from "@ledgerhq/native-ui";
import type { Account } from "@ledgerhq/types-live";
import React from "react";
import SelectableAccountsList from "~/components/SelectableAccountsList";
import { Trans } from "~/context/Locale";
import LedgerIcon from "~/icons/Ledger";

interface OnboardLayoutProps {
  readonly accounts: Account[];
  readonly selectedIds: string[];
  readonly isReonboarding: boolean;
  readonly children?: React.ReactNode;
}

export function OnboardLayout({
  accounts,
  selectedIds,
  isReonboarding,
  children,
}: OnboardLayoutProps) {
  const titleKey = isReonboarding ? "canton.onboard.reonboard.title" : "canton.onboard.title";
  const accountKey = isReonboarding ? "canton.onboard.reonboard.account" : "canton.onboard.account";
  const authorizeKey = isReonboarding
    ? "canton.onboard.reonboard.authorize"
    : "canton.onboard.authorize";

  return (
    <>
      <Text variant="h4" testID="onboard-header-title" fontSize="24px" color="neutral.c100" px={6}>
        <Trans i18nKey={titleKey} />
      </Text>
      <Text
        fontWeight="semiBold"
        flexShrink={1}
        color="neutral.c70"
        numberOfLines={1}
        px={6}
        mt={4}
      >
        <Trans i18nKey={accountKey} />
      </Text>
      <SelectableAccountsList
        accounts={accounts}
        selectedIds={selectedIds}
        isDisabled={false}
        header={null}
        index={0}
        showHint={false}
      />
      <Text fontWeight="semiBold" flexShrink={1} color="neutral.c70" numberOfLines={1} px={6}>
        <Trans i18nKey={authorizeKey} />
      </Text>
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        mt={4}
        py={4}
        mx={6}
        px={4}
        backgroundColor="neutral.c30"
        borderRadius={2}
      >
        <Flex flexDirection="row" alignItems="center">
          <IconBox iconSize={28} boxSize={40} Icon={LedgerIcon} />
          <Text ml={3}>
            <Trans i18nKey="canton.onboard.validator" />
          </Text>
        </Flex>
        <Checkbox checked={true} />
      </Flex>
      {children}
    </>
  );
}
