import { I18nTestProvider } from "@shared/i18n/testing";
import { renderHook } from "@testing-library/react-native";
import React from "react";
import type { BiometricsKind } from "../biometricsTypes";
import { useBiometricsTypeLabel } from "./useBiometricsTypeLabel";

const COPY = {
  en: {
    translation: {
      "auth.enableBiometrics.faceid": "Face ID",
    },
  },
};

const renderLabel = (kind: BiometricsKind | undefined) =>
  renderHook(() => useBiometricsTypeLabel(kind), {
    wrapper: ({ children }) => <I18nTestProvider resources={COPY}>{children}</I18nTestProvider>,
  }).result.current;

describe("useBiometricsTypeLabel", () => {
  it("translates a kind that has a wording", () => {
    expect(renderLabel("FaceID")).toBe("Face ID");
  });

  it("falls back to the raw name of a kind without wording", () => {
    expect(renderLabel("Iris")).toBe("Iris");
  });

  it("returns an empty label without a kind", () => {
    expect(renderLabel(undefined)).toBe("");
  });
});
