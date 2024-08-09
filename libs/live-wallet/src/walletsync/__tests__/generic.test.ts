// cover generic cases with generative mocks

import { dummyContext } from "../__mocks__/environment";
import { emptyState, genState, convertLocalToDistantState, similarLocalState } from "../__mocks__";
import walletsync, { LocalState, UpdateEvent } from "..";

describe("canonical cases", () => {
  it("detects no changes on empty states", () => {
    const diff = walletsync.diffLocalToDistant(emptyState, null);
    expect(diff).toEqual({
      hasChanges: false,
      nextState: convertLocalToDistantState(emptyState),
    });
  });

  it("detects no changes on empty incoming", async () => {
    const localState = genState(5);
    const latestState = convertLocalToDistantState(localState);
    const resolved = await walletsync.resolveIncrementalUpdate(
      dummyContext,
      localState,
      latestState,
      null,
    );
    expect(resolved).toEqual({ hasChanges: false });
  });

  it("detects no changes on same incoming from empty local state", async () => {
    const localState = genState(9);
    const latestState = convertLocalToDistantState(localState);
    const resolved = await walletsync.resolveIncrementalUpdate(
      dummyContext,
      emptyState,
      latestState,
      latestState,
    );
    expect(resolved).toEqual({ hasChanges: false });
  });

  // test many cases with different data sets
  const runs = 127;
  for (let n = 0; n < runs; n++) {
    const i = (n * 33) % runs;
    const j = (1 + n * 77) % runs;
    if (i === j) continue;
    const stateI = genState(i);
    const stateJ = genState(j);
    const distI = convertLocalToDistantState(stateI);
    const distJ = convertLocalToDistantState(stateJ);

    describe("local state " + i + " with state " + j, () => {
      it("parses local state schema", () => {
        expect(walletsync.schema.parse(distI)).toEqual(distI);
      });

      it("detects no changes on same local state", () => {
        const diff = walletsync.diffLocalToDistant(stateI, distI);
        expect(diff).toEqual({ hasChanges: false, nextState: distI });
      });

      it("detects changes", () => {
        const diff = walletsync.diffLocalToDistant(stateI, distJ);
        expect(diff).toEqual({
          hasChanges: true,
          nextState: distI,
        });
      });

      let update: UpdateEvent | null = null;

      it("resolves the transition (distI->distJ) from stateI", async () => {
        const resolved = await walletsync.resolveIncrementalUpdate(
          dummyContext,
          stateI,
          distI,
          distJ,
        );
        expect(resolved).toMatchObject({ hasChanges: true });
        if (resolved.hasChanges) update = resolved.update;
      });

      let newState: LocalState | null = null;
      it("applies the transition (distI->distJ), assert that from stateI it gets you to stateJ", () => {
        if (!update) {
          throw new Error("missing update");
        }
        newState = walletsync.applyUpdate(stateI, update);
        expect(similarLocalState(stateJ, newState)).toBe(true);
      });

      it("is stable after the transition is applied (not detected new changes to prevent loop)", () => {
        if (!newState) {
          throw new Error("missing newState");
        }
        const diff = walletsync.diffLocalToDistant(newState, distJ);
        expect(diff).toEqual({ hasChanges: false, nextState: distJ });
      });
    });
  }
});
