import { renderHook } from "@tests/test-renderer";
import { usePortfolioBannersSectionViewModel } from "../usePortfolioBannersSectionViewModel";
import { useOnboardingWidgetVisibility } from "../../../hooks/useOnboardingWidgetVisibility";
import useShouldDisplayRecoverBanner from "../../RecoverBanner/useShouldDisplayRecoverBanner";

jest.mock("../../../hooks/useOnboardingWidgetVisibility");
jest.mock("../../RecoverBanner/useShouldDisplayRecoverBanner");

const mockUseOnboardingWidgetVisibility = jest.mocked(useOnboardingWidgetVisibility);
const mockUseShouldDisplayRecoverBanner = jest.mocked(useShouldDisplayRecoverBanner);

describe("usePortfolioBannersSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboardingWidgetVisibility.mockReturnValue(false);
    mockUseShouldDisplayRecoverBanner.mockReturnValue(false);
  });

  describe("hasMultipleCards", () => {
    it.each([
      {
        desc: "recover banner and onboarding widget both active",
        recover: true,
        onboarding: true,
        hasAssets: false,
        expected: true,
      },
      {
        desc: "recover banner and assets both active",
        recover: true,
        onboarding: false,
        hasAssets: true,
        expected: true,
      },
      {
        desc: "only recover banner active",
        recover: true,
        onboarding: false,
        hasAssets: false,
        expected: false,
      },
      {
        desc: "only onboarding widget active",
        recover: false,
        onboarding: true,
        hasAssets: false,
        expected: false,
      },
    ])("is $expected when $desc", ({ recover, onboarding, hasAssets, expected }) => {
      mockUseShouldDisplayRecoverBanner.mockReturnValue(recover);
      mockUseOnboardingWidgetVisibility.mockReturnValue(onboarding);

      const { result } = renderHook(() =>
        usePortfolioBannersSectionViewModel({ showAssets: hasAssets }),
      );

      expect(result.current.hasMultipleCards).toBe(expected);
    });
  });
});
