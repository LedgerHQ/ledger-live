import {
  createOpenBorrowErrorBottomSheetHandler,
  resolveBorrowErrorBottomSheet,
} from "../borrowErrorBottomSheetStore";
import { setErrorBottomSheet } from "~/reducers/borrow";

const validParams = {
  title: "Something went wrong",
  description: "We were unable to complete your borrow flow.",
  ctaLabel: "Try again",
};

describe("borrowErrorBottomSheetStore", () => {
  // The store keeps module-level resolver state across tests, so reset it
  // between cases by resolving any pending promise as dismissed.
  afterEach(() => {
    resolveBorrowErrorBottomSheet(false);
  });

  describe("createOpenBorrowErrorBottomSheetHandler", () => {
    it("dispatches the sanitized params when the sheet opens", async () => {
      const dispatch = jest.fn();
      const handler = createOpenBorrowErrorBottomSheetHandler(dispatch);

      void handler({
        params: {
          title: "  Something went wrong  ",
          description: "  We were unable to complete your borrow flow.  ",
          ctaLabel: "  Try again  ",
        },
      });

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(setErrorBottomSheet(validParams));
    });

    it("propagates validation errors from sanitizeBorrowErrorBottomSheetParams", async () => {
      const dispatch = jest.fn();
      const handler = createOpenBorrowErrorBottomSheetHandler(dispatch);

      await expect(handler({})).rejects.toThrow(
        "Invalid params for custom.bottomSheet.error: params are required.",
      );
      expect(dispatch).not.toHaveBeenCalled();
    });

    it("resolves with { confirmed: true } when resolveBorrowErrorBottomSheet(true) is called", async () => {
      const dispatch = jest.fn();
      const handler = createOpenBorrowErrorBottomSheetHandler(dispatch);

      const pending = handler({ params: validParams });
      resolveBorrowErrorBottomSheet(true);

      await expect(pending).resolves.toEqual({ confirmed: true });
    });

    it("resolves with { confirmed: false } when resolveBorrowErrorBottomSheet(false) is called", async () => {
      const dispatch = jest.fn();
      const handler = createOpenBorrowErrorBottomSheetHandler(dispatch);

      const pending = handler({ params: validParams });
      resolveBorrowErrorBottomSheet(false);

      await expect(pending).resolves.toEqual({ confirmed: false });
    });

    it("clears the Redux slice when resolving (dispatches undefined payload)", async () => {
      const dispatch = jest.fn();
      const handler = createOpenBorrowErrorBottomSheetHandler(dispatch);

      const pending = handler({ params: validParams });
      resolveBorrowErrorBottomSheet(true);
      await pending;

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenLastCalledWith(setErrorBottomSheet(undefined));
    });

    it("resolves a previous pending sheet as dismissed when a new sheet opens", async () => {
      const dispatch = jest.fn();
      const handler = createOpenBorrowErrorBottomSheetHandler(dispatch);

      const first = handler({ params: validParams });
      // Open a second sheet before the first one was settled.
      const second = handler({ params: { ...validParams, title: "Second error" } });

      await expect(first).resolves.toEqual({ confirmed: false });

      // The second sheet is still pending until we resolve it explicitly.
      resolveBorrowErrorBottomSheet(true);
      await expect(second).resolves.toEqual({ confirmed: true });
    });
  });

  describe("resolveBorrowErrorBottomSheet", () => {
    it("is a no-op when no sheet is pending", () => {
      // Should not throw even with no pending resolver.
      expect(() => resolveBorrowErrorBottomSheet(true)).not.toThrow();
      expect(() => resolveBorrowErrorBottomSheet(false)).not.toThrow();
    });

    it("only resolves the pending promise once for the same sheet", async () => {
      const dispatch = jest.fn();
      const handler = createOpenBorrowErrorBottomSheetHandler(dispatch);

      const pending = handler({ params: validParams });
      const onSettled = jest.fn();
      pending.then(onSettled);

      resolveBorrowErrorBottomSheet(true);
      // A subsequent call has no pending sheet to settle.
      resolveBorrowErrorBottomSheet(false);

      await pending;

      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(onSettled).toHaveBeenCalledWith({ confirmed: true });
    });
  });
});
