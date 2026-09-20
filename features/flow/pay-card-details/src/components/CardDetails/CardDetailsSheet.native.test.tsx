import React, { type PropsWithChildren } from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import {
  cardApiWrapper,
  listenToCardApi,
  signedInCardApiHandlers,
} from "@support/msw-features-flow-pay-card";
import { ADD_TO_WALLET_COPY, CARD_COPY, I18nWrapper, MORE_COPY } from "../../__tests__/i18nWrapper";
import { buildMoreViewProps } from "../More/fixtures";
import type { CardDetailsRoute } from "./Scenes/navigation";
import type { CardDetailsSceneProps } from "./Scenes/types";
import type { ConfirmState, FreezeViewModel } from "../../types";
import { CardDetailsSheet } from "./CardDetailsSheet";

jest.mock("@features/flow-pay-card-assets", () => {
  const { View } = jest.requireActual("react-native");
  return {
    CardAssetDetailsDrawer: () => <View testID="card-asset-details-drawer" />,
    CardAssetDetailsWithdrawDrawer: () => <View testID="card-asset-withdraw-drawer" />,
    CardAssetTransactionDetailDrawer: () => <View testID="card-asset-transaction-detail-drawer" />,
    CardAssetsManageDrawer: () => <View testID="card-assets-manage-drawer" />,
  };
});

listenToCardApi(signedInCardApiHandlers);

const StoreWrapper = cardApiWrapper({ signedIn: true });
const transaction = PayCardTransactionSchema.parse(mockPayCardTransactions()[0]);

function Wrapper({ children }: PropsWithChildren) {
  return (
    <StoreWrapper>
      <I18nWrapper>{children}</I18nWrapper>
    </StoreWrapper>
  );
}

type SheetOverrides = Readonly<{
  isOpen?: boolean;
  route?: CardDetailsRoute;
  confirmState?: ConfirmState;
}>;

const onAddToWalletPress = jest.fn();
const onAddToWalletDone = jest.fn();

function buildScene({ route, confirmState }: SheetOverrides): CardDetailsSceneProps {
  const viewModel: FreezeViewModel = {
    status: "ACTIVE",
    isActionDisabled: false,
    confirmState: confirmState ?? "closed",
    onOpenConfirm: jest.fn(),
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };
  const more = buildMoreViewProps();

  return {
    route: route ?? { name: "overview" },
    header: {},
    overview: {
      assetsViewModel: null,
      freezeViewModel: viewModel,
      moreViewModel: more,
      onFreezePress: jest.fn(),
      onMorePress: jest.fn(),
      onTransactionPress: jest.fn(),
      onAddToWalletPress,
    },
    freeze: { viewModel },
    more: { viewModel: more },
    addToWallet: { onDone: onAddToWalletDone },
    transaction: route?.name === "transaction" ? { transaction: route.transaction } : null,
    assetDetails: null,
    assetWithdraw: null,
    assetsManage: null,
    assetTransaction: null,
  };
}

function renderSheet(overrides: SheetOverrides = {}) {
  const onClose = jest.fn();
  const onBack = jest.fn();
  const user = userEvent.setup();
  const sheet = (props: SheetOverrides) => (
    <CardDetailsSheet
      isOpen={props.isOpen ?? true}
      scene={buildScene(props)}
      onClose={onClose}
      onBack={onBack}
    />
  );
  const view = render(sheet(overrides), { wrapper: Wrapper });

  return {
    ...view,
    onClose,
    onBack,
    pressDismiss: () => user.press(screen.getByTestId("card-details-sheet-dismiss")),
    pressBack: () => user.press(screen.getByTestId("card-details-sheet-back")),
    pressAddToWallet: () => user.press(screen.getByTestId("pay-card-add-to-wallet-cta-entry")),
    pressAddToWalletDone: () => user.press(screen.getByTestId("pay-card-add-to-wallet-cta")),
    goTo: (next: SheetOverrides) => view.rerender(sheet(next)),
  };
}

describe("CardDetailsSheet (native)", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("should keep the sheet content hidden when the sheet is closed", () => {
    renderSheet({ isOpen: false });

    expect(screen.getByTestId("card-details-sheet")).toBeVisible();
    expect(screen.queryByText(CARD_COPY.freeze)).toBeNull();
  });

  it("should keep mounted content ready while a previously opened sheet closes", () => {
    const { goTo } = renderSheet({ route: { name: "more" } });

    goTo({ isOpen: false, route: { name: "overview" } });

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
  });

  it("should report the open flag when the sheet is open", () => {
    renderSheet();

    expect(screen.getByTestId("card-details-sheet").props.accessibilityState.expanded).toBe(true);
  });

  it("should show freeze and more when the sheet is open", () => {
    renderSheet();

    expect(screen.getByLabelText("Visa")).toBeVisible();
    expect(screen.getByText(CARD_COPY.freeze)).toBeVisible();
    expect(screen.getByLabelText(MORE_COPY.tile)).toBeVisible();
  });

  it("should float the add-to-wallet CTA over the overview", () => {
    renderSheet();

    expect(screen.getByTestId("pay-card-add-to-wallet-cta-entry")).toBeVisible();
  });

  it("should keep the add-to-wallet CTA off the scenes it would cover", () => {
    renderSheet({ route: { name: "transaction", transaction } });

    expect(screen.queryByTestId("pay-card-add-to-wallet-cta-entry")).toBeNull();
  });

  it("should send the add-to-wallet CTA to its own scene rather than stacking a sheet", async () => {
    const { pressAddToWallet } = renderSheet();

    await pressAddToWallet();

    expect(onAddToWalletPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("pay-card-add-to-wallet-sheet-content")).toBeNull();
  });

  it("should show the add-to-wallet instructions with a way back to the overview", async () => {
    const { onBack, pressBack } = renderSheet({ route: { name: "addToWallet" } });

    expect(screen.getByTestId("card-details-add-to-wallet-content")).toBeVisible();
    expect(screen.getByText(ADD_TO_WALLET_COPY.title)).toBeVisible();
    expect(screen.getByText(ADD_TO_WALLET_COPY.step1)).toBeVisible();

    await pressBack();

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("should leave the add-to-wallet scene once the card is on its way to the wallet", async () => {
    const { pressAddToWalletDone } = renderSheet({ route: { name: "addToWallet" } });

    await pressAddToWalletDone();

    expect(onAddToWalletDone).toHaveBeenCalledTimes(1);
  });

  it("should show the scene the route selects, not one derived from the view models", () => {
    renderSheet({ route: { name: "more" } });

    expect(screen.getByTestId("card-details-more-content")).toBeVisible();
    expect(screen.getByText(MORE_COPY.rows.managePin)).toBeVisible();
  });

  it("should show freeze confirmation in the same sheet", () => {
    renderSheet({ route: { name: "freeze" }, confirmState: "prompt" });

    expect(screen.getByTestId("card-details-freeze-content")).toBeVisible();
    expect(screen.getByText(CARD_COPY.freezeTitle)).toBeVisible();
  });

  it("should show transaction details in the same sheet", () => {
    renderSheet({ route: { name: "transaction", transaction } });

    expect(screen.getByTestId("card-details-transaction-content")).toBeVisible();
    expect(screen.getByText("NETFLIX.COM")).toBeVisible();
  });

  it("should offer a way back to the overview from transaction details", async () => {
    const { onBack, onClose, pressBack } = renderSheet({
      route: { name: "transaction", transaction },
    });

    await pressBack();

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should offer a way back to the overview from more", async () => {
    const { onBack, onClose, pressBack } = renderSheet({
      route: { name: "more" },
    });

    await pressBack();

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should offer no way back from the overview", () => {
    renderSheet();

    expect(screen.queryByTestId("card-details-sheet-back")).toBeNull();
  });

  it("should render no freeze confirmation when the confirm state is closed", () => {
    renderSheet({ route: { name: "freeze" } });

    expect(screen.queryByTestId("card-details-freeze-content")).toBeNull();
    expect(screen.queryByText(CARD_COPY.freezeTitle)).toBeNull();
  });

  it("should close once when dismiss is pressed twice", async () => {
    const { onClose, pressDismiss } = renderSheet();

    await pressDismiss();
    await pressDismiss();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should not report a close when navigating to another scene", () => {
    const { onClose, goTo } = renderSheet();

    goTo({ route: { name: "freeze" }, confirmState: "prompt" });

    expect(screen.getByTestId("card-details-freeze-content")).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should ignore dismiss while freeze is pending", async () => {
    const { onClose, pressDismiss } = renderSheet({
      route: { name: "freeze" },
      confirmState: "pending",
    });

    await pressDismiss();

    expect(onClose).not.toHaveBeenCalled();
  });
});
