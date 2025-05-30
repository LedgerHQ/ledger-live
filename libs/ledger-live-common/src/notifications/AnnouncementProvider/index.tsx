import React, { createContext, useMemo, useCallback, useContext, ReactElement } from "react";
import differenceBy from "lodash/differenceBy";
import { fromPromise } from "xstate";
import { useMachine } from "@xstate/react";
import type { Announcement, AnnouncementsUserSettings, State, AnnouncementsApi } from "./types";
import { localizeAnnouncements, filterAnnouncements } from "./logic";
import defaultFetchApi from "./api";
import { announcementMachine } from "./machine";

// FIXME: SOME WEIRD TYPES I HAVE TRICKED WITH ANY BUT NEEDS REWORKING

type Props = {
  children: React.ReactNode;
  handleLoad: () => Promise<{
    announcements: Announcement[];
    seenIds: string[];
    lastUpdateTime: number;
  }>;
  handleSave: (arg0: {
    announcements: Announcement[];
    seenIds: string[];
    lastUpdateTime: number;
  }) => Promise<void>;
  context: AnnouncementsUserSettings;
  autoUpdateDelay: number;
  onNewAnnouncement?: (arg0: Announcement) => void;
  onAnnouncementRead?: (arg0: Announcement) => void;
  fetchApi?: AnnouncementsApi;
};
type API = {
  updateCache: () => Promise<void>;
  setAsSeen: (seenId: string) => void;
};
export type AnnouncementContextType = State & API;
const AnnouncementsContext = createContext<AnnouncementContextType>({
  seenIds: [],
  allIds: [],
  cache: {},
  isLoading: false,
  lastUpdateTime: undefined,
  error: undefined,
  updateCache: () => Promise.resolve(),
  setAsSeen: () => {},
});
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
  fetchApi = defaultFetchApi,
}: Props): ReactElement => {
  const fetchData = useCallback(
    async (arg0: { input: { allIds: string[]; cache: Record<string, Announcement> } }) => {
      const { allIds, cache } = arg0.input;
      const rawAnnouncements = await fetchApi.fetchAnnouncements();
      const localizedAnnouncements = localizeAnnouncements(rawAnnouncements, context);
      const announcements = filterAnnouncements(localizedAnnouncements, context);
      const oldAnnouncements: Announcement[] = allIds.map((uuid: string) => cache[uuid]);
      const newAnnouncements = differenceBy(
        announcements,
        oldAnnouncements,
        announcement => announcement.uuid,
      );

      if (onNewAnnouncement) {
        newAnnouncements.forEach(announcement => {
          onNewAnnouncement(announcement);
        });
      }

      return {
        announcements,
        updateTime: Date.now(),
      };
    },
    [context, onNewAnnouncement, fetchApi],
  );
  const emitNewAnnouncement = useCallback(
    ({ context }) => {
      if (onAnnouncementRead) {
        onAnnouncementRead(context.cache[context.seenId]);
      }
    },
    [onAnnouncementRead],
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
    ({ context }) => {
      const { cache, lastUpdateTime, seenIds, allIds } = context;
      const announcements = allIds.map((id: string) => cache[id]);
      handleSave({
        announcements,
        seenIds,
        lastUpdateTime,
      });
    },
    [handleSave],
  );
  const [state, send] = useMachine(
    announcementMachine.provide({
      actions: {
        saveData,
        emitNewAnnouncement,
      },
      actors: {
        loadData: fromPromise(loadData),
        fetchData: fromPromise(fetchData),
      },
      delays: {
        AUTO_UPDATE_DELAY: autoUpdateDelay,
      },
    }),
  );
  const api = useMemo(
    () => ({
      updateCache: async () => {
        send({
          type: "UPDATE_DATA",
        });
      },
      setAsSeen: (seenId: string) => {
        send({
          type: "SET_AS_SEEN",
          seenId,
        } as any);
      },
    }),
    [send],
  );
  const value = { ...state.context, ...api };
  return (
    <AnnouncementsContext.Provider value={value as any}>{children}</AnnouncementsContext.Provider>
  );
};
