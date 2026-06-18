import { z } from "zod";

export const NotificationPermissionStatusSchema = z.enum([
  "not_determined",
  "denied",
  "authorized",
  "provisional",
  "ephemeral",
]);

export type NotificationPermissionStatus = z.infer<typeof NotificationPermissionStatusSchema>;

export const NotificationPromptTargetSchema = z.enum([
  "globalPushNotifications",
  "transactionsAlertsCategory",
]);

export type NotificationPromptTarget = z.infer<typeof NotificationPromptTargetSchema>;

export const NotificationPromptAfterActionSourceSchema = z.enum([
  "onboarding",
  "send",
  "dapp_complete",
  "receive",
  "swap",
  "stake",
  "add_favorite_coin",
]);

export type NotificationPromptAfterActionSource = z.infer<
  typeof NotificationPromptAfterActionSourceSchema
>;

export const NotificationPromptSourceSchema = z.union([
  NotificationPromptAfterActionSourceSchema,
  z.literal("inactivity"),
]);

export type NotificationPromptSource = z.infer<typeof NotificationPromptSourceSchema>;

export const NotificationPromptVariantSchema = z.enum(["A", "B"]);

export type NotificationPromptVariant = z.infer<typeof NotificationPromptVariantSchema>;

export const NotificationPromptDurationSchema = z.object({
  months: z.number().int().nonnegative().optional(),
  days: z.number().int().nonnegative().optional(),
  hours: z.number().int().nonnegative().optional(),
  minutes: z.number().int().nonnegative().optional(),
  seconds: z.number().int().nonnegative().optional(),
});

export type NotificationPromptDuration = z.infer<typeof NotificationPromptDurationSchema>;

export const NotificationPromptActionEventKeySchema = z.enum([
  "complete_onboarding",
  "send",
  "dapp_complete",
  "receive",
  "swap",
  "stake",
  "add_favorite_coin",
]);

export type NotificationPromptActionEventKey = z.infer<
  typeof NotificationPromptActionEventKeySchema
>;

export const NotificationPromptActionEventSchema = z.object({
  enabled: z.boolean(),
  timer: z.number().int().nonnegative(),
});

export type NotificationPromptActionEvent = z.infer<typeof NotificationPromptActionEventSchema>;

export const NotificationPromptCategoryConfigSchema = z.object({
  category: NotificationPromptTargetSchema,
  drawerPromptEnabled: z.boolean(),
  drawerPromptActions: z.array(NotificationPromptAfterActionSourceSchema).optional(),
});

export type NotificationPromptCategoryConfig = z.infer<
  typeof NotificationPromptCategoryConfigSchema
>;

export const NotificationPromptPolicySchema = z.object({
  enabled: z.boolean(),
  variant: NotificationPromptVariantSchema.optional(),
  actionEvents: z
    .partialRecord(NotificationPromptActionEventKeySchema, NotificationPromptActionEventSchema)
    .optional(),
  repromptSchedule: z.array(NotificationPromptDurationSchema).optional(),
  inactivityEnabled: z.boolean().optional(),
  inactivityReprompt: NotificationPromptDurationSchema.optional(),
  notificationsCategories: z.array(NotificationPromptCategoryConfigSchema).optional(),
});

export type NotificationPromptPolicy = z.infer<typeof NotificationPromptPolicySchema>;

export const NotificationPromptHistorySchema = z.object({
  dismissedOptInDrawerAtList: z.array(z.number().int()).optional(),
  dismissedPromptAtListByTarget: z
    .partialRecord(NotificationPromptTargetSchema, z.array(z.number().int()))
    .optional(),
  lastActionAt: z.number().int().optional(),
  dateOfNextAllowedRequest: z.date().optional(),
  alreadyDelayedToLater: z.boolean().optional(),
});

export type NotificationPromptHistory = z.infer<typeof NotificationPromptHistorySchema>;

export const NotificationPromptHistoryInitialState: NotificationPromptHistory = {};
