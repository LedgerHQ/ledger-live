import React from "react";
import { TriangleUp, TriangleDown } from "@ledgerhq/lumen-ui-react/symbols";
import { render, screen, waitFor } from "tests/testSetup";
import { PnLCard } from "../index";

type PnLCardProps = React.ComponentProps<typeof PnLCard>;
type InteractiveProps = Extract<PnLCardProps, { type: "interactive" }>;
type InfoProps = Extract<PnLCardProps, { type: "info" }>;

const ID = "unrealisedReturn";
const TITLE = "Unrealised return";
const VALUE = "243.32";
const TOOLTIP = "This is a tooltip";

const UP_ICON = { Icon: TriangleUp, className: "text-success" } as const;
const DOWN_ICON = { Icon: TriangleDown, className: "text-error" } as const;
const NEUTRAL_ICON = { Icon: TriangleUp, className: "text-disabled" } as const;

const makeInteractiveProps = (
  overrides: Partial<Omit<InteractiveProps, "type">> = {},
): InteractiveProps => ({
  type: "interactive",
  id: ID,
  title: TITLE,
  value: VALUE,
  trendIcon: UP_ICON,
  onClick: jest.fn(),
  ...overrides,
});

const makeInfoProps = (overrides: Partial<Omit<InfoProps, "type">> = {}): InfoProps => ({
  type: "info",
  id: ID,
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

    it.each([
      [UP_ICON, ".text-success", [".text-error", ".text-disabled"]],
      [DOWN_ICON, ".text-error", [".text-success", ".text-disabled"]],
      [NEUTRAL_ICON, ".text-disabled", [".text-success", ".text-error"]],
    ] as const)("renders the trend icon with %o", (trendIcon, expectedClass, otherClasses) => {
      const { container } = render(<PnLCard {...makeInteractiveProps({ trendIcon })} />);

      expect(container.querySelector(expectedClass)).toBeInTheDocument();
      otherClasses.forEach(cls => {
        expect(container.querySelector(cls)).not.toBeInTheDocument();
      });
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
});
