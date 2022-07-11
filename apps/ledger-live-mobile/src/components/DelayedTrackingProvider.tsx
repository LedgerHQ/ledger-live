import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Adjust, AdjustEvent } from "react-native-adjust";

import { track } from "../analytics/segment";

export type SegmentTrackingEvent = {
  type: "segment";
  payload: {
    id: string;
    properties: any;
  };
};

export type AdjustTrackingEvent = {
  type: "adjust";
  payload: {
    id: string;
    revenue?: number;
    currency?: string;
  };
};

export type TrackingEvent = AdjustTrackingEvent | SegmentTrackingEvent;

const STORAGE_KEY = "delayedTrackingEvents";

const getDelayedEvents = async (): Promise<TrackingEvent[] | null> => {
  try {
    const delayedEventsString = await AsyncStorage.getItem(STORAGE_KEY);

    if (!delayedEventsString) {
      return null;
    }

    return JSON.parse(delayedEventsString);
  } catch (_) {
    return null;
  }
};

export const pushDelayedTrackingEvent = async (
  event: TrackingEvent,
): Promise<void> => {
  try {
    const events = (await getDelayedEvents()) || [];

    events.push(event);

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error(
      `Failed to push new delayed tracking event with error "${error}"`,
    );
  }
};

export default function DelayedTrackingProvider() {
  const handleAdjustEvent = (event: AdjustTrackingEvent) => {
    const adjustEvent = new AdjustEvent(event.payload.id);

    if (event.payload.revenue && event.payload.currency) {
      adjustEvent.setRevenue(event.payload.revenue, event.payload.currency);
    }

    Adjust.trackEvent(adjustEvent);
  };

  const handleSegmentEvent = (event: SegmentTrackingEvent) => {
    track(event.payload.id, event.payload.properties);
  };

  useEffect(() => {
    const handleDelayedTracking = async () => {
      try {
        const delayedEvents = await getDelayedEvents();

        if (!delayedEvents) {
          return;
        }

        // Clear storage first in case new events get in queue during processing
        await AsyncStorage.removeItem(STORAGE_KEY);

        delayedEvents.forEach(event => {
          switch (event.type) {
            case "adjust":
              handleAdjustEvent(event);
              break;
            case "segment":
              handleSegmentEvent(event);
              break;
            default:
              console.error(
                `Badly formatted tracking event found with the type "${
                  (event as any).type
                }"`,
              );
              break;
          }
        });
      } catch (error) {
        console.error(
          `Failed to handle delayed tracking events with error "${error}"`,
        );
      }
    };
    handleDelayedTracking();
  }, []);

  return null;
}
