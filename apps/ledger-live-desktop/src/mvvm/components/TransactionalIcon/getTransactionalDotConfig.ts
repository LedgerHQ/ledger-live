import type { DotIconAppearance, DotIconProps } from "@ledgerhq/lumen-ui-react";
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
} from "@ledgerhq/lumen-ui-react/symbols";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import {
  getTransactionalDotConfig as getConfig,
  type TransactionalDotSymbol,
} from "@ledgerhq/live-common/helpers/transactionalDotConfig";

type TransactionalDotIcon = DotIconProps["icon"];

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
