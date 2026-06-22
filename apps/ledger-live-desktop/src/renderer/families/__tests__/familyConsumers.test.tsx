import React from "react";
import { render, screen } from "tests/testSetup";
import type { Account } from "@ledgerhq/types-live";
import { useLLDCoinFamily } from "~/renderer/families";
import { AccountStakeBanner } from "~/renderer/screens/account/AccountStakeBanner";
import SendStepWarning, {
  StepWarningFooter as SendStepWarningFooter,
} from "~/renderer/modals/Send/steps/StepWarning";
import ReceiveStepWarning, {
  StepWarningFooter as ReceiveStepWarningFooter,
} from "~/renderer/modals/Receive/steps/StepWarning";
import SendAmountFields from "~/renderer/modals/Send/SendAmountFields";
import SignTxAmountFields from "~/renderer/modals/SignTransaction/SendAmountFields";
import SendRecipientFields, { getFields } from "~/renderer/modals/Send/SendRecipientFields";

jest.mock("~/renderer/families");
const mockFamily = jest.mocked(useLLDCoinFamily);

const account = { type: "Account", currency: { family: "test" } } as unknown as Account;
const stub = (testId: string) => () => <div data-testid={testId} />;
const sendProps = { account, parentAccount: null } as unknown as React.ComponentProps<
  typeof SendStepWarning
>;
const receiveProps = { account, parentAccount: null } as unknown as React.ComponentProps<
  typeof ReceiveStepWarning
>;

beforeEach(() => jest.clearAllMocks());

describe("AccountStakeBanner", () => {
  it("renders the family StakeBanner when provided", () => {
    mockFamily.mockReturnValue({ StakeBanner: stub("stake-banner") } as never);
    render(<AccountStakeBanner account={account} />);
    expect(screen.getByTestId("stake-banner")).toBeInTheDocument();
  });

  it("renders nothing when the family has no StakeBanner", () => {
    mockFamily.mockReturnValue({} as never);
    expect(render(<AccountStakeBanner account={account} />).container).toBeEmptyDOMElement();
  });
});

describe("Send / Receive StepWarning", () => {
  it("renders the send warning and its footer", () => {
    mockFamily.mockReturnValue({
      sendWarning: { component: stub("send-warning"), footer: stub("send-footer") },
    } as never);
    render(<SendStepWarning {...sendProps} />);
    render(<SendStepWarningFooter {...sendProps} />);
    expect(screen.getByTestId("send-warning")).toBeInTheDocument();
    expect(screen.getByTestId("send-footer")).toBeInTheDocument();
  });

  it("renders the receive warning and its footer", () => {
    mockFamily.mockReturnValue({
      receiveWarning: { component: stub("receive-warning"), footer: stub("receive-footer") },
    } as never);
    render(<ReceiveStepWarning {...receiveProps} />);
    render(<ReceiveStepWarningFooter {...receiveProps} />);
    expect(screen.getByTestId("receive-warning")).toBeInTheDocument();
    expect(screen.getByTestId("receive-footer")).toBeInTheDocument();
  });

  it("renders nothing without a warning module or account", () => {
    mockFamily.mockReturnValue({} as never);
    expect(render(<SendStepWarning {...sendProps} />).container).toBeEmptyDOMElement();
    expect(
      render(<ReceiveStepWarning {...receiveProps} account={undefined} />).container,
    ).toBeEmptyDOMElement();
  });
});

const fieldsProps = { account } as unknown as React.ComponentProps<typeof SendAmountFields>;

describe("Send / SignTransaction amount & recipient fields", () => {
  it.each([
    ["Send amount", SendAmountFields, "sendAmountFields", "send-amount"],
    ["SignTransaction amount", SignTxAmountFields, "sendAmountFields", "signtx-amount"],
    ["Send recipient", SendRecipientFields, "sendRecipientFields", "recipient"],
  ] as const)("renders the family-specific %s field", (_, Cmp, key, testId) => {
    mockFamily.mockReturnValue({ [key]: { component: stub(testId) } } as never);
    render(<Cmp {...fieldsProps} />);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it("renders nothing when the family provides no field module", () => {
    mockFamily.mockReturnValue({} as never);
    expect(render(<SendAmountFields {...fieldsProps} />).container).toBeEmptyDOMElement();
    expect(render(<SignTxAmountFields {...fieldsProps} />).container).toBeEmptyDOMElement();
    expect(render(<SendRecipientFields {...fieldsProps} />).container).toBeEmptyDOMElement();
  });
});

describe("getFields", () => {
  const acc = (family: string) => ({ currency: { family } }) as unknown as Account;

  it("returns the module fields when memo tag is disabled", () => {
    expect(getFields(acc("test"), false, { fields: ["a"] })).toEqual(["a"]);
    expect(getFields(acc("test"), false, null)).toEqual([]);
  });

  it("returns family-specific fields when memo tag is enabled", () => {
    expect(getFields(acc("internet_computer"), true)).toEqual(["transaction"]);
    expect(getFields(acc("casper"), true)).toEqual(["sender"]);
    expect(getFields(acc("test"), true, { fields: ["x"] })).toEqual(["x"]);
  });
});
