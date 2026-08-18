/** Namespace-agnostic i18n key SUFFIX for a fee-selector entry: maps the reserved ids
 * ("" → medium, default → defaultNetworkFee, custom, coinControl) and passes any preset id
 * through unchanged. Callers prefix their own namespace (e.g. "fees." / "send.fees."). */
export function feeSelectorLabelKeySuffix(id: string): string {
  switch (id) {
    case "":
      return "medium";
    case "default":
      return "defaultNetworkFee";
    case "custom":
      return "custom";
    case "coinControl":
      return "coinControl";
    default:
      return id;
  }
}
