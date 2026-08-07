import {
  type MemberCredentialRepository,
  withMemberCredentialRepository,
} from "../../key-ring/member-credential-repository";

export class InMemoryMemberCredentialRepository implements MemberCredentialRepository {
  readonly entries = new Map<string, string>();
  #readError: Error | undefined;

  getPassword(service: string, account: string): string | null {
    if (this.#readError) throw this.#readError;
    return this.entries.get(this.key(service, account)) ?? null;
  }

  setPassword(service: string, account: string, value: string): void {
    this.entries.set(this.key(service, account), value);
  }

  deletePassword(service: string, account: string): void {
    this.entries.delete(this.key(service, account));
  }

  setReadError(error: Error | undefined): void {
    this.#readError = error;
  }

  clear(): void {
    this.entries.clear();
    this.#readError = undefined;
  }

  private key(service: string, account: string): string {
    return `${service}:${account}`;
  }
}

export const inMemoryMemberCredentialRepository = new InMemoryMemberCredentialRepository();

export function withInMemoryMemberCredentialRepository<T>(task: () => T): T {
  return withMemberCredentialRepository(inMemoryMemberCredentialRepository, task);
}
