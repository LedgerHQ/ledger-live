import { render, screen, userEvent } from "@support/jest-devtools/native";
import PayCard from "./PayCard";
import type { PayCardToolProps } from "../types";

function buildProps(): PayCardToolProps {
  return {
    flags: {
      payTabEnabled: false,
      cardParam: false,
      ptxCardEnabled: false,
      setPayTabEnabled: jest.fn(),
      setCardParam: jest.fn(),
      setPtxCardEnabled: jest.fn(),
    },
    onboarding: {
      steps: [
        {
          id: "step1",
          label: "Step 1",
          done: false,
        },
      ],
      setStepDone: jest.fn(),
    },
    interaction: { probes: [] },
    balance: {
      total: 0,
      isPartialTotal: false,
      wallets: [],
      isFetching: false,
      errors: [],
      load: jest.fn(),
      refresh: jest.fn(),
    },
    hasSeenFeatureTour: false,
    resetPayCardFeatureTourSeen: jest.fn(),
    hasSeenReceiveVerifyHint: false,
    resetReceiveVerifyHintSeen: jest.fn(),
    env: {
      vars: [
        {
          key: "CARD_API_URL",
          value: "https://card.api.live.ledger.com",
          suggestedValue: "https://dev.api.baanx.com",
        },
        { key: "CARD_BAANX_CLIENT_KEY", value: "", suggestedValue: "dev-client-key" },
      ],
      setVar: jest.fn(),
    },
  };
}

describe("PayCard (native)", () => {
  it("renders every section", () => {
    render(<PayCard {...buildProps()} />);
    expect(screen.getByText("Card Debug")).toBeTruthy();
    expect(screen.getByText("Card interaction")).toBeTruthy();
    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByText("Feature flags")).toBeTruthy();
    expect(screen.getByText("Onboarding")).toBeTruthy();
    expect(screen.getByText("Feature tour")).toBeTruthy();
    expect(screen.getByText("Request verify hint")).toBeTruthy();
  });

  it("resets the feature tour", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} />);

    await user.press(screen.getByText("Reset feature tour"));
    expect(props.resetPayCardFeatureTourSeen).toHaveBeenCalledTimes(1);
  });

  it("resets the request verify hint", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} />);

    await user.press(screen.getByText("Reset verify hint"));
    expect(props.resetReceiveVerifyHintSeen).toHaveBeenCalledTimes(1);
  });

  it("hides quick actions when the host does not pass navigation", () => {
    render(<PayCard {...buildProps()} />);
    expect(screen.queryByText("Quick actions")).toBeNull();
  });

  it("navigates to Portfolio and Pay when the host wires the actions", async () => {
    const user = userEvent.setup();
    const onNavigateToPortfolio = jest.fn();
    const onNavigateToPayTab = jest.fn();
    render(
      <PayCard
        {...buildProps()}
        onNavigateToPortfolio={onNavigateToPortfolio}
        onNavigateToPayTab={onNavigateToPayTab}
      />,
    );

    expect(screen.getByText("Quick actions")).toBeTruthy();
    await user.press(screen.getByText("Go to Portfolio"));
    await user.press(screen.getByText("Go to Pay tab"));
    expect(onNavigateToPortfolio).toHaveBeenCalledTimes(1);
    expect(onNavigateToPayTab).toHaveBeenCalledTimes(1);
  });

  it("shows both Card env vars, and the value the app reads now", () => {
    render(<PayCard {...buildProps()} />);

    expect(screen.getByText("Env vars")).toBeTruthy();
    expect(screen.getByText("CARD_API_URL=https://card.api.live.ledger.com")).toBeTruthy();
    // An empty client key must read as empty, and not as a missing row.
    expect(screen.getByText("CARD_BAANX_CLIENT_KEY=(empty)")).toBeTruthy();
  });

  it("fills each input with the suggested value, so one press changes the tenant", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} />);

    expect(screen.getByTestId("pay-card-env-input-CARD_API_URL").props.value).toBe(
      "https://dev.api.baanx.com",
    );

    await user.press(screen.getAllByText("Set")[0]!);
    expect(props.env.setVar).toHaveBeenCalledWith("CARD_API_URL", "https://dev.api.baanx.com");
  });

  it("sets what the tester typed", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} />);

    const input = screen.getByTestId("pay-card-env-input-CARD_API_URL");
    await user.clear(input);
    await user.type(input, "https://card.api.live.ledger.com");
    await user.press(screen.getAllByText("Set")[0]!);

    expect(props.env.setVar).toHaveBeenCalledWith(
      "CARD_API_URL",
      "https://card.api.live.ledger.com",
    );
  });

  it("opens the interaction screen and runs a probe", async () => {
    const user = userEvent.setup();
    const run = jest.fn();
    const props = buildProps();
    render(
      <PayCard
        {...props}
        interaction={{
          probes: [
            {
              id: "card-status",
              label: "Card Status",
              isFetching: false,
              result: undefined,
              error: undefined,
              run,
            },
          ],
        }}
      />,
    );

    await user.press(screen.getByText("Card interaction"));
    // The tool swaps its whole body for the probes, so the flag rows are gone.
    expect(screen.queryByText("Feature flags")).toBeNull();

    // The probe names itself; there is no generic "Fetch".
    await user.press(screen.getByText("Card Status"));
    expect(run).toHaveBeenCalledTimes(1);

    await user.press(screen.getByText("Back"));
    expect(screen.getByText("Feature flags")).toBeTruthy();
  });

  it("shows what a probe came back with", async () => {
    const user = userEvent.setup();
    render(
      <PayCard
        {...buildProps()}
        interaction={{
          probes: [
            {
              id: "card-status",
              label: "Card Status",
              isFetching: false,
              result: '{ "status": "ACTIVE" }',
              error: undefined,
              run: jest.fn(),
            },
          ],
        }}
      />,
    );

    await user.press(screen.getByText("Card interaction"));

    expect(screen.getByText('{ "status": "ACTIVE" }')).toBeTruthy();
  });

  // One priced wallet and one the rates could not price: the pair the total is built from.
  const wallets = [
    {
      id: "w-usdc",
      currency: "usdc",
      network: "ethereum",
      address: "0xusdc",
      priority: 0,
      balance: "125.40",
      counterValue: 12540,
    },
    {
      id: "w-sol",
      currency: "sol",
      network: "solana",
      address: "sol-addr",
      priority: 1,
      balance: "2.5",
      counterValue: null,
    },
  ];

  it("requests the linked wallets when the balance screen opens, and shows the total", async () => {
    const user = userEvent.setup();
    const load = jest.fn();
    const props = buildProps();
    render(<PayCard {...props} balance={{ ...props.balance, total: 12540, wallets, load }} />);

    await user.press(screen.getByText("Balance"));

    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Total amount")).toBeTruthy();
    // Twice: the total, and the one wallet it was summed from.
    expect(screen.getAllByText("12540")).toHaveLength(2);
  });

  it("reports an absent total as undefined rather than as a blank", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} balance={{ ...props.balance, total: undefined }} />);

    await user.press(screen.getByText("Balance"));

    expect(screen.getByText("undefined")).toBeTruthy();
  });

  it("shows every field of every linked wallet", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} balance={{ ...props.balance, wallets }} />);

    await user.press(screen.getByText("Balance"));

    expect(screen.getByText("0. usdc / ethereum")).toBeTruthy();
    // The provider's own ids, unmapped, so a mapping gap can be read off the screen.
    expect(screen.getByText("usdc")).toBeTruthy();
    expect(screen.getByText("ethereum")).toBeTruthy();
    expect(screen.getByText("sol")).toBeTruthy();
    expect(screen.getByText("solana")).toBeTruthy();
    expect(screen.getByText("125.40")).toBeTruthy();
    expect(screen.getByText("0xusdc")).toBeTruthy();
    expect(screen.getByText("w-usdc")).toBeTruthy();

    // The unpriced wallet says why it is missing from the total rather than reading as zero.
    expect(screen.getByText("1. sol / solana")).toBeTruthy();
    expect(
      screen.getByText("null — no balance yet, no currency matched this ticker, or no rate for it"),
    ).toBeTruthy();
  });

  it("shows which endpoint failed and what it answered", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(
      <PayCard
        {...props}
        balance={{
          ...props.balance,
          errors: [
            {
              endpoint: "GET /v1/wallet/internal",
              detail: '{ "status": "CUSTOM_ERROR", "error": "responseSchema rejected" }',
            },
          ],
        }}
      />,
    );

    await user.press(screen.getByText("Balance"));

    expect(screen.getByText("GET /v1/wallet/internal")).toBeTruthy();
    expect(
      screen.getByText('{ "status": "CUSTOM_ERROR", "error": "responseSchema rejected" }'),
    ).toBeTruthy();
  });

  it("refetches the linked wallets from the balance screen", async () => {
    const user = userEvent.setup();
    const refresh = jest.fn();
    const props = buildProps();
    render(<PayCard {...props} balance={{ ...props.balance, refresh }} />);

    await user.press(screen.getByText("Balance"));
    await user.press(screen.getByLabelText("Refresh"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("wires onboarding actions", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} />);

    // Label is display-only; ToggleRow wires onChange on the Switch.
    const switches = screen.getAllByRole("switch");
    await user.press(switches[switches.length - 1]!);
    expect(props.onboarding.setStepDone).toHaveBeenCalledWith("step1", true);
  });
});
