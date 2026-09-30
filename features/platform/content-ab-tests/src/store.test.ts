import { getContentAbTestCopy, setContentAbTestCopy, subscribeToContentAbTestCopy } from "./store";

const value = (raw: string, source: "remote" | "default" | "static" = "remote") => ({
  asString: () => raw,
  getSource: () => source,
});

const experiment = (payload: object, source: "remote" | "default" | "static" = "remote") =>
  value(JSON.stringify(payload), source);

beforeEach(() => {
  setContentAbTestCopy({});
});

describe("setContentAbTestCopy", () => {
  it("publishes the merged copy to subscribers", () => {
    const seen: unknown[] = [];
    const unsubscribe = subscribeToContentAbTestCopy(copy => {
      seen.push(copy);
    });

    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    });
    unsubscribe();

    expect(getContentAbTestCopy()).toEqual({
      "upgrade.banner.title": "Remote",
    });
    expect(seen).toEqual([{ "upgrade.banner.title": "Remote" }]);
  });

  it("does not notify subscribers when a poll returns the same copy", () => {
    const payload = {
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    };
    setContentAbTestCopy(payload);

    const callback = jest.fn();
    subscribeToContentAbTestCopy(callback);
    const republished = setContentAbTestCopy(payload);

    expect(callback).not.toHaveBeenCalled();
    expect(republished).toBe(getContentAbTestCopy());
  });

  it("clears the copy when the experiment stops being served", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    });

    expect(setContentAbTestCopy({})).toEqual({});
  });
});
