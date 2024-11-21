test.skip("has Buffer & Uint8array equivalency", () => {
  expect(Buffer.from("").subarray() instanceof Uint8Array).toBeTruthy();
});
