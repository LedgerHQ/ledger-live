import { describe, expect, it, mock } from "bun:test";
import {
  getMemberCredentialEntry,
  type MemberCredentialRepository,
  withMemberCredentialRepository,
} from "./member-credential-repository";

describe("memberCredentialRepository", () => {
  it("should fail when no repository is configured", () => {
    expect(() => getMemberCredentialEntry("service", "account")).toThrow(
      "Member credential repository is not configured.",
    );
  });

  it("should delegate entry operations to the configured repository", () => {
    const repository: MemberCredentialRepository = {
      getPassword: mock(() => "secret"),
      setPassword: mock(() => undefined),
      deletePassword: mock(() => undefined),
    };

    withMemberCredentialRepository(repository, () => {
      const entry = getMemberCredentialEntry("service", "account");

      expect(entry.getPassword()).toBe("secret");
      entry.setPassword("updated");
      entry.deletePassword();
    });

    expect(repository.getPassword).toHaveBeenCalledWith("service", "account");
    expect(repository.setPassword).toHaveBeenCalledWith("service", "account", "updated");
    expect(repository.deletePassword).toHaveBeenCalledWith("service", "account");
  });

  it("should retain the configured repository across asynchronous work", async () => {
    const repository: MemberCredentialRepository = {
      getPassword: () => "secret",
      setPassword: () => undefined,
      deletePassword: () => undefined,
    };

    expect(
      await withMemberCredentialRepository(repository, async () => {
        await Promise.resolve();
        return getMemberCredentialEntry("service", "account").getPassword();
      }),
    ).toBe("secret");
  });
});
