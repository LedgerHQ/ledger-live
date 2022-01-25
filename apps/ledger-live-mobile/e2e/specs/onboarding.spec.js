// @flow
import { it } from "jest-circus";
import { cleanLaunch, onboard } from "../engine";

describe("Onboarding", () => {
  describe("Nano X", () => {
    beforeAll(async () => {
      await cleanLaunch();
    });

    describe("New Device", () => {});

    describe("Import", () => {});

    describe("Restore", () => {});

    describe("Connect", () => {
      onboard("nanoX", "connect");
    });
  });

  describe("Nano S", () => {
    it.todo("should run through Nano S onboarding");
  });

  describe("Nano Blue", () => {
    it.todo("should run through Nano blue onboarding");
  });
});
