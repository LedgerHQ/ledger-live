const CONTRACT_DATA_DISABLED_STATUS = 0x6a80;

export function isContractDataDisabledError(error: Error): boolean {
  return (
    (error as { name?: string }).name === "TransportStatusError" &&
    (error as { statusCode?: number }).statusCode === CONTRACT_DATA_DISABLED_STATUS
  );
}
