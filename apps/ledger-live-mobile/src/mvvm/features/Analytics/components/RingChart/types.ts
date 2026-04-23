import type { ColorableCurrency } from "@ledgerhq/live-common/currencies/index";
import type { DistributionItem } from "../../types/distribution";

export type ColorableDistributionItem = Omit<DistributionItem, "currency"> & {
  currency: ColorableCurrency;
};
