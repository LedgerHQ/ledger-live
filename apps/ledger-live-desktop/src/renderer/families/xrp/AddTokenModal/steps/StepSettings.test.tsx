import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMaxTrustLimitForToken } from "@ledgerhq/live-common/families/xrp/logicPublic";
import {
  XrpAccountNotActivated,
  XrpTrustLimitTooHigh,
  XrpTrustLimitZero,
  XrpTrustSetUnchanged,
  type Transaction,
} from "@ledgerhq/live-common/families/xrp/types";
import { XRP_ACCOUNT, makeXrpTokenAccount } from "../../__mocks__/account.mock";
import { xrpRlusdToken } from "../../__mocks__/currency.mock";
import { makeStepProps } from "../../__mocks__/stepProps.mock";
import { makeStatus, optIn } from "../../__mocks__/transaction.mock";
import type { StepProps } from "../types";
import StepSettings, { StepSettingsFooter } from "./StepSettings";

const RIPPLING_WARNING = /Turning this on allows other users' payments to move your balance/;
const BALANCE_WARNING = /Your balance .* is above this limit/;
const ZERO_LIMIT_MESSAGE = "Your limit is 0: you can't receive this token.";
const UNCHANGED_MESSAGE = "These settings are already in place";

function toBaseUnits(value: number): BigNumber {
  return new BigNumber(value).shiftedBy(xrpRlusdToken.units[0].magnitude);
}

function applyLastUpdate(props: StepProps, transaction: Transaction): Transaction {
  const [update] = jest.mocked(props.onUpdateTransaction).mock.lastCall!;

  return update(transaction);
}

function renderWithFooter(props: StepProps) {
  return render(
    <>
      <StepSettings {...props} />
      <StepSettingsFooter {...props} />
    </>,
  );
}

// The step suspends until its account bridge loads
beforeAll(async () => {
  await getAccountBridge(XRP_ACCOUNT);
});

describe("StepSettings", () => {
  it("shows the limit the transaction holds", () => {
    render(
      <StepSettings {...makeStepProps({ transaction: { ...optIn, amount: toBaseUnits(1000) } })} />,
    );

    expect(screen.getByRole("textbox")).toHaveValue("1,000");
  });

  it("sends a typed limit to the transaction", async () => {
    const props = makeStepProps();
    const { user } = render(<StepSettings {...props} />);
    const input = screen.getByRole("textbox");

    await user.clear(input);
    await user.type(input, "250");

    expect(applyLastUpdate(props, optIn).amount).toEqual(toBaseUnits(250));
  });

  it("refuses a limit of 0", async () => {
    const props = makeStepProps({ status: makeStatus({ amount: new XrpTrustLimitZero() }) });
    const { user } = renderWithFooter(props);

    await user.click(screen.getByText("Continue"));

    expect(props.transitionTo).not.toHaveBeenCalled();
  });

  it("puts Max back in the transaction", async () => {
    const maxLimit = getMaxTrustLimitForToken();
    const props = makeStepProps({ maxLimit });
    const { user } = render(<StepSettings {...props} />);

    await user.click(screen.getByText("Max"));

    expect(applyLastUpdate(props, optIn).amount).toEqual(maxLimit);
  });

  it("leaves an unactivated account to the review step", async () => {
    const status = makeStatus({ amount: new XrpAccountNotActivated("", { amount: "1.2 XRP" }) });
    const props = makeStepProps({ status });
    const { user } = renderWithFooter(props);

    await user.click(screen.getByText("Continue"));

    expect(screen.queryByText("Your account isn't activated yet")).not.toBeInTheDocument();
    expect(props.transitionTo).toHaveBeenCalledTimes(1);
    expect(props.transitionTo).toHaveBeenCalledWith("review");
  });

  it("warns when the limit is below the balance, and still continues to the review", async () => {
    const props = makeStepProps({
      transaction: { ...optIn, amount: toBaseUnits(1000) },
      tokenAccount: { ...makeXrpTokenAccount(), balance: toBaseUnits(2000) },
    });
    const { user } = renderWithFooter(props);

    expect(screen.getByText(BALANCE_WARNING)).toBeVisible();

    await user.click(screen.getByText("Continue"));

    expect(props.transitionTo).toHaveBeenCalledTimes(1);
    expect(props.transitionTo).toHaveBeenCalledWith("review");
  });

  it("shows no balance warning when the limit is at or above the balance", () => {
    const props = makeStepProps({
      transaction: { ...optIn, amount: toBaseUnits(1000) },
      tokenAccount: { ...makeXrpTokenAccount(), balance: toBaseUnits(1000) },
    });

    render(<StepSettings {...props} />);

    expect(screen.queryByText(BALANCE_WARNING)).not.toBeInTheDocument();
  });

  it("shows a limit above the maximum as an error", () => {
    render(
      <StepSettings
        {...makeStepProps({ status: makeStatus({ amount: new XrpTrustLimitTooHigh() }) })}
      />,
    );

    expect(screen.getByText("The limit is above the maximum")).toBeVisible();
  });

  it("turns rippling on when the user clicks the rippling switch", async () => {
    const props = makeStepProps();
    const { user } = render(<StepSettings {...props} />);

    await user.click(screen.getByTestId("xrp-rippling-switch"));

    expect(props.onChangeRippling).toHaveBeenCalledTimes(1);
    expect(props.onChangeRippling).toHaveBeenCalledWith(true);
  });

  it("turns rippling off when the user clicks the rippling switch again", async () => {
    const props = makeStepProps({ isRippling: true });
    const { user } = render(<StepSettings {...props} />);

    await user.click(screen.getByTestId("xrp-rippling-switch"));

    expect(props.onChangeRippling).toHaveBeenCalledTimes(1);
    expect(props.onChangeRippling).toHaveBeenCalledWith(false);
  });

  it("warns about rippling while rippling is on", () => {
    render(<StepSettings {...makeStepProps({ isRippling: true })} />);

    expect(screen.getByText(RIPPLING_WARNING)).toBeVisible();
  });

  it("leaves the rippling warning out while rippling is off", () => {
    render(<StepSettings {...makeStepProps()} />);

    expect(screen.queryByText(RIPPLING_WARNING)).not.toBeInTheDocument();
  });

  it("shows a transaction preparation error", () => {
    render(<StepSettings {...makeStepProps({ error: new Error("prepare failed") })} />);

    expect(screen.getByText(/prepare failed/)).toBeVisible();
  });
});

describe("StepSettings, editing a held token", () => {
  it("says a current limit of 0 lets no token in, instead of the limit error", async () => {
    const props = makeStepProps({
      tokenAccount: makeXrpTokenAccount({ limit: new BigNumber(0) }),
      status: makeStatus({ amount: new XrpTrustLimitZero() }),
    });
    const { user } = renderWithFooter(props);

    expect(screen.getByText(ZERO_LIMIT_MESSAGE)).toBeVisible();
    expect(screen.queryByText("The limit must be above 0")).not.toBeInTheDocument();

    await user.click(screen.getByText("Continue"));

    expect(props.transitionTo).not.toHaveBeenCalled();
  });

  it("keeps Continue disabled while the settings are unchanged, with no error shown", async () => {
    const props = makeStepProps({
      tokenAccount: makeXrpTokenAccount(),
      status: makeStatus({ transaction: new XrpTrustSetUnchanged() }),
    });
    const { user } = renderWithFooter(props);

    expect(screen.queryByText(UNCHANGED_MESSAGE)).not.toBeInTheDocument();

    await user.click(screen.getByText("Continue"));

    expect(props.transitionTo).not.toHaveBeenCalled();
  });

  it("shows no limit 0 message when the new limit is above 0", () => {
    const props = makeStepProps({
      tokenAccount: makeXrpTokenAccount({ limit: new BigNumber(0) }),
      transaction: { ...optIn, amount: toBaseUnits(1000) },
    });

    render(<StepSettings {...props} />);

    expect(screen.queryByText(ZERO_LIMIT_MESSAGE)).not.toBeInTheDocument();
  });
});
