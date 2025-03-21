import { NotificationContentCard } from "~/dynamicContent/types";

export type NotificationItem = DynamicNotification | LNSUpsellNotification;

type DynamicNotification = { kind: "dynamic"; card: NotificationContentCard };
type LNSUpsellNotification = { kind: "lnsUpsell" };
