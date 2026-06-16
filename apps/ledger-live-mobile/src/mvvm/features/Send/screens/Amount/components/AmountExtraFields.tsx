import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { Icons, Text } from "@ledgerhq/native-ui";
import Circle from "~/components/Circle";
import QueuedDrawer from "~/components/QueuedDrawer";
import LText from "~/components/LText";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import type {
  AmountExtraField,
  AmountExtraFieldContext,
} from "@ledgerhq/live-common/bridge/descriptor/types";
import { getMainAccount } from "@ledgerhq/live-common/account/index";

type Props = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  transactionActions: SendFlowTransactionActions;
  fields: readonly AmountExtraField[];
}>;

/**
 * Generic, family-agnostic renderer for declarative Amount extra fields.
 *
 * The coin-module owns the options, the selected value and the resulting opaque
 * patch (via the descriptor). This component only renders a control and forwards
 * the user's choice — it never imports a coin-module or branches on family.
 */
export function AmountExtraFields({
  account,
  parentAccount,
  transaction,
  transactionActions,
  fields,
}: Props) {
  if (fields.length === 0) return null;

  return (
    <>
      {fields.map(field => (
        <AmountSelectFieldView
          key={field.id}
          field={field}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          transactionActions={transactionActions}
        />
      ))}
    </>
  );
}

type FieldProps = Readonly<{
  field: AmountExtraField;
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  transactionActions: SendFlowTransactionActions;
}>;

function AmountSelectFieldView({
  field,
  account,
  parentAccount,
  transaction,
  transactionActions,
}: FieldProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const context = useMemo<AmountExtraFieldContext>(
    () => ({ mainAccount, transaction }),
    [mainAccount, transaction],
  );

  const options = useMemo(() => field.getOptions(context), [field, context]);
  const selectedId = field.getSelectedOptionId(context);

  const applyPatch = useCallback(
    (patch: Record<string, unknown> | null) => {
      if (!patch) return;
      transactionActions.updateTransaction(tx => ({ ...tx, ...patch }) as Transaction);
    },
    [transactionActions],
  );

  // Let the coin-module reset an invalid selection
  // Reconciliation logic stays in the descriptor.
  useEffect(() => {
    applyPatch(field.reconcile?.(context) ?? null);
  }, [field, context, applyPatch]);

  const onSelect = useCallback(
    (optionId: string) => {
      applyPatch(field.buildPatch(optionId, context));
      setDrawerOpen(false);
    },
    [field, context, applyPatch],
  );

  const selectedLabel = useMemo(
    () => options.find(option => option.id === selectedId)?.label ?? options[0]?.label ?? "",
    [options, selectedId],
  );

  const label = t(field.labelKey);

  return (
    <View style={styles.container}>
      <LText style={styles.label} color="grey">
        {label}
      </LText>
      <TouchableOpacity
        style={[styles.selector, { borderColor: colors.lightGrey }]}
        onPress={() => setDrawerOpen(true)}
      >
        <LText semiBold style={styles.selectorText}>
          {selectedLabel}
        </LText>
        <Icons.ChevronDown size="S" color="neutral.c70" />
      </TouchableOpacity>

      <QueuedDrawer
        title={
          <Text variant="h4" textTransform="none">
            {label}
          </Text>
        }
        isRequestingToBeOpened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {options.map(option => (
          <ExtraFieldOption
            key={option.id}
            label={option.label}
            selected={option.id === selectedId}
            onPress={() => onSelect(option.id)}
          />
        ))}
      </QueuedDrawer>
    </View>
  );
}

type OptionProps = Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
}>;

function ExtraFieldOption({ label, selected, onPress }: OptionProps) {
  return (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <Text fontSize="body" fontWeight="semiBold" color={selected ? "primary.c80" : "neutral.c100"}>
        {label}
      </Text>
      {selected && (
        <Circle size={24} style={styles.checkIcon}>
          <Icons.CheckmarkCircleFill size="M" color="primary.c80" />
        </Circle>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 16,
  },
  option: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  checkIcon: {
    position: "absolute",
    right: 0,
  },
});
