import React from "react";
import type { ProductTourDrawerProps } from "./types";

export { useProductTourDrawerViewModel } from "./useProductTourDrawerViewModel";
export type { ProductTourDrawerProps, ProductTourDrawerViewModel } from "./types";

/**
 * LWM Product Tour drawer root. Portfolio mounts this when `lwmProductTour` is on (LIVE-28122).
 * Drawer UI lands in follow-up tickets (e.g. LIVE-28099).
 */
export const ProductTourDrawer = (_props: ProductTourDrawerProps) => null;
