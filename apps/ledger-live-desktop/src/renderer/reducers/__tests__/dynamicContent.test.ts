import type { Card as BrazeCard } from "@braze/web-sdk";

import dynamicContentReducer, { INITIAL_STATE, type DynamicContentState } from "../dynamicContent";
import { addLocalContentCards } from "../../actions/dynamicContent";
import {
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";

const CATEGORY: CategoryContentCard = {
  id: "category-1",
  categoryId: "alwayson",
  title: "Touchscreen offers",
  description: "",
  location: LocationContentCard.Portfolio,
  cardsLayout: ContentCardsLayout.carousel,
  cardsType: ContentCardsType.smallSquare,
  type: ContentCardsType.category,
  created: new Date("2026-01-01"),
  isDismissable: true,
};

const childCard = (id: string): BrazeCard =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    id,
    created: new Date("2026-01-02"),
    extras: {
      type: ContentCardsType.smallSquare,
      categoryId: "alwayson",
      title: "Nano Pod",
      order: "0",
    },
  }) as unknown as BrazeCard;

const reduce = (
  state: DynamicContentState,
  action: ReturnType<typeof addLocalContentCards>,
): DynamicContentState => dynamicContentReducer(state, action);

describe("dynamicContent reducer - DYNAMIC_CONTENT_ADD_LOCAL_CONTENT_CARDS", () => {
  it("replaces an existing category shell by categoryId and appends child cards", () => {
    const first = reduce(
      INITIAL_STATE,
      addLocalContentCards({ category: CATEGORY, cards: [childCard("child-1")] }),
    );

    expect(first.localCategoriesCards).toHaveLength(1);
    expect(first.localCategoryChildCards).toHaveLength(1);

    const second = reduce(
      first,
      addLocalContentCards({
        category: { ...CATEGORY, id: "category-2", title: "" },
        cards: [childCard("child-2")],
      }),
    );

    expect(second.localCategoriesCards).toHaveLength(1);
    expect(second.localCategoriesCards[0]?.id).toBe("category-2");
    expect(second.localCategoriesCards[0]?.title).toBe("Touchscreen offers");
    expect(second.localCategoryChildCards).toHaveLength(2);
  });

  it("appends child cards when categoryId is missing from the payload", () => {
    const categoryWithoutId = { ...CATEGORY, categoryId: undefined };
    const next = reduce(
      INITIAL_STATE,
      addLocalContentCards({ category: categoryWithoutId, cards: [childCard("child-1")] }),
    );

    expect(next.localCategoriesCards).toHaveLength(1);
    expect(next.localCategoryChildCards).toHaveLength(1);
  });
});
