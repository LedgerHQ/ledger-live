import { UserHashService } from "./UserHashService";

describe("UserHashService", () => {
  describe("compute", () => {
    it("should compute firmware salt correctly", () => {
      const userId = "e65cb3f1-d5c7-4534-977c-c747167fa5d5";
      const result = UserHashService.compute(userId);

      expect(result.firmwareSalt).toStrictEqual("f83e41");
    });

    it("should compute endpointOverrides100 correctly", () => {
      const userId = "e65cb3f1-d5c7-4534-977c-c747167fa5d5";
      const result = UserHashService.compute(userId);

      expect(result.endpointOverrides100).toStrictEqual(12);
    });
  });
});
