import { renderHook } from "@tests/test-renderer";
import { useCardLandingScreenViewModel } from "./useCardLandingScreenViewModel";
import { track } from "~/analytics";
import { CARD_LANDING_TEST_IDS } from "../../testIds";
import { PAGE_NAME } from "../../constants";
import { Screens, CreditCard } from "@ledgerhq/lumen-ui-rnative/symbols";

describe("useCardLandingScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("content", () => {
    it("should return correct title", () => {
      const { result } = renderHook(() => useCardLandingScreenViewModel());

      expect(result.current.title).toBe("Spend your\ncrypto");
    });

    it("should return correct subtitle", () => {
      const { result } = renderHook(() => useCardLandingScreenViewModel());

      expect(result.current.subtitle).toBe("Pay online or in store with a crypto card");
    });

    it("should return correct page name", () => {
      const { result } = renderHook(() => useCardLandingScreenViewModel());

      expect(result.current.pageName).toBe(PAGE_NAME);
    });
  });

  describe("CTAs", () => {
    it("should return two CTAs", () => {
      const { result } = renderHook(() => useCardLandingScreenViewModel());

      expect(result.current.ctas).toHaveLength(2);
    });

    it("should configure explore cards CTA correctly", () => {
      const { result } = renderHook(() => useCardLandingScreenViewModel());

      const exploreCta = result.current.ctas[0];
      expect(exploreCta.id).toBe("explore_cards");
      expect(exploreCta.label).toBe("Explore cards");
      expect(exploreCta.icon).toBe(Screens);
      expect(exploreCta.testID).toBe(CARD_LANDING_TEST_IDS.ctas.exploreCards);
      expect(typeof exploreCta.onPress).toBe("function");
    });

    it("should configure I have a card CTA correctly", () => {
      const { result } = renderHook(() => useCardLandingScreenViewModel());

      const iHaveCardCta = result.current.ctas[1];
      expect(iHaveCardCta.id).toBe("i_have_a_card");
      expect(iHaveCardCta.label).toBe("I have a card");
      expect(iHaveCardCta.icon).toBe(CreditCard);
      expect(iHaveCardCta.testID).toBe(CARD_LANDING_TEST_IDS.ctas.iHaveACard);
      expect(typeof iHaveCardCta.onPress).toBe("function");
    });

    it("should maintain stable CTA references on re-render", () => {
      const { result, rerender } = renderHook(() => useCardLandingScreenViewModel());

      const firstCtas = result.current.ctas;
      rerender({});
      const secondCtas = result.current.ctas;

      expect(firstCtas).toBe(secondCtas);
    });
  });

  describe("analytics", () => {
    it("should track event when explore cards CTA is pressed", () => {
      const { result } = renderHook(() => useCardLandingScreenViewModel());

      result.current.ctas[0].onPress();

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "explore cards",
        page: PAGE_NAME,
      });
    });

    it("should track event when I have a card CTA is pressed", () => {
      const { result } = renderHook(() => useCardLandingScreenViewModel());

      result.current.ctas[1].onPress();

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "I have a card",
        page: PAGE_NAME,
      });
    });
  });
});
