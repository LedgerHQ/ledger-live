import { identifyTargetId } from "../src/";

test("check that known targetIds match known devices", () => {
  const knownTargetIds = {
    nanoS: [823132162, 823132163, 823132164],
    nanoX: [855638020],
    blue: [822149124],
  };

  for (const modelId in knownTargetIds) {
    const ids = knownTargetIds[modelId];
    ids.forEach((id) => {
      const deviceModel = identifyTargetId(id);
      expect(deviceModel?.id).toBe(modelId);
    });
  }
});

test("check that unknown targetId is undefined", () => {
  const shouldBeUndefiend = identifyTargetId(0x123456789);
  expect(shouldBeUndefiend?.id).toBeFalsy();
});
