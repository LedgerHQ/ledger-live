import { act, renderHook, waitFor } from "@testing-library/react";
import { mockAccountStatus } from "@domain/entity-account-status/schema.mock";
import { trackPage } from "@shared/analytics";
import { setOperationSink } from "@shared/observability-operations";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  makeReceiveTestStore,
  receiveTestWrapper,
  testAccountUUID,
  testReceive,
} from "../../__tests__/receiveTestStore";
import { useReceiveAddressHeader } from "./useReceiveAddressHeader";
import { useReceiveAddressViewModel } from "./useReceiveAddressViewModel";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

jest.mock("./useReceiveAddressHeader", () => {
  const actual = jest.requireActual("./useReceiveAddressHeader");
  return { ...actual, useReceiveAddressHeader: jest.fn(actual.useReceiveAddressHeader) };
});

const ETH = CryptoOrTokenCurrencyIdSchema.parse("ethereum");

describe("useReceiveAddressViewModel", () => {
  it("should show the address read even when the asset metadata is unknown", async () => {
    const { useReceiveAddressHeader: actualHeader } = jest.requireActual(
      "./useReceiveAddressHeader",
    );
    jest.mocked(useReceiveAddressHeader).mockImplementation(assetId => ({
      ...actualHeader(assetId),
      data: undefined,
    }));

    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
        }),
      { wrapper: receiveTestWrapper() },
    );

    await waitFor(() => expect(result.current.address?.value).toBe(testReceive.address));
    expect(result.current.address?.assetIcon).toBeUndefined();
  });

  it("should list the notices", async () => {
    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
          getFamilyConfig: () => ({ notices: ["utxo"] }),
        }),
      { wrapper: receiveTestWrapper() },
    );

    await waitFor(() => expect(result.current.notices.map(notice => notice.id)).toEqual(["utxo"]));
  });

  it("should show the service incident before the address, until the user continues", async () => {
    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
          serviceIncidents: [
            { title: "Ethereum degraded", description: [{ text: "Investigating" }] },
          ],
        }),
      { wrapper: receiveTestWrapper() },
    );

    expect(result.current.serviceStatus).toEqual(
      expect.objectContaining({
        title: "Ethereum degraded",
        description: [{ text: "Investigating" }],
      }),
    );

    act(() => result.current.serviceStatus?.onContinue());

    expect(result.current.serviceStatus).toBeUndefined();
    await waitFor(() => expect(result.current.address).toBeDefined());
  });

  it("should open the support articles in the user's language", () => {
    const openExternal = jest.fn();
    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
        }),
      {
        wrapper: receiveTestWrapper(makeReceiveTestStore(), {
          openExternal,
          localization: { currentLanguage: "fr", defaultLanguage: "en", languages: { fr: "fr" } },
        }),
      },
    );

    act(() => result.current.helpCard.onPress());
    act(() => result.current.helpPanel?.questions[1].onPress());

    expect(openExternal).toHaveBeenCalledWith(
      "https://support.ledger.com/fr/article/4404389453841-zd",
    );
  });

  it("should record the gate page only once the help no longer covers it", async () => {
    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
        }),
      {
        wrapper: receiveTestWrapper(
          makeReceiveTestStore({
            accountStatus: async () => mockAccountStatus({ gate: { type: "onboarding" } }),
          }),
        ),
      },
    );
    act(() => result.current.helpCard.onPress());
    await waitFor(() => expect(result.current.gate?.type).toBe("onboarding"));

    const gatePage = expect.objectContaining({ category: "Receive - Onboarding Required" });
    expect(trackPage).not.toHaveBeenCalledWith(gatePage);
    act(() => result.current.helpPanel?.onClose());
    expect(trackPage).toHaveBeenCalledWith(gatePage);
  });

  describe("receive_address operation", () => {
    const sink = {
      isRecording: () => true,
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      setOperationSink(sink);
    });

    afterEach(() => {
      setOperationSink(null);
    });

    it("should run from the entry point the app gives until the address is shown", async () => {
      const { result } = renderHook(
        () =>
          useReceiveAddressViewModel({
            accountUUID: testAccountUUID,
            assetId: ETH,
            source: "Portfolio",
            onClose: jest.fn(),
          }),
        { wrapper: receiveTestWrapper() },
      );

      await waitFor(() => expect(result.current.address).toBeDefined());
      expect(sink.start).toHaveBeenCalledWith("receive_address", undefined, {
        currency_id: "ethereum",
        asset_type: "coin",
        network_id: "ethereum",
        source: "Portfolio",
        attempt: 1,
      });
      expect(sink.succeed).toHaveBeenCalledWith(
        "receive_address",
        undefined,
        expect.objectContaining({ address_option: "transparent", service_incident: false }),
      );
    });

    it("should be abandoned while loading when the user closes the screen, for good", async () => {
      const onClose = jest.fn();
      const { result } = renderHook(
        () => useReceiveAddressViewModel({ accountUUID: testAccountUUID, assetId: ETH, onClose }),
        { wrapper: receiveTestWrapper() },
      );

      act(() => result.current.onClose());
      await waitFor(() => expect(result.current.address).toBeDefined());

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(sink.fail).toHaveBeenCalledWith(
        "receive_address",
        undefined,
        "ABANDONED",
        expect.objectContaining({ trigger: "close", step: "loading" }),
      );
      expect(sink.succeed).not.toHaveBeenCalled();
    });

    it("should not report the read error kept from a previous opening once the read recovers", async () => {
      const readReceive = jest
        .fn<Promise<typeof testReceive>, []>()
        .mockRejectedValueOnce(new Error("sync failed"))
        .mockResolvedValue(testReceive);
      const store = makeReceiveTestStore({ receive: readReceive });
      const renderScreen = () =>
        renderHook(
          () =>
            useReceiveAddressViewModel({
              accountUUID: testAccountUUID,
              assetId: ETH,
              onClose: jest.fn(),
            }),
          { wrapper: receiveTestWrapper(store) },
        );
      const firstOpening = renderScreen();
      await waitFor(() => expect(firstOpening.result.current.error).toBeDefined());
      firstOpening.unmount();
      jest.clearAllMocks();

      const secondOpening = renderScreen();
      await waitFor(() => expect(secondOpening.result.current.address).toBeDefined());

      expect(sink.start).toHaveBeenCalledTimes(1);
      expect(sink.fail).not.toHaveBeenCalled();
      expect(sink.succeed).toHaveBeenCalledWith(
        "receive_address",
        undefined,
        expect.objectContaining({ attempt: 1, address_option: "transparent" }),
      );
    });

    it("should not report the receive read that failed before the account status asked to onboard", async () => {
      let answerAccountStatus: ((status: ReturnType<typeof mockAccountStatus>) => void) | undefined;
      const { result } = renderHook(
        () =>
          useReceiveAddressViewModel({
            accountUUID: testAccountUUID,
            assetId: ETH,
            onClose: jest.fn(),
          }),
        {
          wrapper: receiveTestWrapper(
            makeReceiveTestStore({
              receive: () => Promise.reject(new Error("not onboarded")),
              accountStatus: () =>
                new Promise(resolve => {
                  answerAccountStatus = resolve;
                }),
            }),
          ),
        },
      );
      await waitFor(() => expect(result.current.error).toBeDefined());

      await act(async () =>
        answerAccountStatus?.(mockAccountStatus({ gate: { type: "onboarding" } })),
      );
      await waitFor(() => expect(result.current.gate?.type).toBe("onboarding"));
      act(() => result.current.onClose());

      expect(sink.fail).not.toHaveBeenCalled();
      expect(sink.succeed).toHaveBeenCalledWith(
        "receive_address",
        undefined,
        expect.objectContaining({ outcome: "onboarding_required", gate_action_opened: false }),
      );
    });

    it("should fail the attempt as an error and start the next one when the user retries", async () => {
      const readReceive = jest
        .fn<Promise<typeof testReceive>, []>()
        .mockRejectedValueOnce(new Error("sync failed"))
        .mockResolvedValue(testReceive);
      const { result } = renderHook(
        () =>
          useReceiveAddressViewModel({
            accountUUID: testAccountUUID,
            assetId: ETH,
            onClose: jest.fn(),
          }),
        { wrapper: receiveTestWrapper(makeReceiveTestStore({ receive: readReceive })) },
      );
      await waitFor(() => expect(result.current.error).toBeDefined());

      act(() => result.current.error?.onRetry());
      await waitFor(() => expect(result.current.address).toBeDefined());

      expect(readReceive).toHaveBeenCalledTimes(2);
      expect(sink.fail).toHaveBeenCalledWith(
        "receive_address",
        undefined,
        "ERROR",
        expect.objectContaining({
          attempt: 1,
          trigger: "retry",
          failed_kinds: "receive",
          error_message: "sync failed",
        }),
      );
      expect(sink.succeed).toHaveBeenCalledWith(
        "receive_address",
        undefined,
        expect.objectContaining({ attempt: 2, address_option: "transparent" }),
      );
    });

    it("should succeed on the gate when the app closes the screen to open the family flow", async () => {
      const rendered = renderHook(
        () =>
          useReceiveAddressViewModel({
            accountUUID: testAccountUUID,
            assetId: ETH,
            onClose: jest.fn(),
            onResolveGate: () => rendered.unmount(),
          }),
        {
          wrapper: receiveTestWrapper(
            makeReceiveTestStore({
              accountStatus: async () => mockAccountStatus({ gate: { type: "onboarding" } }),
            }),
          ),
        },
      );
      await waitFor(() => expect(rendered.result.current.gate?.type).toBe("onboarding"));

      act(() => rendered.result.current.gate?.action?.onPress());

      expect(sink.succeed).toHaveBeenCalledWith(
        "receive_address",
        undefined,
        expect.objectContaining({ outcome: "onboarding_required", gate_action_opened: true }),
      );
      expect(sink.fail).not.toHaveBeenCalled();
    });
  });
});
