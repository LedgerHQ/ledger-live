import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { HttpResponse, http, server } from "tests/server";
import { MAX_TRUST_LIMIT_VALUE } from "@ledgerhq/live-common/families/xrp/logicPublic";
import {
  XrpAccountNotActivated,
  XrpTrustLimitTooHigh,
} from "@ledgerhq/live-common/families/xrp/types";
import type { StepProps } from "../types";
import { makeStepProps } from "../../__mocks__/stepProps.mock";
import { XRP_TOKEN, xrpMptToken } from "../../__mocks__/currency.mock";
import { makeStatus, optIn } from "../../__mocks__/transaction.mock";
import StepReview, { StepReviewFooter } from "./StepReview";

jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => null,
}));

const XRPL_TESTNET_NODE = "https://s.altnet.rippletest.net:51234";

const endpoints = { node: jest.fn<Response, [{ request: Request }]>() };

function mockTransferRate(transferRate?: number) {
  endpoints.node.mockImplementation(() => {
    const node = {
      LedgerEntryType: "AccountRoot",
      Flags: 0,
      TransferRate: transferRate,
    };

    return HttpResponse.json({ result: { node, account_data: node, status: "success" } });
  });
}

// coin-xrp caches each issuer's account root: a test that reads a fee needs its own issuer
function makeIssuerProps(contractAddress: string) {
  return { token: { ...XRP_TOKEN, contractAddress } };
}

function renderReview(overrides: Partial<StepProps> = {}) {
  const props = makeStepProps(overrides);
  const rendered = render(
    <>
      <StepReview {...props} />
      <StepReviewFooter {...props} />
    </>,
  );

  return { ...rendered, props };
}

describe("StepReview", () => {
  beforeEach(() => {
    endpoints.node.mockReset();
    mockTransferRate();
    server.use(http.post(XRPL_TESTNET_NODE, endpoints.node));
  });

  it("shows an IOU with its issuer, limit and rippling", async () => {
    renderReview({
      transaction: { ...optIn, amount: new BigNumber(1000).shiftedBy(38) },
      isRippling: true,
    });

    expect(screen.getByText("RLUSD (RLUSD)")).toBeVisible();
    expect(screen.getByText("r9fnpoGUNqCWMppMStPEQY9R4UEbpCek4")).toBeVisible();
    expect(screen.getByText("1,000 RLUSD")).toBeVisible();
    expect(screen.getByText("On")).toBeVisible();
    expect(await screen.findByText("0%")).toBeVisible();
  });

  it("continues to the device", async () => {
    const { user, props } = renderReview();

    await user.click(screen.getByText("Continue"));

    expect(props.transitionTo).toHaveBeenCalledTimes(1);
    expect(props.transitionTo).toHaveBeenCalledWith("connectDevice");
  });

  it("waits for the bridge before the device step", () => {
    renderReview({ bridgePending: true });

    expect(screen.getByRole("button", { name: /Continue/ })).toBeDisabled();
  });

  it("shows a limit above the maximum and blocks the device step", () => {
    renderReview({ status: makeStatus({ amount: new XrpTrustLimitTooHigh() }) });

    expect(screen.getByText("The limit is above the maximum")).toBeVisible();
    expect(screen.getByText("Use Max to set the highest limit.")).toBeVisible();
    expect(screen.getByRole("button", { name: /Continue/ })).toBeDisabled();
  });

  it("asks an unactivated account to receive XRP, and opens Receive on it", async () => {
    const error = new XrpAccountNotActivated("", { amount: "1.2 XRP" });
    const { user, props, store } = renderReview({ status: makeStatus({ amount: error }) });

    expect(screen.getByText("Your account isn't activated yet")).toBeVisible();
    expect(screen.getByText(/Receive at least 1.2 XRP to activate it/)).toBeVisible();
    expect(screen.getByRole("button", { name: /Continue/ })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Receive" }));

    const receiveModal = store.getState().modals.MODAL_RECEIVE;

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(receiveModal).toMatchObject({ isOpened: true, data: { account: props.account } });
  });

  it("shows no Receive action for another error", () => {
    renderReview({ status: makeStatus({ amount: new XrpTrustLimitTooHigh() }) });

    expect(screen.queryByRole("button", { name: "Receive" })).not.toBeInTheDocument();
  });

  it("shows Not available when the issuer fee read fails, and still continues", async () => {
    endpoints.node.mockImplementation(() => HttpResponse.error());

    const { user, props } = renderReview(makeIssuerProps("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"));

    expect(await screen.findByText("Not available")).toBeVisible();

    await user.click(screen.getByText("Continue"));

    expect(props.transitionTo).toHaveBeenCalledTimes(1);
    expect(props.transitionTo).toHaveBeenCalledWith("connectDevice");
  });

  it("shows the issuer fee as a percentage", async () => {
    mockTransferRate(1_005_000_000);

    renderReview(makeIssuerProps("rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV"));

    expect(await screen.findByText("0.5%")).toBeVisible();
    expect(screen.getByText("Issuer fee")).toBeVisible();
  });

  it("shows Maximum for a limit at the protocol maximum", async () => {
    render(
      <StepReview
        {...makeStepProps({ transaction: { ...optIn, amount: MAX_TRUST_LIMIT_VALUE } })}
      />,
    );

    expect(await screen.findByText("Maximum")).toBeVisible();
  });

  it("shows a limit above 16 integer digits in scientific notation", async () => {
    render(
      <StepReview
        {...makeStepProps({
          transaction: { ...optIn, amount: MAX_TRUST_LIMIT_VALUE.shiftedBy(-1) },
        })}
      />,
    );

    expect(await screen.findByText(/^9\.999999999999999e94 /)).toBeVisible();
  });

  it("shows no limit or rippling for an MPT", () => {
    render(<StepReview {...makeStepProps({ token: xrpMptToken })} />);

    expect(screen.getByText("Test MPT (TMPT)")).toBeVisible();
    expect(screen.queryByText("Trust limit")).not.toBeInTheDocument();
    expect(screen.queryByText("Rippling")).not.toBeInTheDocument();
  });
});
