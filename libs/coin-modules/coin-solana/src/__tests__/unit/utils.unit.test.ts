import {
  LEDGER_VALIDATOR_BY_FIGMENT,
  LEDGER_VALIDATOR_BY_CHORUS_ONE,
  LEDGER_VALIDATOR_DEFAULT,
} from "../../utils";

describe("utils - Default Validators", () => {
  describe("LEDGER_VALIDATOR_BY_FIGMENT", () => {
    it("should have all required properties including APY", () => {
      expect(LEDGER_VALIDATOR_BY_FIGMENT).toEqual({
        voteAccount: "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx",
        name: "Ledger by Figment",
        avatarUrl:
          "https://s3.amazonaws.com/keybase_processed_uploads/3c47b62f3d28ecfd821536f69be82905_360_360.jpg",
        wwwUrl: "https://www.ledger.com/staking",
        activeStake: expect.any(Number),
        commission: 7,
        totalScore: 6,
        apy: expect.any(Number),
      });
    });

    it("should have a valid APY value", () => {
      expect(LEDGER_VALIDATOR_BY_FIGMENT.apy).toBeGreaterThan(0);
      expect(LEDGER_VALIDATOR_BY_FIGMENT.apy).toBeLessThan(1);
      expect(typeof LEDGER_VALIDATOR_BY_FIGMENT.apy).toBe("number");
    });

    it("should have a valid voteAccount address", () => {
      expect(LEDGER_VALIDATOR_BY_FIGMENT.voteAccount).toMatch(/^[A-Za-z0-9]+$/);
      expect(LEDGER_VALIDATOR_BY_FIGMENT.voteAccount.length).toBeGreaterThan(40);
    });
  });

  describe("LEDGER_VALIDATOR_BY_CHORUS_ONE", () => {
    it("should have all required properties including APY", () => {
      expect(LEDGER_VALIDATOR_BY_CHORUS_ONE).toEqual({
        voteAccount: "CpfvLiiPALdzZTP3fUrALg2TXwEDSAknRh1sn5JCt9Sr",
        name: "Ledger by Chorus One",
        avatarUrl:
          "https://s3.amazonaws.com/keybase_processed_uploads/3c47b62f3d28ecfd821536f69be82905_360_360.jpg",
        wwwUrl: "https://www.ledger.com/staking",
        activeStake: expect.any(Number),
        commission: 7,
        totalScore: 7,
        apy: expect.any(Number),
      });
    });

    it("should have a valid APY value", () => {
      expect(LEDGER_VALIDATOR_BY_CHORUS_ONE.apy).toBeGreaterThan(0);
      expect(LEDGER_VALIDATOR_BY_CHORUS_ONE.apy).toBeLessThan(1);
      expect(typeof LEDGER_VALIDATOR_BY_CHORUS_ONE.apy).toBe("number");
    });

    it("should have a valid voteAccount address", () => {
      expect(LEDGER_VALIDATOR_BY_CHORUS_ONE.voteAccount).toMatch(/^[A-Za-z0-9]+$/);
      expect(LEDGER_VALIDATOR_BY_CHORUS_ONE.voteAccount.length).toBeGreaterThan(40);
    });
  });

  describe("LEDGER_VALIDATOR_DEFAULT", () => {
    it("should reference LEDGER_VALIDATOR_BY_FIGMENT", () => {
      expect(LEDGER_VALIDATOR_DEFAULT).toBe(LEDGER_VALIDATOR_BY_FIGMENT);
    });

    it("should have APY property", () => {
      expect(LEDGER_VALIDATOR_DEFAULT.apy).toBeDefined();
      expect(typeof LEDGER_VALIDATOR_DEFAULT.apy).toBe("number");
    });
  });

  describe("APY values consistency", () => {
    it("should have different APY values for different validators", () => {
      expect(LEDGER_VALIDATOR_BY_FIGMENT.apy).not.toBe(LEDGER_VALIDATOR_BY_CHORUS_ONE.apy);
    });

    it("should have reasonable APY values", () => {
      // APY should be reasonable for Solana staking (typically between 3-20%)
      const figmentApy = LEDGER_VALIDATOR_BY_FIGMENT.apy!;
      const chorusApy = LEDGER_VALIDATOR_BY_CHORUS_ONE.apy!;

      expect(figmentApy).toBeGreaterThanOrEqual(0.03);
      expect(figmentApy).toBeLessThanOrEqual(0.2);

      expect(chorusApy).toBeGreaterThanOrEqual(0.03);
      expect(chorusApy).toBeLessThanOrEqual(0.2);
    });
  });
});
