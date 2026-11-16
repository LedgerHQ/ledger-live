import React from "react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { fireEvent, render, screen } from "tests/testSetup";
import StepToken, { StepTokenFooter } from "./StepToken";
import { useTokenOptions } from "../useTokenOptions";
import { xrpIouToken } from "../../__mocks__/currency.mock";
import { makeStepProps } from "../../__mocks__/stepProps.mock";

jest.mock("../useTokenOptions");
const mockUseTokenOptions = jest.mocked(useTokenOptions);

type SelectProps = {
  onChange: (token: TokenCurrency) => void;
  onScrollEnd: () => void;
  noOptionsMessage: (input: { inputValue: string }) => string;
};
const mockSelect = jest.fn<null, [SelectProps]>(() => null);
jest.mock("~/renderer/components/Select", () => ({
  __esModule: true,
  default: (props: SelectProps) => mockSelect(props),
}));
const selectProps = () => mockSelect.mock.lastCall![0];

const rlusd = xrpIouToken;
const rlusdFromOtherIssuer = { ...xrpIouToken, contractAddress: "rOtherIssuer" };

function renderFooter(token: TokenCurrency, transactionToken: TokenCurrency) {
  const transaction = {
    assetReference: transactionToken.tokenIdentifier,
    assetOwner: transactionToken.contractAddress,
  } as Transaction;

  render(<StepTokenFooter {...makeStepProps({ token, transaction })} />);
}

describe("StepTokenFooter", () => {
  it("waits while the transaction holds the same code from another issuer", () => {
    renderFooter(rlusdFromOtherIssuer, rlusd);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("continues once the transaction holds the picked token", () => {
    renderFooter(rlusdFromOtherIssuer, rlusdFromOtherIssuer);

    expect(screen.getByRole("button")).toBeEnabled();
  });
});

describe("StepToken", () => {
  const retry = jest.fn();
  const loadNext = jest.fn();

  function renderStepToken(options: Partial<ReturnType<typeof useTokenOptions>> = {}) {
    mockUseTokenOptions.mockReturnValue({
      options: [],
      isLoading: false,
      isError: false,
      loadNext,
      retry,
      ...options,
    } as ReturnType<typeof useTokenOptions>);
    const props = makeStepProps({ token: undefined, t: ((key: string) => key) as never });
    render(<StepToken {...props} />);
    return props;
  }

  it("picks a token and loads more on scroll", () => {
    const { onChangeToken } = renderStepToken({ options: [rlusd] });

    selectProps().onChange(rlusd);
    selectProps().onScrollEnd();

    expect(onChangeToken).toHaveBeenCalledWith(rlusd);
    expect(loadNext).toHaveBeenCalled();
  });

  it("says no token is available once the list is empty", () => {
    renderStepToken();

    expect(selectProps().noOptionsMessage({ inputValue: "" })).toBe(
      "xrp.addToken.steps.token.empty",
    );
  });

  it("says nothing matches a search", () => {
    renderStepToken({ options: [rlusd] });

    expect(selectProps().noOptionsMessage({ inputValue: "btc" })).toBe("common.selectNoResults");
  });

  it("shows a transaction preparation error", () => {
    mockUseTokenOptions.mockReturnValue({
      options: [rlusd],
      isLoading: false,
      isError: false,
      loadNext,
      retry,
    });
    render(<StepToken {...makeStepProps({ error: new Error("prepare failed") })} />);

    expect(screen.getByText(/prepare failed/)).toBeVisible();
  });

  it("reports a failed load instead of an empty list, with a retry", () => {
    renderStepToken({ isError: true });

    expect(selectProps().noOptionsMessage({ inputValue: "" })).toBe(
      "xrp.addToken.steps.token.loadError",
    );
    fireEvent.click(screen.getByText("Retry"));
    expect(retry).toHaveBeenCalled();
  });
});
