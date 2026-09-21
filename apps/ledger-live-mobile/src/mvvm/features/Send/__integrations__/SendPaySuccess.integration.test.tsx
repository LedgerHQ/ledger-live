import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { setEnv } from "@shared/env";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContactWithAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import {
  SEND_FLOW_SOURCE,
  SEND_FLOW_STEP,
  type SendFlowInitParams,
  type SendFlowStep,
} from "@ledgerhq/live-common/flows/send/types";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import { act, renderWithReactQuery, screen, withFlagOverrides } from "@tests/test-renderer";
import type { Account } from "@ledgerhq/types-live";
import type { State } from "~/reducers/types";
import { SendFlowOrchestrator } from "../SendFlowOrchestrator";
import { SEND_FLOW_CONFIG } from "../constants";
import { RecipientScreen } from "../screens/Recipient";
import { AmountScreen } from "../screens/Amount";
import { CustomFeesScreen } from "../screens/CustomFees";
import { CoinControlScreen } from "../screens/CoinControl";
import { ConfirmationScreen } from "../screens/Confirmation";
import { PaySuccessScreen } from "../screens/PaySuccess";

jest.mock("../screens/Signature", () => {
  const ReactModule = jest.requireActual<typeof import("react")>("react");
  const { useSendSignature } = jest.requireActual("../context/SendSignatureContext");

  return {
    SignatureScreen: function SignatureScreenAutoComplete() {
      const { finishSigning } = useSendSignature();
      ReactModule.useEffect(() => {
        finishSigning();
      }, [finishSigning]);
      return null;
    },
  };
});

jest.mock("LLM/features/Contacts/hooks/useContactsAddressValidationAdapter", () => ({
  useContactsAddressValidationAdapter: () => ({
    validateAddress: async ({ address }: { address: string }) => ({
      status: "valid",
      resolvedAddress: address,
      isDomain: false,
    }),
  }),
}));

const ethereum = getCryptoCurrencyById("ethereum");
const account = genAccount("pay-success-send", { currency: ethereum });
const ada = mockContactWithAddress({ id: "contact-ada", name: "Ada" });
const adaAddress = ada.addresses[0]!.address;

const stepRegistry: StepRegistry<SendFlowStep> = {
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
  [SEND_FLOW_STEP.RECENT_HISTORY]: () => null,
  [SEND_FLOW_STEP.AMOUNT]: AmountScreen,
  [SEND_FLOW_STEP.CUSTOM_FEES]: CustomFeesScreen,
  [SEND_FLOW_STEP.COIN_CONTROL]: CoinControlScreen,
  [SEND_FLOW_STEP.SIGNATURE]: () => null,
  [SEND_FLOW_STEP.CONFIRMATION]: ConfirmationScreen,
  [SEND_FLOW_STEP.PAY_SUCCESS]: PaySuccessScreen,
};

const HostStack = createNativeStackNavigator();

function SendPage({ initParams }: { initParams: SendFlowInitParams }) {
  return (
    <HostStack.Navigator screenOptions={{ headerShown: false }}>
      <HostStack.Screen name="SendHost">
        {() => (
          <SendFlowOrchestrator
            initParams={initParams}
            onClose={() => {}}
            stepRegistry={stepRegistry}
            flowConfig={SEND_FLOW_CONFIG}
          />
        )}
      </HostStack.Screen>
    </HostStack.Navigator>
  );
}

function renderSend(initParams: Omit<SendFlowInitParams, "account">, accountOverride: Account) {
  return renderWithReactQuery(
    <SendPage initParams={{ account: accountOverride, ...initParams }} />,
    {
      overrideInitialState: withFlagOverrides(
        {
          lwmContacts: { enabled: true, params: { newBadge: false } },
          newSendFlow: { enabled: true, params: { families: ["evm"], excludedCurrencyIds: [] } },
        },
        (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [accountOverride] },
          contacts: { contacts: [mockMeContact(), ada] },
        }),
      ),
    },
  );
}

async function reviewSend(user: ReturnType<typeof renderSend>["user"]) {
  await user.press(await screen.findByText("50%"));
  await user.press(await screen.findByText("Review"));
  await act(async () => {
    await Promise.resolve();
  });
}

describe("Send Pay success", () => {
  beforeAll(() => {
    setEnv("MOCK", "1");
  });

  afterAll(() => {
    setEnv("MOCK", "");
  });

  it("should show the contact success screen when the send source is Pay", async () => {
    const { user } = renderSend(
      {
        recipient: adaAddress,
        skipRecipientStep: true,
        source: SEND_FLOW_SOURCE.PAY,
      },
      account,
    );

    await reviewSend(user);

    expect(await screen.findByText(/You paid \(Ada\)/)).toBeVisible();
    expect(screen.queryByTestId("send-confirmation-success")).not.toBeOnTheScreen();
  });

  it("should show send confirmation when the send source is not Pay", async () => {
    const { user } = renderSend(
      {
        recipient: adaAddress,
        skipRecipientStep: true,
        source: "Asset Detail",
      },
      account,
    );

    await reviewSend(user);

    expect(await screen.findByTestId("send-confirmation-success")).toBeVisible();
    expect(screen.queryByText(/You paid \(Ada\)/)).not.toBeOnTheScreen();
  });
});
