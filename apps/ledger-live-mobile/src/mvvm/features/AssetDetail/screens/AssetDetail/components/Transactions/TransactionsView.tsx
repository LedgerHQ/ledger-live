import React from "react";
import {
  Box,
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { useTranslation } from "~/context/Locale";
import OperationsListItem from "LLM/features/OperationsHistory/screens/OperationsList/components/OperationsListItem";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";

type Props = Readonly<{
  operations: readonly Operation[];
  accountByAddress: Map<string, AccountLike>;
  lastSeenTs: number | null;
  findAccount: (
    accountId: string,
  ) => { account: AccountLike; parentAccount: Account | undefined } | null;
  onHeaderPress: () => void;
}>;

export function TransactionsView({
  operations,
  accountByAddress,
  lastSeenTs,
  findAccount,
  onHeaderPress,
}: Props) {
  const { t } = useTranslation();

  if (operations.length === 0) return null;

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.transactions}>
      <Subheader>
        <SubheaderRow
          onPress={onHeaderPress}
          accessibilityRole="button"
          lx={{ marginBottom: "s12" }}
        >
          <SubheaderTitle>{t("assetDetail.transactions.title")}</SubheaderTitle>
          <SubheaderShowMore />
        </SubheaderRow>
      </Subheader>
      {operations.map(op => {
        const resolved = findAccount(op.accountId);
        if (!resolved) return null;
        return (
          <OperationsListItem
            key={`${op.accountId}_${op.id}_${op.type}`}
            operation={op}
            account={resolved.account}
            parentAccount={resolved.parentAccount}
            accountByAddress={accountByAddress}
            isPending={op.blockHeight == null}
            lastSeenTs={lastSeenTs}
          />
        );
      })}
    </Box>
  );
}
