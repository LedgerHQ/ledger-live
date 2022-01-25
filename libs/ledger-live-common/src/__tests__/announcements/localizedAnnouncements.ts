import timemachine from "timemachine";
import { localizeAnnouncements } from "../../notifications/AnnouncementProvider/logic";
import api from "../test-helpers/announcements";
timemachine.config({
  dateString: "February 22, 2021 13:12:59",
});
let announcements;
describe("localizeAnnouncements", () => {
  beforeEach(async () => {
    announcements = await api.fetchAnnouncements();
  });
  describe("with context.language = 'en'", () => {
    const context = {
      language: "en",
      currencies: [],
      getDate: () => new Date(),
    };
    it("it should return a formatted array of announcements with user lang", async () => {
      const result = localizeAnnouncements(announcements, context);
      const expected = [
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
      ];
      expect(result).toStrictEqual(expected);
    });
  });
  describe("with context.language = 'fr'", () => {
    const context = {
      language: "fr",
      currencies: [],
      getDate: () => new Date(),
    };
    it("should return the french announcement if found, and fallback to english otherwise", async () => {
      const result = localizeAnnouncements(announcements, context);
      const expected = [
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
        {
          uuid: "announcement-id-c",
          level: "warning",
          icon: "warning",
          content: {
            title: "Fork bitcoin en approche",
            text: "Lorem ipsum mais en français dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
            link: {
              href: "https://ledger.com/there-is/an/fork-bitcoin-en-approche",
              label: "Clique ici pour en savoir plus sur le fork bitcoin ;)",
            },
          },
          priority: 1,
          contextual: ["send"],
          published_at: "2019-10-31T00:00:00.000Z",
          expired_at: "2021-05-06T00:00:00.000Z",
          currencies: ["bitcoin"],
        },
      ];
      expect(result).toStrictEqual(expected);
    });
  });
  describe("with no context.language", () => {
    const context = {
      language: "",
      currencies: [],
      getDate: () => new Date(),
    };
    it("should default to english announcements", async () => {
      const result = localizeAnnouncements(announcements, context);
      const expected = [
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
      ];
      expect(result).toStrictEqual(expected);
    });
  });
});
