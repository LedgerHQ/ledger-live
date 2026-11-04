import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { useCallback, useState } from "react";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
  TrustchainMember,
  TrustchainSDK,
} from "../../types";
import { Actionable } from "../Actionable";

export function MemberRow({
  sdk,
  deviceId,
  trustchain,
  memberCredentials,
  member,
  setTrustchain,
  setMembers,
  callbacks,
}: Readonly<{
  sdk: TrustchainSDK;
  deviceId: string;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  member: TrustchainMember;
  setTrustchain: (v: Trustchain | null) => void;
  setMembers: (v: TrustchainMember[] | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
}>) {
  const [removed, setRemoved] = useState<TrustchainMember | null>(null);

  const action = useCallback(
    (tc: Trustchain, mc: MemberCredentials) =>
      sdk.removeMember(deviceId, tc, mc, member, callbacks).then(async updated => {
        setTrustchain(updated);
        await sdk.getMembers(updated, mc).then(setMembers);
        return member;
      }),
    [sdk, deviceId, member, callbacks, setTrustchain, setMembers],
  );

  return (
    <ListItem>
      <ListItemLeading>
        <ListItemContent>
          <ListItemTitle>{member.name || "(no name)"}</ListItemTitle>
          <ListItemDescription>
            {member.id} · permissions: {member.permissions}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Actionable
          className="p-0"
          buttonTitle="Remove"
          inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
          action={action}
          value={removed}
          setValue={setRemoved}
          valueDisplay={v => `removed: ${v.name || v.id.slice(0, 8)}`}
        />
      </ListItemTrailing>
    </ListItem>
  );
}
