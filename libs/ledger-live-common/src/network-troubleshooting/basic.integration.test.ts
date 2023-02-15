import { troubleshoot } from ".";

describe("verify network-troubleshooting succeed", () =>
  troubleshoot().forEach(({ title, technicalDescription, job }) =>
    test(title + ": " + technicalDescription, () =>
      expect(job).resolves.not.toBeFalsy()
    )
  ));
