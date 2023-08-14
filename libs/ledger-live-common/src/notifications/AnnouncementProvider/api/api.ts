import network from "@ledgerhq/live-network/network";
import { getEnv } from "../../../env";
import type { AnnouncementsApi, RawAnnouncement } from "../types";

// expose a function to fetch data from the cdn (data from ledger-live-assets)
// https://cdn.live.ledger.com/
const baseAnnouncementsUrl = () => getEnv("ANNOUNCEMENTS_API_URL");

const announcementsVersion = () => getEnv("ANNOUNCEMENTS_API_VERSION");

async function fetchAnnouncements(): Promise<RawAnnouncement[]> {
  const url = `${baseAnnouncementsUrl()}/v${announcementsVersion()}/data.json?t=${Date.now()}`;
  const { data } = await network({
    method: "GET",
    headers: {
      Origin: "http://localhost:3000",
    },
    url,
  });
  return data;
}

const api: AnnouncementsApi = {
  fetchAnnouncements,
};
export default api;
