import { createSponsoredSendApi } from "@ledgerhq/coin-tron/api/index";
import type { SponsoredCoinApi } from "../../bridge/generic-coin-framework/sponsored";

// live-common reaches coin-tron's seam through a cast (createLocalTronSponsoredApi), so a member
// renamed on one side still compiles on both. The compiler checks this record against the
// interface; the test checks it against coin-tron's real seam.
const SEAM_MEMBERS: Record<keyof SponsoredCoinApi, true> = {
  feeOptionId: true,
  providerName: true,
  waivesErrorKeys: true,
  waivesWarningKeys: true,
  reservationDedupKey: true,
  listFeeOptions: true,
  estimateSponsoredFeeQuote: true,
  buildEnergyRentRequest: true,
  craftEnergyRentTransaction: true,
  submitEnergyRentPayment: true,
  getEnergyRentStatus: true,
  awaitEnergyDelivery: true,
  isEnergyDelivered: true,
  getEnergyRentSignaturePayload: true,
  buildSignedEnergyRentTransaction: true,
  rentPayment: true,
};

describe("sponsored seam drift", () => {
  it("coin-tron's seam exposes exactly the members live-common's interface declares", () => {
    const context = { logger: jest.fn(), config: jest.fn() } as unknown as Parameters<
      typeof createSponsoredSendApi
    >[0];

    expect(Object.keys(createSponsoredSendApi(context)).sort()).toEqual(
      Object.keys(SEAM_MEMBERS).sort(),
    );
  });
});
