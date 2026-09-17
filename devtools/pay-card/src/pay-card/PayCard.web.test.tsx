import { render, screen, fireEvent } from "@testing-library/react";
import PayCard from "./PayCard";
import type { PayCardToolProps } from "../types";

const baanxWallets = [
  { id: "w-usdc", balance: "125.40", currency: "usdc", address: "0xusdc", addressMemo: null },
];

// The second link has no Baanx wallet behind it, which is what the join has to show.
const linkedWallets = [
  {
    id: "w-usdc",
    address: "0xusdc",
    currency: "usdc",
    network: "ethereum",
    priority: 0,
    ledgerId: "ethereum/erc20/usd__coin",
  },
  { id: "w-sol", address: "sol-addr", currency: "sol", network: "solana", priority: 1 },
];

const combinedWallets = [
  {
    id: "w-usdc",
    address: "0xusdc",
    currency: "usdc",
    network: "ethereum",
    priority: 0,
    ledgerId: "ethereum/erc20/usd__coin",
    balance: "125.40",
  },
  {
    id: "w-sol",
    address: "sol-addr",
    currency: "sol",
    network: "solana",
    priority: 1,
    balance: null,
  },
];

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
    cardOnboarding: {
      steps: [],
      completedCount: 0,
      isFetching: false,
      error: undefined,
      raw: "{}",
      refresh: jest.fn(),
      setStepDone: jest.fn(),
      clearMocks: jest.fn(),
      isMockingEnabled: true,
    },
    interaction: {
      probes: [],
      details: {
        imageUrl: undefined,
        isFetching: false,
        error: undefined,
        request: jest.fn(),
        clear: jest.fn(),
      },
    },
    balance: {
      baanxWallets: [],
      linkedWallets: [],
      combinedWallets: [],
      isFetching: false,
      errors: [],
      load: jest.fn(),
      refresh: jest.fn(),
    },
    currencyMapping: [{ key: "usdc.ethereum", ledgerId: "ethereum/erc20/usd__coin" }],
    hasSeenFeatureTour: false,
    resetPayCardFeatureTourSeen: jest.fn(),
    hasSeenReceiveVerifyHint: false,
    resetReceiveVerifyHintSeen: jest.fn(),
    hasSeenLoginIntro: false,
    resetPayCardLoginIntroSeen: jest.fn(),
    hasCompletedCardOnboarding: false,
    resetCardOnboarding: jest.fn(),
  };
}

describe("PayCard (web)", () => {
  it("renders every section", () => {
    render(<PayCard {...buildProps()} />);
    expect(screen.getByText("Feature flags")).toBeDefined();
    expect(screen.getByText("Feature tour")).toBeDefined();
    expect(screen.getByText("Request verify hint")).toBeDefined();
    expect(screen.getByText("Card login intro")).toBeDefined();
  });

  it("resets the feature tour", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.click(screen.getByText("Reset feature tour"));
    expect(props.resetPayCardFeatureTourSeen).toHaveBeenCalledTimes(1);
  });

  it("resets the request verify hint", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.click(screen.getByText("Reset verify hint"));
    expect(props.resetReceiveVerifyHintSeen).toHaveBeenCalledTimes(1);
  });

  it("hides quick actions when the host does not pass navigation", () => {
    render(<PayCard {...buildProps()} />);
    expect(screen.queryByText("Quick actions")).toBeNull();
  });

  it("navigates to Portfolio and Pay when the host wires the actions", () => {
    const onNavigateToPortfolio = jest.fn();
    const onNavigateToPayTab = jest.fn();
    const onNavigateToPaySuccess = jest.fn();
    const onNavigateToSendSuccess = jest.fn();
    render(
      <PayCard
        {...buildProps()}
        onNavigateToPortfolio={onNavigateToPortfolio}
        onNavigateToPayTab={onNavigateToPayTab}
        onNavigateToPaySuccess={onNavigateToPaySuccess}
        onNavigateToSendSuccess={onNavigateToSendSuccess}
      />,
    );

    expect(screen.getByText("Quick actions")).toBeDefined();
    fireEvent.click(screen.getByText("Go to Portfolio"));
    fireEvent.click(screen.getByText("Go to Pay tab"));
    fireEvent.click(screen.getByText("Pay contact success"));
    fireEvent.click(screen.getByText("Send success"));
    expect(onNavigateToPortfolio).toHaveBeenCalledTimes(1);
    expect(onNavigateToPayTab).toHaveBeenCalledTimes(1);
    expect(onNavigateToPaySuccess).toHaveBeenCalledTimes(1);
    expect(onNavigateToSendSuccess).toHaveBeenCalledTimes(1);
  });

  it("resets the card login intro", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.click(screen.getByText("Reset card login intro"));
    expect(props.resetPayCardLoginIntroSeen).toHaveBeenCalledTimes(1);
    expect(props.resetPayCardFeatureTourSeen).not.toHaveBeenCalled();
  });

  it("lists the same Card Debug entries the mobile tool lists", () => {
    render(<PayCard {...buildProps()} />);

    expect(screen.getByText("Card Status")).toBeInTheDocument();
    expect(screen.getByText("Balance & Wallets")).toBeInTheDocument();
    expect(screen.getByText("Card onboarding")).toBeInTheDocument();
    expect(screen.getByText("Currency Mapping")).toBeInTheDocument();
  });

  it("opens the probes, and drops the minted card url on the way back", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.click(screen.getByText("Card Status"));
    expect(screen.getByText("Request Card Details")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Back"));
    expect(props.interaction.details.clear).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Feature flags")).toBeInTheDocument();
  });

  it("opens the onboarding screen and asks for a fresh answer", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.click(screen.getByText("Card onboarding"));

    expect(props.cardOnboarding.refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Mocked answers")).toBeInTheDocument();
  });

  it("opens the currency mapping, which needs nothing asked for", () => {
    const props = buildProps();
    render(<PayCard {...props} currencyMapping={[{ key: "btc.bitcoin", ledgerId: "bitcoin" }]} />);

    fireEvent.click(screen.getByText("Currency Mapping"));

    expect(screen.getByText("btc.bitcoin")).toBeInTheDocument();
    expect(props.balance.load).not.toHaveBeenCalled();
  });

  it("opens the wallet screen and asks for the wallets when it does", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.click(screen.getByText("Balance & Wallets"));

    expect(props.balance.load).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Baanx wallets")).toBeInTheDocument();
    expect(screen.getByText("Card linked wallets")).toBeInTheDocument();
    expect(screen.getByText("Card linked combined wallets")).toBeInTheDocument();
    // Each section says how many it got, so an empty answer reads as empty.
    expect(screen.getAllByText("count")).toHaveLength(3);
  });

  it("shows the two responses and the join the app builds from them", () => {
    const props = buildProps();
    render(
      <PayCard
        {...props}
        balance={{ ...props.balance, baanxWallets, linkedWallets, combinedWallets }}
      />,
    );

    fireEvent.click(screen.getByText("Balance & Wallets"));

    expect(screen.getByText("0. usdc / ethereum")).toBeInTheDocument();
    expect(screen.getByText("1. sol / solana")).toBeInTheDocument();
    expect(screen.getAllByText("ethereum/erc20/usd__coin").length).toBeGreaterThan(0);
    // A link the catalog does not cover says so rather than showing an empty currency.
    expect(screen.getAllByText("undefined — this pair is not mapped").length).toBe(2);
    // And a link with no Baanx wallet behind it says that too.
    expect(
      screen.getByText("null — still reading, or no Baanx wallet matched"),
    ).toBeInTheDocument();
  });

  it("refreshes the wallets from the screen, and returns to the tool", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.click(screen.getByText("Balance & Wallets"));
    fireEvent.click(screen.getByLabelText("Refresh"));
    expect(props.balance.refresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Feature flags")).toBeInTheDocument();
  });

  it("shows which endpoint failed and what it answered", () => {
    const props = buildProps();
    render(
      <PayCard
        {...props}
        balance={{
          ...props.balance,
          errors: [{ endpoint: "GET /v1/wallet/internal", detail: "401 unauthorized" }],
        }}
      />,
    );

    fireEvent.click(screen.getByText("Balance & Wallets"));

    expect(screen.getByText("GET /v1/wallet/internal")).toBeInTheDocument();
    expect(screen.getByText("401 unauthorized")).toBeInTheDocument();
  });

  it("applies empty, loaded and custom asset fixtures from Balance & Wallets", () => {
    const fixture = {
      isMockingEnabled: true,
      preset: "none" as const,
      wallets: [],
      catalog: [{ key: "usdc.ethereum", ledgerId: "ethereum/erc20/usd__coin" }],
      applyEmpty: jest.fn(),
      applyLoaded: jest.fn(),
      addAsset: jest.fn(),
      removeAsset: jest.fn(),
      clear: jest.fn(),
    };
    render(<PayCard {...buildProps()} balance={{ ...buildProps().balance, fixture }} />);

    fireEvent.click(screen.getByText("Balance & Wallets"));
    fireEvent.click(screen.getByText("Empty"));
    fireEvent.click(screen.getByText("Loaded"));
    fireEvent.click(screen.getByText("Add asset"));

    expect(fixture.applyEmpty).toHaveBeenCalledTimes(1);
    expect(fixture.applyLoaded).toHaveBeenCalledTimes(1);
    expect(fixture.addAsset).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "usdc", network: "ethereum" }),
    );
  });
});
