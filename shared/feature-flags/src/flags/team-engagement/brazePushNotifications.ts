import { z } from "zod";
import { flagWith } from "../../define";

const repromptScheduleItemSchema = z.object({
  months: z.number(),
  days: z.number(),
  hours: z.number(),
  minutes: z.number(),
  seconds: z.number(),
});

const actionEventSchema = z.object({
  enabled: z.boolean(),
  timer: z.number(),
});

const actionEventsSchema = z.object({
  complete_onboarding: actionEventSchema,
  send: actionEventSchema,
  dapp_complete: actionEventSchema,
  receive: actionEventSchema,
  buy: actionEventSchema,
  swap: actionEventSchema,
  stake: actionEventSchema,
  add_favorite_coin: actionEventSchema,
});

const inactivityRepromptSchema = z.object({
  months: z.number(),
  days: z.number(),
  hours: z.number(),
  minutes: z.number(),
  seconds: z.number(),
});

const notificationsCategorySchema = z.object({
  displayed: z.boolean(),
  category: z.string(),
});

export const brazePushNotifications = flagWith({
  reprompt_schedule: z.array(repromptScheduleItemSchema),
  action_events: actionEventsSchema,
  inactivity_enabled: z.boolean(),
  inactivity_reprompt: inactivityRepromptSchema,
  notificationsCategories: z.array(notificationsCategorySchema),
});
