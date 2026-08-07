import { AsyncLocalStorage } from "node:async_hooks";

export interface MemberCredentialRepository {
  getPassword(service: string, account: string): string | null;
  setPassword(service: string, account: string, value: string): void;
  deletePassword(service: string, account: string): void;
}

const memberCredentialRepositoryStorage = new AsyncLocalStorage<MemberCredentialRepository>();

export function withMemberCredentialRepository<T>(
  repository: MemberCredentialRepository,
  task: () => T,
): T {
  return memberCredentialRepositoryStorage.run(repository, task);
}

export function getMemberCredentialEntry(
  service: string,
  account: string,
): {
  getPassword(): string | null;
  setPassword(value: string): void;
  deletePassword(): void;
} {
  const repository = memberCredentialRepositoryStorage.getStore();
  if (!repository) {
    throw new Error("Member credential repository is not configured.");
  }

  return {
    getPassword: () => repository.getPassword(service, account),
    setPassword: (value: string) => repository.setPassword(service, account, value),
    deletePassword: () => repository.deletePassword(service, account),
  };
}
