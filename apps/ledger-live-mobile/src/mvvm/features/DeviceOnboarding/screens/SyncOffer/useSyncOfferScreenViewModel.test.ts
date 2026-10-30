import { act, renderHook } from "@tests/test-renderer";
import { recordAnalytics } from "../../analytics/recordAnalytics.testUtils";
import { seededFunnel, seededPages } from "../../analytics/seededTracking";
import { useSyncOfferScreenViewModel } from "./useSyncOfferScreenViewModel";

const events = recordAnalytics();

function renderOffer({ seeded = true } = {}) {
  seededFunnel.reset();
  if (seeded) seededFunnel.learn({ seeded: true, deviceType: "stax" });
  seededFunnel.page(seededPages.ledgerSync);
  const actions = {
    onActivate: jest.fn(),
    onSkip: jest.fn(),
    onLearnMore: jest.fn(),
    onQuit: jest.fn(),
  };
  const view = renderHook(() => useSyncOfferScreenViewModel(actions));
  return { ...view, ...actions };
}

async function clicks() {
  return (await events())
    .filter(([event]) => event === "button_clicked")
    .map(([, props]) => [props.button, props.page]);
}

describe("useSyncOfferScreenViewModel", () => {
  it.each([
    ["Activate sync", "onActivate", "onActivate"],
    ["Learn more", "onLearnMore", "onLearnMore"],
    ["close", "onQuit", "onQuit"],
  ] as const)("should track %s on the offer", async (button, press, action) => {
    const offer = renderOffer();

    act(() => offer.result.current[press]());

    expect(offer[action]).toHaveBeenCalledTimes(1);
    expect(await clicks()).toEqual([[button, seededPages.ledgerSync]]);
  });

  it("should be back on the offer once the skip drawer is dismissed", async () => {
    const { result } = renderOffer();

    act(() => result.current.onOpenSkip());
    act(() => result.current.skipDrawer.onClose());
    act(() => result.current.onActivate());

    expect(result.current.skipDrawer.trackScreen).toBe(false);
    expect(await clicks()).toEqual([
      ["Skip", seededPages.ledgerSync],
      ["Activate sync", seededPages.ledgerSync],
    ]);
  });

  it("should track Yes, skip in the drawer, then the refused page", async () => {
    const { result, onSkip } = renderOffer();

    act(() => result.current.onOpenSkip());
    act(() => result.current.skipDrawer.onSkip());

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(result.current.skipDrawer.isOpen).toBe(false);
    expect((await events()).map(([event]) => event)).toEqual([
      "Page Ledger Sync",
      "button_clicked",
      "Page Drawer : Skip Ledger sync confirmation",
      "button_clicked",
      "Page Ledger Sync Refused",
    ]);
  });

  it("should send nothing and let the drawer track itself outside the seeded funnel", async () => {
    const { result, onQuit } = renderOffer({ seeded: false });

    act(() => result.current.onOpenSkip());
    act(() => result.current.skipDrawer.onSkip());
    act(() => result.current.onQuit());

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(result.current.skipDrawer.trackScreen).toBe(true);
    expect(await events()).toEqual([]);
  });
});
