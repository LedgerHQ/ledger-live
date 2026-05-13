import type { ComponentType } from "react";
import type { StyleProp, TextStyle } from "react-native";
import type { DotIconAppearance, IconSize } from "@ledgerhq/lumen-ui-rnative";
import type { OperationType } from "@ledgerhq/types-live";
import {
  ArrowDown,
  ArrowUp,
  Close,
  Invoice,
  Link,
  Mailbox,
  PenEdit,
  Snow,
  StarFill,
  Unlink,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import {
  getTransactionalDotConfig as getConfig,
  type TransactionalDotSymbol,
} from "@ledgerhq/live-common/helpers/transactionalDotConfig";

type TransactionalDotIcon = ComponentType<{
  size?: IconSize;
  style?: StyleProp<TextStyle>;
}>;

type TransactionalDotConfig = {
  icon: TransactionalDotIcon;
  appearance: DotIconAppearance;
};

const symbolMap: Record<TransactionalDotSymbol, TransactionalDotIcon> = {
  ArrowDown,
  ArrowUp,
  Close,
  Invoice,
  Link,
  Mailbox,
  PenEdit,
  Snow,
  StarFill,
  Unlink,
  Spinner,
};

export function getTransactionalDotConfig(
  operationType: OperationType,
  isPending: boolean,
  hasFailed?: boolean,
): TransactionalDotConfig | null {
  const config = getConfig(operationType, isPending, hasFailed);
  if (!config) return null;
  return { icon: symbolMap[config.symbol], appearance: config.appearance };
}
