import Transport from "@ledgerhq/hw-transport";
import { getSdk } from "..";

export async function scenario(transport: Transport) {
  const applicationId = 16;

  const name1 = "Member 1";
  const sdk1 = getSdk(false, { applicationId, name: name1 });
  const member1creds = await sdk1.initMemberCredentials();
  const initialJwt = await sdk1.authWithDevice(transport);

  // verify that getOrCreateTrustchain is idempotent
  const t1 = await sdk1.getOrCreateTrustchain(transport, initialJwt, member1creds);
  const t2 = await sdk1.getOrCreateTrustchain(transport, t1.jwt, member1creds);
  expect(t1.trustchain).toEqual(t2.trustchain);

  // verify that a second member can join the trustchain and get the same trustchain
  const name2 = "Member 2";
  const sdk2 = getSdk(false, { applicationId, name: name2 });
  const member2creds = await sdk2.initMemberCredentials();
  const anotherJwt = await sdk2.authWithDevice(transport);
  const t3 = await sdk2.getOrCreateTrustchain(transport, anotherJwt, member2creds);
  expect(t1.trustchain).toEqual(t3.trustchain);

  // check there are indeed our two members in the trustchain
  const jwt = await sdk1.auth(t1.trustchain, member1creds);
  const members = await sdk1.getMembers(jwt, t1.trustchain);
  expect(members).toEqual([
    {
      id: member1creds.pubkey,
      name: name1,
      permissions: 0xffffffff,
    },
    {
      id: member2creds.pubkey,
      name: name2,
      permissions: 0xffffffff,
    },
  ]);

  // destroy
  await sdk1.destroyTrustchain(t1.trustchain, await sdk1.auth(t1.trustchain, member1creds));
}
