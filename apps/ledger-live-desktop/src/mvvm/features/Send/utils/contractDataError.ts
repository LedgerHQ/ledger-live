/**
 * TRON has no named "contract data disabled" error (hw-app-trx only stubs status 0x6a80); match the
 * raw status code the same way the 0x6985 user-reject case is matched in hw/actions/transaction.ts.
 * Shared by both sponsored signing steps (TX-A rent payment and TX-C transfer), which are each a
 * contract-data signing operation on the device.
 */
export function isContractDataDisabledError(error: Error): boolean {
  return (
    (error as { name?: string }).name === "TransportStatusError" &&
    (error as { statusCode?: number }).statusCode === 0x6a80
  );
}
