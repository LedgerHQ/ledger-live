import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import en from "~/locales/en/common.json";

/**
 * Keys these screens reach through a template literal, which nothing else would catch.
 *
 * There is no `parseMissingKeyHandler` and no typed resources augmentation, so a key with no entry
 * renders its own dotted path at the user — `internetComputer.governanceTopic.NewTopic`.
 */
const manageNeuronFlow = en.internetComputer.manageNeuronFlow as unknown as {
  selectFollowees: Record<string, string | undefined>;
};
const governanceTopic = en.internetComputer.governanceTopic as unknown as Record<
  string,
  string | undefined
>;

describe("internet_computer locale keys", () => {
  // Driven off the coin module's own list: topics 15-18 are recent NNS additions, so a lib bump
  // alone puts a new one in the picker.
  it.each(Object.keys(KNOWN_TOPICS))("%s has a governance-topic label", name => {
    expect(governanceTopic[name]).toBeTruthy();
  });

  it.each(["notANeuronId", "outOfRange", "duplicate", "self", "unadded", "atCapacity"])(
    "%s has a followee notice",
    name => {
      expect(manageNeuronFlow.selectFollowees[name]).toBeTruthy();
    },
  );
});
