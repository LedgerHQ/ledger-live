import { Entry } from "@napi-rs/keyring";
import type { MemberCredentialRepository } from "./member-credential-repository";

export const nativeMemberCredentialRepository: MemberCredentialRepository = {
  getPassword: (service, account) => new Entry(service, account).getPassword(),
  setPassword: (service, account, value) => new Entry(service, account).setPassword(value),
  deletePassword: (service, account) => new Entry(service, account).deletePassword(),
};
