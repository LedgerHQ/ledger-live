/*
    This test suite simulates an application generating data (using a fixed shchema) and sharing part of the
    data to specific users. The data is encrypted using a StreamTree.
*/

import { StreamTree } from "../StreamTree";
import { Device, device } from "..";
import { Permissions } from "../CommandBlock";
import { StreamTreeCipher } from "../StreamTreeCipher";
import { DerivationPath, crypto } from "../Crypto";

interface SharedObject {
  name: string;
  age: number;
  email: string;
}

interface EncryptedSharedObject {
  name: string;
  age: string;
  email: string;
}

const APPLICATION_ID = 12;

async function encryptSharedObject(
  device: Device,
  tree: StreamTree,
  sharedObject: SharedObject,
  mapping: Map<string, string> = new Map(),
): Promise<EncryptedSharedObject> {
  const cipher = StreamTreeCipher.create(device);
  const encrypt = async (key: keyof typeof sharedObject, defaultPath: string): Promise<string> => {
    return crypto.to_hex(
      await cipher.encrypt(
        tree,
        DerivationPath.toIndexArray(mapping.get(key) || defaultPath),
        new TextEncoder().encode((sharedObject[key] as string | number).toString()),
      ),
    );
  };
  const encryptedSharedObject = {
    name: await encrypt("name", `0h/${APPLICATION_ID}h/0h/0h/0h`),
    age: await encrypt("age", `0h/${APPLICATION_ID}h/0h/1h/0h`),
    email: await encrypt("email", `0h/${APPLICATION_ID}h/0h/2h/0h`),
  };
  return encryptedSharedObject;
}

async function decryptSharedObject(
  device: Device,
  tree: StreamTree,
  encryptedSharedObject: EncryptedSharedObject,
  mapping: Map<string, string> = new Map(),
): Promise<SharedObject> {
  const cipher = StreamTreeCipher.create(device);
  const decrypt = async (key: string, defaultPath: string): Promise<string> => {
    const path = DerivationPath.toIndexArray(mapping.get(key) || defaultPath);
    const bytes = await cipher.decrypt(
      tree,
      path,
      crypto.from_hex(encryptedSharedObject[key as keyof typeof encryptedSharedObject] as string),
    );
    return new TextDecoder().decode(bytes);
  };
  const sharedObject = {
    name: await decrypt("name", `0h/${APPLICATION_ID}h/0h/0h/0h`),
    age: parseInt(await decrypt("age", `0h/${APPLICATION_ID}h/0h/1h/0h`)),
    email: await decrypt("email", `0h/${APPLICATION_ID}h/0h/2h/0h`),
  };
  return sharedObject;
}

describe("Shared object scenario using StreamTree", () => {
  it("should create a tree with 3 members, one member encrypt a shared object and another one decrypts it", async () => {
    const alice = await device.software();
    const bob = await device.software();
    const carol = await device.software();

    // Create a new tree owned by alice
    let tree = await StreamTree.createNewTree(alice);

    // Share the application node with bob
    tree = await tree.share(
      tree.getApplicationRootPath(APPLICATION_ID),
      alice,
      (await bob.getPublicKey()).publicKey,
      "Bob",
      Permissions.OWNER,
    );

    // Bob creates a shared object and encrypt it (1 value -> 1 encryption key)
    const sharedObject = {
      name: "Bob",
      age: 42,
      email: "bob@box.com",
    };
    //console.dir(sharedObject, { depth: null });
    const encryptedObject = await encryptSharedObject(bob, tree, sharedObject);

    // Share the application node with carol
    tree = await tree.share(
      tree.getApplicationRootPath(APPLICATION_ID),
      alice,
      (await carol.getPublicKey()).publicKey,
      "Carol",
      Permissions.OWNER,
    );

    // Decrypt with Carol
    const decryptedObject = await decryptSharedObject(carol, tree, encryptedObject);

    //console.dir(encryptedObject, { depth: null });
    //console.dir(decryptedObject, { depth: null });

    expect(decryptedObject).toEqual(sharedObject);
  });
});
