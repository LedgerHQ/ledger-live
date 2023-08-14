import timemachine from "timemachine";
import { groupAnnouncements } from "../../notifications/AnnouncementProvider/helpers";
timemachine.config({
  dateString: "February 22, 2021 13:12:59",
});
const cache = {
  "announcement-id-a": {
    uuid: "announcement-id-a",
    level: "info",
    icon: "warning",
    content: {
      title: "Incoming cosmos fork",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
      link: {
        href: "https://ledger.com/there-is/an/incoming-cosmos-fork",
        label: "Click here for more information on upcoming fork",
      },
    },
    contextual: [],
    published_at: "2019-09-29T00:00:00.000Z",
    expired_at: "2021-03-06T00:00:00.000Z",
    utm_campaign: "promo_feb2021",
    currencies: ["cosmos"],
  },
  "announcement-id-b": {
    uuid: "announcement-id-b",
    level: "info",
    icon: "info",
    content: {
      title: "Incoming cosmos fork",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
      link: {
        href: "https://ledger.com/there-is/an/incoming-cosmos-fork",
        label: "Click here for more information on upcoming fork",
      },
    },
    contextual: [],
    languages: ["en"],
    published_at: "2019-10-31T00:00:00.000Z",
    expired_at: "2021-04-06T00:00:00.000Z",
  },
  "announcement-id-c": {
    uuid: "announcement-id-c",
    level: "warning",
    icon: "warning",
    content: {
      title: "Incoming bitcoin fork",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
      link: {
        href: "https://ledger.com/there-is/an/incoming-cosmos-fork",
        label: "Click here for more information on upcoming fork",
      },
    },
    priority: 1,
    contextual: ["send"],
    published_at: "2019-10-31T00:00:00.000Z",
    expired_at: "2021-05-06T00:00:00.000Z",
    currencies: ["bitcoin"],
  },
};
let announcements;
describe("groupAnnouncements", () => {
  beforeAll(() => {
    const allIds = Object.keys(cache);
    announcements = groupAnnouncements(allIds.map(uuid => cache[uuid]));
  });
  it("should group the announcements by date and priority", () => {
    const expected = [
      {
        day: null,
        data: [
          {
            uuid: "announcement-id-c",
            level: "warning",
            icon: "warning",
            content: {
              title: "Incoming bitcoin fork",
              text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
              link: {
                href: "https://ledger.com/there-is/an/incoming-cosmos-fork",
                label: "Click here for more information on upcoming fork",
              },
            },
            priority: 1,
            contextual: ["send"],
            published_at: "2019-10-31T00:00:00.000Z",
            expired_at: "2021-05-06T00:00:00.000Z",
            currencies: ["bitcoin"],
          },
        ],
      },
      {
        day: new Date("2019-10-30T04:00:00.000Z"),
        data: [
          {
            uuid: "announcement-id-b",
            level: "info",
            icon: "info",
            content: {
              title: "Incoming cosmos fork",
              text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
              link: {
                href: "https://ledger.com/there-is/an/incoming-cosmos-fork",
                label: "Click here for more information on upcoming fork",
              },
            },
            contextual: [],
            languages: ["en"],
            published_at: "2019-10-31T00:00:00.000Z",
            expired_at: "2021-04-06T00:00:00.000Z",
          },
        ],
      },
      {
        day: new Date("2019-09-28T04:00:00.000Z"),
        data: [
          {
            uuid: "announcement-id-a",
            level: "info",
            icon: "warning",
            content: {
              title: "Incoming cosmos fork",
              text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
              link: {
                href: "https://ledger.com/there-is/an/incoming-cosmos-fork",
                label: "Click here for more information on upcoming fork",
              },
            },
            contextual: [],
            published_at: "2019-09-29T00:00:00.000Z",
            expired_at: "2021-03-06T00:00:00.000Z",
            utm_campaign: "promo_feb2021",
            currencies: ["cosmos"],
          },
        ],
      },
    ];
    expect(announcements).toStrictEqual(expected);
  });
});
