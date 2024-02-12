import Prando from "prando";
import { getEnv } from "@ledgerhq/live-env";
import type {
  AnnouncementsApi,
  RawAnnouncement,
} from "../../notifications/AnnouncementProvider/types";
const announcementsPool: RawAnnouncement[] = [
  {
    uuid: "announcement-id-a",
    level: "info",
    icon: "warning",
    content: {
      en: {
        title: "Incoming cosmos fork",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
        link: {
          href: "https://ledger.com/there-is/an/incoming-cosmos-fork",
          label: "Click here for more information on upcoming fork",
        },
      },
    },
    contextual: [],
    published_at: "2019-09-29T00:00:00.000Z",
    expired_at: "2021-03-06T00:00:00.000Z",
    utm_campaign: "promo_feb2021",
    currencies: ["cosmos"],
  },
  {
    uuid: "announcement-id-b",
    level: "info",
    icon: "info",
    content: {
      en: {
        title: "Incoming cosmos fork",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
        link: {
          href: "https://ledger.com/there-is/an/incoming-cosmos-fork",
          label: "Click here for more information on upcoming fork",
        },
      },
    },
    contextual: [],
    languages: ["en"],
    published_at: "2019-10-31T00:00:00.000Z",
    expired_at: "2021-04-06T00:00:00.000Z",
  },
  {
    uuid: "announcement-id-c",
    level: "warning",
    icon: "warning",
    content: {
      en: {
        title: "Incoming bitcoin fork",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
        link: {
          href: "https://ledger.com/there-is/an/incoming-cosmos-fork",
          label: "Click here for more information on upcoming fork",
        },
      },
      fr: {
        title: "Fork bitcoin en approche",
        text: "Lorem ipsum mais en français dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
        link: {
          href: "https://ledger.com/there-is/an/fork-bitcoin-en-approche",
          label: "Clique ici pour en savoir plus sur le fork bitcoin ;)",
        },
      },
    },
    priority: 1,
    contextual: ["send"],
    published_at: "2019-10-31T00:00:00.000Z",
    expired_at: "2021-05-06T00:00:00.000Z",
    currencies: ["bitcoin"],
  },
];
const announcements: RawAnnouncement[] = [...announcementsPool];
const rng = new Prando(getEnv("MOCK"));
export const addMockAnnouncement = (params?: RawAnnouncement): void => {
  const now = new Date();
  const expiryDate = new Date(now.getTime() + 2 * 60 * 1000);
  const newAnnouncement = {
    ...rng.nextArrayItem(announcementsPool),
    uuid: rng.nextString(32),
    level: rng.nextArrayItem(["info", "warning"]),
    icon: rng.nextArrayItem(["info", "warning"]),
    currencies: undefined,
    contextual: undefined,
    published_at: now.toISOString(),
    expired_at: expiryDate.toISOString(),
    ...params,
  };
  announcements.push(newAnnouncement);
};

async function fetchAnnouncements(): Promise<RawAnnouncement[]> {
  return Promise.resolve(announcements);
}

const api: AnnouncementsApi = {
  fetchAnnouncements,
};
export default api;
