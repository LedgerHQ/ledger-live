import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { Account } from "@ledgerhq/types-live";
import {
  getAddressVerification,
  notifyOnDeviceRequest,
  type VerifyAddressIntentInput,
} from "@features/platform-intent-verify-address";
import { getFreshAccountAddress } from "~/utils/address";

export function buildVerifyAddressIntentInput(mainAccount: Account): VerifyAddressIntentInput {
  const { freshAddressPath, currency, derivationMode } = mainAccount;

  return {
    expectedAddress: getFreshAccountAddress(mainAccount),
    startAddressVerification: ({ dmk, sessionId }) =>
      getAddressVerification(onDeviceRequest =>
        getAddress(new DmkCompatTransport(notifyOnDeviceRequest(dmk, onDeviceRequest), sessionId), {
          currency,
          path: freshAddressPath,
          derivationMode,
          verify: true,
        }),
      ),
  };
}
