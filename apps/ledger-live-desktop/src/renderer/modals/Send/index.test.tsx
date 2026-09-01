import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  isZcashShieldedEnabled,
  setZcashShieldedEnabled,
} from "@ledgerhq/live-common/bridge/zcashRouting";
import { render, screen } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import SendModal from "./index";

jest.mock("./Body", () => ({
  __esModule: true,
  default: ({ stepId }: { stepId: string }) => <div data-testid="send-step">{stepId}</div>,
}));

jest.mock("~/renderer/components/Modal", () => ({
  __esModule: true,
  default: ({
    render: renderModal,
  }: {
    render: (props: { onClose: () => void; data: unknown }) => React.ReactNode;
  }) => <>{renderModal({ onClose: () => undefined, data: {} })}</>,
}));

jest.mock("LLD/features/Send/hooks/useNewSendFlowFeature", () => ({
  useNewSendFlowFeature: () => ({
    isEnabledForFamily: () => false,
    getFamilyFromAccount: () => undefined,
    getCurrencyIdFromAccount: () => undefined,
  }),
}));

const SHIELDED_RECIPIENT =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";
const TRANSPARENT_RECIPIENT = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";

function renderOpenedSendModal({
  account,
  recipient,
  skipRecipientStep,
}: {
  account: ReturnType<typeof genAccount>;
  recipient: string;
  skipRecipientStep: boolean;
}) {
  return render(<SendModal />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: {
        MODAL_SEND: {
          isOpened: true,
          data: {
            account,
            parentAccount: null,
            recipient,
            skipRecipientStep,
          },
        },
      },
    },
  });
}

describe("SendModal skip-recipient", () => {
  const previousShieldedEnabled = isZcashShieldedEnabled();

  beforeEach(() => {
    setZcashShieldedEnabled(true);
  });

  afterEach(() => {
    setZcashShieldedEnabled(previousShieldedEnabled);
  });

  it("should keep the recipient step for a shielded Zcash direct recipient", () => {
    const account = genAccount("legacy-send-zcash-shielded", {
      currency: getCryptoCurrencyById("zcash"),
    });

    renderOpenedSendModal({
      account,
      recipient: SHIELDED_RECIPIENT,
      skipRecipientStep: true,
    });

    expect(screen.getByTestId("send-step")).toHaveTextContent("recipient");
  });

  it("should start on amount for a transparent Zcash direct recipient", () => {
    const account = genAccount("legacy-send-zcash-transparent", {
      currency: getCryptoCurrencyById("zcash"),
    });

    renderOpenedSendModal({
      account,
      recipient: TRANSPARENT_RECIPIENT,
      skipRecipientStep: true,
    });

    expect(screen.getByTestId("send-step")).toHaveTextContent("amount");
  });
});
