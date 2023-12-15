import { describe, expect, test } from "@jest/globals";
import { transportOpen } from "./transportHandler";
import { MessagesMap } from "./types";

describe("transportHandler", () => {
  describe("transportOpen", () => {
    test("When no transport module associated to the tested device has been registered, it should return an error", done => {
      const params: MessagesMap["transport:open"] = {
        data: { descriptor: "" },
        requestId: "request_test",
      };

      transportOpen(params).subscribe({
        next: response => {
          expect(response).toEqual(
            expect.objectContaining({
              error: expect.objectContaining({ name: "CantOpenDevice" }),
            }),
          );
          done();
        },
        error: error => {
          done(error);
        },
      });
    });
  });
});
