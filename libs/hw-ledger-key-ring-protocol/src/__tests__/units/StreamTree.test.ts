import { StreamTree } from "../../StreamTree";
import { device } from "../..";
import { Permissions } from "../../CommandBlock";

const APP_LEDGER_SYNC = 16;
const APP_RING = 17;

async function streamAt(tree: StreamTree, applicationId: number) {
  const stream = tree.getChild(tree.getApplicationRootPath(applicationId));
  if (!stream) throw new Error("missing stream for application " + applicationId);
  return stream.resolve();
}

describe("StreamTree application enumeration + closure", () => {
  it("has no application stream on a freshly created tree", async () => {
    const tree = await StreamTree.createNewTree(await device.software());
    expect(tree.getApplicationStreams()).toEqual([]);
    expect(await tree.hasAnotherOpenApplication(APP_LEDGER_SYNC)).toBe(false);
  });

  it("enumerates application streams and detects other open applications", async () => {
    const alice = await device.software();
    const bob = await device.software();
    const bobKey = (await bob.getPublicKey()).publicKey;

    let tree = await StreamTree.createNewTree(alice);
    tree = await tree.share(
      tree.getApplicationRootPath(APP_LEDGER_SYNC),
      alice,
      bobKey,
      "Bob",
      Permissions.OWNER,
    );
    tree = await tree.share(
      tree.getApplicationRootPath(APP_RING),
      alice,
      bobKey,
      "Bob",
      Permissions.OWNER,
    );

    expect(
      tree
        .getApplicationStreams()
        .map(a => a.applicationId)
        .sort(),
    ).toEqual([APP_LEDGER_SYNC, APP_RING]);

    // both applications are open
    expect(await streamAt(tree, APP_LEDGER_SYNC).then(r => r.isClosed())).toBe(false);
    expect(await tree.hasAnotherOpenApplication(APP_LEDGER_SYNC)).toBe(true); // ring is open
    expect(await tree.hasAnotherOpenApplication(999)).toBe(true); // both are "other" and open

    // close the ring application
    tree = await tree.close(tree.getApplicationRootPath(APP_RING), alice);

    // the closed stream is now observable as closed
    expect(await streamAt(tree, APP_RING).then(r => r.isClosed())).toBe(true);
    expect(await streamAt(tree, APP_LEDGER_SYNC).then(r => r.isClosed())).toBe(false);

    // ledger sync is now the last open application; ring still sees ledger sync open
    expect(await tree.hasAnotherOpenApplication(APP_LEDGER_SYNC)).toBe(false);
    expect(await tree.hasAnotherOpenApplication(APP_RING)).toBe(true);
  });
});
