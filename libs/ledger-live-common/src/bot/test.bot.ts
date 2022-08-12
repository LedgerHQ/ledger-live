import "../__tests__/test-helpers/setup";
import { run } from "./run";

jest.setTimeout(110 * 60 * 1000);
test("bot", run);
