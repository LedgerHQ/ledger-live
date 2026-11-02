import { buildRendererEnv } from "./utils";

describe("buildRendererEnv", () => {
  it.each([
    ["development", "staging"],
    ["production", "prod"],
  ] as const)("defines the CONFIG_PROFILE of a %s build as %s", (mode, profile) => {
    expect(buildRendererEnv(mode)["process.env.CONFIG_PROFILE"]).toBe(JSON.stringify(profile));
  });
});
