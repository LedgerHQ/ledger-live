import {
  getEstimatedListSize,
  ESTIMATED_ITEM_SIZE,
  FALLBACK_DIMENSION,
} from "../getEstimatedListSize";
import { Dimensions } from "react-native";

jest.mock("react-native", () => ({
  Dimensions: {
    get: jest.fn(() => ({
      height: 800,
      width: 400,
      scale: 1,
      fontScale: 1,
    })),
  },
}));

describe("getEstimatedListSize", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should calculate dimensions with limit", () => {
    const result = getEstimatedListSize({ limit: 5 });
    expect(result).toEqual({
      height: 5 * ESTIMATED_ITEM_SIZE,
      width: 400,
    });
  });

  it("should use screen dimensions when no limit is provided", () => {
    const result = getEstimatedListSize({});
    expect(result).toEqual({
      height: 800,
      width: 400,
    });
  });

  it("should use custom itemSize when provided", () => {
    const result = getEstimatedListSize({
      limit: 3,
      itemSize: 100,
    });
    expect(result).toEqual({
      height: 300,
      width: 400,
    });
  });

  it("should use custom screenDimensions when provided", () => {
    const customDimensions = {
      height: 1000,
      width: 500,
      scale: 1,
      fontScale: 1,
    };
    const result = getEstimatedListSize({
      screenDimensions: customDimensions,
    });
    expect(result).toEqual({
      height: 1000,
      width: 500,
    });
  });

  it("should use fallbackDimension when dimensions are undefined", () => {
    (Dimensions.get as jest.Mock).mockReturnValueOnce({
      height: undefined,
      width: undefined,
      scale: 1,
      fontScale: 1,
    });

    const result = getEstimatedListSize({});
    expect(result).toEqual({
      height: FALLBACK_DIMENSION,
      width: FALLBACK_DIMENSION,
    });
  });

  it("should use custom fallbackDimension when provided", () => {
    (Dimensions.get as jest.Mock).mockReturnValueOnce({
      height: undefined,
      width: undefined,
      scale: 1,
      fontScale: 1,
    });

    const customFallback = 600;
    const result = getEstimatedListSize({
      fallbackDimension: customFallback,
    });
    expect(result).toEqual({
      height: customFallback,
      width: customFallback,
    });
  });
});
