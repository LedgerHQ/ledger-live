import { readFileSync } from "fs";
import { join } from "path";
import { SendPerfFixture } from "../../engine/fixtureTypes";

/** Fixture metadata for weighting report (no bitcoin-core dependency). */
export const BTC_LAYER1_STUBS: SendPerfFixture[] = JSON.parse(
  readFileSync(join(__dirname, "../../../fixtures/btc/index.json"), "utf8"),
);
