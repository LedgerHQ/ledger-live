// @flow

import React, { createContext, useMemo, useCallback, useContext } from "react";
import differenceBy from "lodash/differenceBy";
import { useMachine } from "@xstate/react";
import type { Announcement, AnnouncementsUserSettings, State } from "./types";
import { localizeAnnouncements, filterAnnouncements } from "./logic";
import fetchApi from "./api";
import { announcementMachine } from "./machine";

type Props = {
  children: React$Node,
  handleLoad: () => Promise<{
    announcements: Announcement[],
    seenIds: string[],
    lastUpdateTime: number,
  }>,
  handleSave: ({
    announcements: Announcement[],
    seenIds: string[],
    lastUpdateTime: number,
  }) => Promise<void>,
  context: AnnouncementsUserSettings,
  autoUpdateDelay: number,
  onNewAnnouncement?: (Announcement) => void,
  onAnnouncementRead?: (Announcement) => void,
};

type API = {
  updateCache: () => Promise<void>,
  setAsSeen: (seenId: string) => void,
};

export type AnnouncementContextType = State & API;

const AnnouncementsContext = createContext<AnnouncementContextType>({});

export function useAnnouncements(): AnnouncementContextType {
  return useContext(AnnouncementsContext);
}

export const AnnouncementProvider = ({
  children,
  context,
  handleLoad,
  handleSave,
  autoUpdateDelay,
  onNewAnnouncement,
  onAnnouncementRead,
}: Props) => {
  const fetchData = useCallback(
    async ({ allIds, cache }) => {
      const rawAnnouncements = await fetchApi.fetchAnnouncements();
      const localizedAnnouncements = localizeAnnouncements(
        rawAnnouncements,
        context
      );
      const announcements = filterAnnouncements(
        localizedAnnouncements,
        context
      );

      const oldAnnouncements = allIds.map((uuid: string) => cache[uuid]);
      const newAnnouncements = differenceBy(
        announcements,
        oldAnnouncements,
        (announcement) => announcement.uuid
      );

      if (onNewAnnouncement) {
        newAnnouncements.forEach((announcement) => {
          onNewAnnouncement(announcement);
        });
      }

      return {
        announcements,
        updateTime: Date.now(),
      };
    },
    [context, onNewAnnouncement]
  );

  const emitNewAnnouncement = useCallback(
    ({ cache }, { seenId }) => {
      if (onAnnouncementRead) {
        onAnnouncementRead(cache[seenId]);
      }
    },
    [onAnnouncementRead]
  );

  const loadData = useCallback(async () => {
    const { announcements, lastUpdateTime, seenIds } = await handleLoad();

    return {
      announcements,
      lastUpdateTime,
      seenIds,
    };
  }, [handleLoad]);

  const saveData = useCallback(
    (context) => {
      const { cache, lastUpdateTime, seenIds, allIds } = context;
      const announcements = allIds.map((id: string) => cache[id]);
      handleSave({ announcements, seenIds, lastUpdateTime });
    },
    [handleSave]
  );

  const [state, send] = useMachine(announcementMachine, {
    actions: {
      saveData,
      emitNewAnnouncement,
    },
    services: {
      loadData,
      fetchData,
    },
    delays: {
      AUTO_UPDATE_DELAY: autoUpdateDelay,
    },
  });

  const api = useMemo(
    () => ({
      updateCache: async () => {
        send({ type: "UPDATE_DATA" });
      },
      setAsSeen: (seenId: string) => {
        send({ type: "SET_AS_SEEN", seenId });
      },
    }),
    [send]
  );

  const value = {
    ...state.context,
    ...api,
  };

  return (
    <AnnouncementsContext.Provider value={value}>
      {children}
    </AnnouncementsContext.Provider>
  );
};
