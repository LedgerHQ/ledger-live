import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { PnLCard } from "../index";

type PnLCardProps = React.ComponentProps<typeof PnLCard>;
type InteractiveProps = Extract<PnLCardProps, { type: "interactive" }>;
type InfoProps = Extract<PnLCardProps, { type: "info" }>;

const TITLE = "Unrealised return";
const VALUE = "243.32";
const TOOLTIP = "This is a tooltip";
const DISCREET_PLACEHOLDER = "***";

const makeInteractiveProps = (
  overrides: Partial<Omit<InteractiveProps, "type">> = {},
): InteractiveProps => ({
  type: "interactive",
  title: TITLE,
  value: VALUE,
  trend: "up",
  onClick: jest.fn(),
  ...overrides,
});

const makeInfoProps = (overrides: Partial<Omit<InfoProps, "type">> = {}): InfoProps => ({
  type: "info",
  title: TITLE,
  value: VALUE,
  tooltipContent: TOOLTIP,
  ...overrides,
});

describe("PnLCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when type is 'interactive'", () => {
    it("should render the title and the value", () => {
      render(<PnLCard {...makeInteractiveProps()} />);

      expect(screen.getByText(TITLE)).toBeVisible();
      expect(screen.getByText(VALUE)).toBeVisible();
    });

    it("should render the card as a clickable button", () => {
      render(<PnLCard {...makeInteractiveProps()} />);

      expect(screen.getByRole("button")).toBeVisible();
    });

    it("should call onClick when the card is clicked", async () => {
      const onClick = jest.fn();
      const { user } = render(<PnLCard {...makeInteractiveProps({ onClick })} />);

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should render an up arrow when trend is 'up'", () => {
      const { container } = render(<PnLCard {...makeInteractiveProps({ trend: "up" })} />);

      expect(container.querySelector(".text-success")).toBeInTheDocument();
      expect(container.querySelector(".text-error")).not.toBeInTheDocument();
    });

    it("should render a down arrow when trend is 'down'", () => {
      const { container } = render(<PnLCard {...makeInteractiveProps({ trend: "down" })} />);

      expect(container.querySelector(".text-error")).toBeInTheDocument();
      expect(container.querySelector(".text-success")).not.toBeInTheDocument();
    });

    it("should not render any tooltip", () => {
      render(<PnLCard {...makeInteractiveProps()} />);

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("when type is 'info'", () => {
    it("should render the title and the value", () => {
      render(<PnLCard {...makeInfoProps()} />);

      expect(screen.getByText(TITLE)).toBeVisible();
      expect(screen.getByText(VALUE)).toBeVisible();
    });

    it("should not render the card as a clickable button", () => {
      render(<PnLCard {...makeInfoProps()} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should not render any trend arrow", () => {
      const { container } = render(<PnLCard {...makeInfoProps()} />);

      expect(container.querySelector(".text-success")).not.toBeInTheDocument();
      expect(container.querySelector(".text-error")).not.toBeInTheDocument();
    });

    it("should reveal the tooltip content when the trigger is hovered", async () => {
      const { container, user } = render(<PnLCard {...makeInfoProps()} />);

      const trigger = container.querySelector("[data-slot='tooltip-trigger']");
      if (!trigger) throw new Error("Tooltip trigger not found");
      await user.hover(trigger);

      await waitFor(() => {
        const tooltips = screen.getAllByText(TOOLTIP);
        expect(tooltips.some(el => el.closest("[role='tooltip']"))).toBe(true);
      });
    });
  });

  describe("when discreet is enabled", () => {
    it("should hide the value behind '***' in the interactive variant", () => {
      render(<PnLCard {...makeInteractiveProps({ discreet: true })} />);

      expect(screen.getByText(DISCREET_PLACEHOLDER)).toBeVisible();
      expect(screen.queryByText(VALUE)).not.toBeInTheDocument();
    });

    it("should hide the value behind '***' in the info variant", () => {
      render(<PnLCard {...makeInfoProps({ discreet: true })} />);

      expect(screen.getByText(DISCREET_PLACEHOLDER)).toBeVisible();
      expect(screen.queryByText(VALUE)).not.toBeInTheDocument();
    });

    it("should still render the title when the value is hidden", () => {
      render(<PnLCard {...makeInteractiveProps({ discreet: true })} />);

      expect(screen.getByText(TITLE)).toBeVisible();
    });
  });
});
