import { once } from "events";
import net, { type AddressInfo } from "net";

type InspectorTarget = { webSocketDebuggerUrl: string };

type EvaluateReply = {
  id?: number;
  result?: { exceptionDetails?: { text: string; exception?: { description?: string } } };
};

export async function findFreePort() {
  const server = net.createServer().listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  server.close();
  await once(server, "close");
  return port;
}

// Quits like the app menu does, through the inspector of the app main process, which the packaged
// app enables (EnableNodeCliInspectArguments in scripts/afterPack.js). A signal would not do: the
// bundled signal-exit turns it into a plain exit, without the quit event electron-updater installs
// the update on, on Linux and Windows.
export async function requestQuit(inspectPort: number) {
  const response = await fetch(`http://127.0.0.1:${inspectPort}/json/list`);
  const [target] = (await response.json()) as InspectorTarget[];
  if (!target) throw new Error(`No inspector target on port ${inspectPort}`);
  const { result } = await evaluate(target.webSocketDebuggerUrl, 'require("electron").app.quit()');
  const exception = result?.exceptionDetails;
  if (exception) {
    throw new Error(`app.quit() failed: ${exception.exception?.description ?? exception.text}`);
  }
}

// With includeCommandLineAPI, the expression can call require, like in the inspector console.
function evaluate(webSocketUrl: string, expression: string) {
  return new Promise<EvaluateReply>((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    socket.addEventListener("open", () => {
      const params = { expression, includeCommandLineAPI: true };
      socket.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params }));
    });
    socket.addEventListener("message", event => {
      const reply = JSON.parse(String(event.data)) as EvaluateReply;
      if (reply.id !== 1) return;
      resolve(reply);
      socket.close();
    });
    socket.addEventListener("error", () => {
      reject(new Error(`Could not reach the inspector at ${webSocketUrl}`));
    });
    socket.addEventListener("close", () =>
      reject(new Error("The inspector closed before replying")),
    );
  });
}
