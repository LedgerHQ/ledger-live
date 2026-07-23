import { renderHook, act } from "@tests/test-renderer";
import { ASSET_DETAIL_TEST_IDS } from "../../../../../../testIds";
import { useMoreOptionsBottomSheetViewModel } from "../useMoreOptionsBottomSheetViewModel";

jest.mock("~/context/Locale", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

describe("useMoreOptionsBottomSheetViewModel", () => {
  const onClose = jest.fn();
  const onSellPress = jest.fn();
  const onEarnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const render = (isSellAvailable: boolean, isEarnAvailable: boolean) =>
    renderHook(() =>
      useMoreOptionsBottomSheetViewModel({
        isSellAvailable,
        isEarnAvailable,
        onClose,
        onSellPress,
        onEarnPress,
      }),
    );

  describe("options", () => {
    it("contains only the sell row when isSellAvailable is true and isEarnAvailable is false", () => {
      const { result } = render(true, false);

      expect(result.current.options).toHaveLength(1);
      expect(result.current.options[0].testID).toBe(ASSET_DETAIL_TEST_IDS.footerSellButton);
    });

    it("contains only the earn row when isSellAvailable is false and isEarnAvailable is true", () => {
      const { result } = render(false, true);

      expect(result.current.options).toHaveLength(1);
      expect(result.current.options[0].testID).toBe(ASSET_DETAIL_TEST_IDS.footerEarnButton);
    });

    it("contains both rows in order sell then earn when both are available", () => {
      const { result } = render(true, true);

      expect(result.current.options).toHaveLength(2);
      expect(result.current.options.map(option => option.id)).toEqual(["sell", "earn"]);
      expect(result.current.options[0].testID).toBe(ASSET_DETAIL_TEST_IDS.footerSellButton);
      expect(result.current.options[1].testID).toBe(ASSET_DETAIL_TEST_IDS.footerEarnButton);
    });

    it("is empty when both are false", () => {
      const { result } = render(false, false);

      expect(result.current.options).toHaveLength(0);
    });
  });

  describe("press handlers", () => {
    it("pressing the sell row calls onClose then onSellPress", () => {
      const { result } = render(true, false);
      const callOrder: string[] = [];
      onClose.mockImplementation(() => callOrder.push("onClose"));
      onSellPress.mockImplementation(() => callOrder.push("onSellPress"));

      act(() => result.current.options[0].onPress());

      expect(callOrder).toEqual(["onClose", "onSellPress"]);
    });

    it("pressing the earn row calls onClose then onEarnPress", () => {
      const { result } = render(false, true);
      const callOrder: string[] = [];
      onClose.mockImplementation(() => callOrder.push("onClose"));
      onEarnPress.mockImplementation(() => callOrder.push("onEarnPress"));

      act(() => result.current.options[0].onPress());

      expect(callOrder).toEqual(["onClose", "onEarnPress"]);
    });
  });

  describe("testIDs", () => {
    it("sell row carries the footerSellButton testID", () => {
      const { result } = render(true, false);

      expect(result.current.options[0].testID).toBe(ASSET_DETAIL_TEST_IDS.footerSellButton);
    });

    it("earn row carries the footerEarnButton testID", () => {
      const { result } = render(false, true);

      expect(result.current.options[0].testID).toBe(ASSET_DETAIL_TEST_IDS.footerEarnButton);
    });
  });
});
