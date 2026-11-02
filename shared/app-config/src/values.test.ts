import { describe, expect, it } from "@jest/globals";
import { resolveAppConfigValues } from "./values";

const declarations = {
  switches: {
    backend: {
      label: "Backend",
      options: {
        prod: { apiUrl: "https://api.example.com" },
        staging: { apiUrl: "https://api.stg.example.com" },
      },
    },
  },
  fixed: { clientVersion: "test/1.0.0" },
};

const devValues = { apiUrl: "http://localhost:3000", clientVersion: "dev/1.0.0" };

describe("resolveAppConfigValues", () => {
  it("resolves what is on Dev to its dev values when the default is staging", () => {
    expect(
      resolveAppConfigValues(
        { ...declarations, default: "staging" },
        { backend: "dev", clientVersion: "dev" },
        devValues,
      ),
    ).toEqual(devValues);
  });

  it("resolves a switch on Dev without dev values to the default option", () => {
    expect(
      resolveAppConfigValues({ ...declarations, default: "staging" }, { backend: "dev" }, {}),
    ).toEqual({ apiUrl: "https://api.stg.example.com", clientVersion: "test/1.0.0" });
  });
});
