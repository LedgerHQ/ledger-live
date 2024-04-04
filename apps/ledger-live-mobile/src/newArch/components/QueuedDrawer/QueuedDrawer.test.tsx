describe("QueuedDrawer", () => {
  test("open one drawer, then close it", async () => {
    // open drawer
    // expect it's visible
    // press close
    // expect it's not visible
  });

  test("open two drawers, then close them consecutively", async () => {
    // open first drawer
    // expect first is visible
    // open second drawer (button in first drawer)
    // expect first is visible
    // expect second not visible
    // press close
    // expect second visible
    // expect first not visible
    // press close
    // expect none of the drawers visible
  });

  test("open two drawers, then force open a third one, then close it", async () => {
    // open two first drawers
    // expect first is visible
    // force open third drawer
    // expect third visible
    // expect first not visible
    // expect second not visible
    // close
    // expect no drawer visible
  });

  test("open one drawer, then navigate to another screen", async () => {
    // open first drawer
    // expect first visible
    // click navigate to another screen
    // expect other screen to be visible
    // expect first drawer to not be visible
  });

  test("open two drawers, then navigate to another screen", async () => {
    // ... first steps
    // expect no drawer visible
  });

  test("open two drawers, then navigate to another screen that has a drawer opened, then close it", async () => {
    // ... first steps
    // expect drawer of 2nd screen visible
    // expect drawers of first screen not vislbe
    // close drawer
    // wait drawer content not visible
  });

  test("open two drawers, force open another one, navigate to other screen", async () => {
    //
  });

  test("open two drawers, force open another one, navigate to other screen with a drawer opened", async () => {
    //
  });

  test("open one drawer at app level (out of navigation stack) and navigate to another screen", async () => {
    //
  });

  test("lock drawers");
});
