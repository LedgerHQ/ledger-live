import { FEATURE_FLAGS_DEFAULTS } from "../../constants";
import { FeatureIdSchema } from "../../data/schema";
import { earnSolanaHighlightedValidators } from "./earnSolanaHighlightedValidators";

/** Made-up entries: which validators are highlighted is not decided in this repository. */
const FIRST = {
  voteAccount: "ExampleVoteAccountA11111111111111111111111",
  provider: "Provider A",
  icon: "https://icons.example/provider-a.svg",
};

describe("earnSolanaHighlightedValidators", () => {
  it("should default to disabled with no validator, so no address is hard-coded", () => {
    expect(earnSolanaHighlightedValidators.parse(undefined)).toEqual({
      enabled: false,
      params: { validators: [] },
    });
  });

  it("should be registered with that default", () => {
    expect(FeatureIdSchema.options).toContain("earnSolanaHighlightedValidators");
    expect(FEATURE_FLAGS_DEFAULTS.earnSolanaHighlightedValidators).toEqual({
      enabled: false,
      params: { validators: [] },
    });
  });

  it("should accept validators in display order, with or without a provider and an icon", () => {
    const value = {
      enabled: true,
      params: {
        validators: [
          FIRST,
          { voteAccount: "ExampleVoteAccountB11111111111111111111111", provider: "Provider B" },
          { voteAccount: "ExampleVoteAccountC11111111111111111111111" },
        ],
      },
    };

    expect(earnSolanaHighlightedValidators.parse(value)).toEqual(value);
  });

  it("should leave the 10 entries cap to the Earn live app, which owns it", () => {
    const validators = Array.from({ length: 11 }, (_, index) => ({
      voteAccount: `vote-account-${index}`,
    }));

    expect(
      earnSolanaHighlightedValidators.parse({ enabled: true, params: { validators } }).params
        ?.validators,
    ).toHaveLength(11);
  });

  it.each([
    ["no validators key", {}],
    ["validators as an object", { validators: { voteAccount: FIRST.voteAccount } }],
    ["a vote account that is not a string", { validators: [{ voteAccount: 42 }] }],
    ["an entry without a vote account", { validators: [{ provider: FIRST.provider }] }],
    ["an entry that is a bare vote account", { validators: [FIRST.voteAccount] }],
    ["a provider that is not a string", { validators: [{ ...FIRST, provider: 1 }] }],
    ["an icon that is not a string", { validators: [{ ...FIRST, icon: { href: "x" } }] }],
  ])("should reject %s", (_, params) => {
    expect(earnSolanaHighlightedValidators.safeParse({ enabled: true, params }).success).toBe(
      false,
    );
  });

  it("should leave params undefined when only enabled is given", () => {
    expect(earnSolanaHighlightedValidators.parse({ enabled: true })).toEqual({ enabled: true });
  });
});
