import { createFlowTracker } from "./flowTracker";
import { resetLastPageEventName } from "./internals/trackPage.internals";
import { setAnalytics, setEnabledFn } from "./registry";
import { getCurrentTrackingPage, resetTrackingPages, setTrackingSource } from "./screenRefs";

const sink = jest.fn();

beforeEach(() => {
  sink.mockReset();
  resetTrackingPages();
  resetLastPageEventName();
  setEnabledFn(() => true);
  setAnalytics({ track: sink });
});

afterAll(() => {
  setAnalytics(undefined);
  setEnabledFn(undefined);
});

/** The delivered events, once the async enrichment ran. */
async function delivered() {
  for (let tick = 0; tick < 10; tick++) await Promise.resolve();
  return sink.mock.calls.map(([event, props]) => [event, props]);
}

describe("createFlowTracker", () => {
  it("sends each page with the page before it as source, the first one from the app", async () => {
    setTrackingSource("Pairing");
    const flow = createFlowTracker({ props: () => ({ flow: "seeded" }) });

    flow.page("Genuine Check");
    flow.page("Genuine Check");
    flow.page("Check OS version");

    expect(await delivered()).toEqual([
      ["Page Genuine Check", { flow: "seeded", source: "Pairing" }],
      ["Page Check OS version", { flow: "seeded", source: "Genuine Check" }],
    ]);
  });

  it("sends a click with the current page and its source", async () => {
    const flow = createFlowTracker();
    flow.page("Genuine Check");
    flow.page("OS update required");

    flow.click("Continue");

    expect((await delivered()).at(-1)).toEqual([
      "button_clicked",
      { button: "Continue", page: "OS update required", source: "Genuine Check" },
    ]);
  });

  it("puts the screen back as the current page when its drawer closes", async () => {
    const flow = createFlowTracker();
    flow.page("Ledger Sync");

    flow.openDrawer("Drawer : Skip");
    flow.click("Yes, skip");
    flow.closeDrawer();
    flow.click("Activate sync");

    expect(getCurrentTrackingPage()).toBe("Ledger Sync");
    expect((await delivered()).slice(1)).toEqual([
      ["Page Drawer : Skip", { source: "Ledger Sync" }],
      ["button_clicked", { button: "Yes, skip", page: "Drawer : Skip", source: "Ledger Sync" }],
      ["button_clicked", { button: "Activate sync", page: "Ledger Sync" }],
    ]);
  });

  it("keeps the flow pages when another screen of the app tracks a page", async () => {
    const flow = createFlowTracker();
    flow.page("Genuine Check");
    setTrackingSource("Error drawer of another feature");

    flow.click("Retry genuine check");

    expect((await delivered()).at(-1)).toEqual([
      "button_clicked",
      { button: "Retry genuine check", page: "Genuine Check" },
    ]);
  });

  it("sends the start and the end once per attempt", async () => {
    const flow = createFlowTracker();
    flow.page("Genuine Check");

    flow.start("started");
    flow.start("started");
    flow.end("done");
    flow.end("aborted");
    flow.reset();
    flow.start("started");

    expect((await delivered()).map(([event]) => event)).toEqual([
      "Page Genuine Check",
      "started",
      "done",
      "started",
    ]);
  });

  it("sends no start and no end after a cancel", async () => {
    const flow = createFlowTracker();

    flow.cancel();
    flow.start("started");
    flow.end("done");

    expect(flow.hasEnded()).toBe(true);
    expect(await delivered()).toEqual([]);
  });
});
