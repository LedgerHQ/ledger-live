// Re-export from shared module
export type { FormattedAmount } from "@ledgerhq/live-common/flows/send/screens/amount";
export {
  formatAmountForInput,
  formatFiatForInput,
  processRawInput,
  processFiatInput,
  calculateFiatEquivalent,
  shouldSyncInput,
} from "@ledgerhq/live-common/flows/send/screens/amount";
