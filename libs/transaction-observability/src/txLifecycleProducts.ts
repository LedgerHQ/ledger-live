import { borrowLifecycleProduct } from "./borrowLifecycleHost";
import { earnLifecycleProduct } from "./earnLifecycleHost";
import type { LogEvent } from "./logEvent";
import {
  buildTxLifecyclePayload,
  observeTxLifecycle,
  resolveTxLifecycleProduct,
  type TxLifecyclePayload,
  type TxLifecyclePlatform,
} from "./txLifecycle";

/** The only place that lists the products; neither product module knows about the other. */
const TX_LIFECYCLE_PRODUCTS = [earnLifecycleProduct, borrowLifecycleProduct];

export function registerTxLifecycleObserver(platform: TxLifecyclePlatform): void {
  observeTxLifecycle(platform, TX_LIFECYCLE_PRODUCTS);
}

export function toTxLifecyclePayload(
  event: LogEvent,
  platform: TxLifecyclePlatform,
): TxLifecyclePayload | null {
  const claim = resolveTxLifecycleProduct(TX_LIFECYCLE_PRODUCTS, event);
  return claim ? buildTxLifecyclePayload(event, platform, claim.path) : null;
}
