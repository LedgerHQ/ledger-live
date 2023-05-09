import { shell } from "electron";

export type Message =
  | {
      type: "setToken";
      token: string;
    }
  | {
      type: "closeWidget";
    };

export const handleMessageEvent = ({
  event,
  handler,
}: {
  event: { channel: string; args: string[] };
  handler: (data: Message) => void;
}) => {
  if (event.channel === "webviewToParent") {
    handler(JSON.parse(event.args[0]));
  }
};
export const handleNewWindowEvent = async (e: unknown) => {
  const event = e as { url: string };
  const protocol = new URL(event.url).protocol;
  if (protocol === "http:" || protocol === "https:") {
    await shell.openExternal(event.url);
  }
};
