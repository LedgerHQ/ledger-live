import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { AllocationTableItem, AllocationViewProps } from "../types";

export const bitcoin = getCryptoCurrencyById("bitcoin");
export const ethereum = getCryptoCurrencyById("ethereum");
export const solana = getCryptoCurrencyById("solana");

export const allocationItems: AllocationTableItem[] = [
  { currency: bitcoin, balance: 100000, distribution: 60 },
  { currency: ethereum, balance: 50000, distribution: 30 },
];

export function makeAllocationViewProps(
  overrides?: Partial<AllocationViewProps>,
): AllocationViewProps {
  return {
    items: allocationItems,
    hasMore: false,
    showMore: jest.fn(),
    onItemClick: jest.fn(),
    ...overrides,
  };
}
