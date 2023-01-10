import publicKeyTweakAdd from "./publicKeyTweakAdd";

describe("publicKeyTweakAdd works as expected", () => {
  test("basic usage", () => {
    publicKeyTweakAdd({
      publicKey: "02f1f90c3f8aca90f5c170c8920531c3c3518b9f2f00a076b2725509878e4343ca",
      tweak: "08a41038ce3d801e38977b8f9ae9414511bf8f3b96895f884db9ecb533542cc8",
    }).subscribe(r => {
      expect(r).toBe("039042f99b168a3ed034c55e58ac2ac1ad11a0ef0883dc4ef219a94ea085fe6cb1");
    });
  });
});
