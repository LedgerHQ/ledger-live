import type { ContentCard } from "@braze/react-native-sdk";
import { mapAsCategoryContentCard } from "./utils";

const createCategoryCard = (extras: ContentCard["extras"]): ContentCard => ({
  id: "card-id",
  created: 1690112400,
  expiresAt: -1,
  viewed: false,
  clicked: false,
  pinned: false,
  dismissed: false,
  dismissible: true,
  openURLInWebView: true,
  isControl: false,
  extras,
  type: "Classic",
  title: "Action card",
  cardDescription: "Action card description",
});

describe("mapAsCategoryContentCard", () => {
  it("should use top_wallet location when category id is alwayson", () => {
    const card = createCategoryCard({
      id: "alwayson",
      link: "ledgerlive://discover/app",
    });

    const category = mapAsCategoryContentCard(card);

    expect(category.location).toBe("top_wallet");
    expect(category.link).toBe("ledgerlive://discover/app?deeplinkLocation=top_wallet");
  });

  it("should fall back to extras location for other category ids", () => {
    const card = createCategoryCard({
      id: "my-ledger-category",
      location: "my_ledger",
      link: "ledgerlive://discover/app",
    });

    const category = mapAsCategoryContentCard(card);

    expect(category.location).toBe("my_ledger");
    expect(category.link).toBe("ledgerlive://discover/app?deeplinkLocation=my_ledger");
  });
});
