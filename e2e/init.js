// @flow
import { bridge } from "./engine";

beforeAll(async () => {
  bridge.init();
});

afterAll(() => {
  bridge.close();
});
