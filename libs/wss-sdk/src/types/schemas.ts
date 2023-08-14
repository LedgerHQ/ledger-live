import { z } from "zod";

export const schemaEncryptedClientData = z.object({
  id: z.string(),
  ownerId: z.string(),
  dataTypeId: z.number(),
  encryptedData: z.string(),
  date: z.string(),
});

export type EncryptedClientData = z.infer<typeof schemaEncryptedClientData>;

/*
model EncryptedClientData {
  id           Int      @id @default(autoincrement())
  ownerId      String // indexed
  type         DataType @relation(fields: [objectTypeId], references: [id])
  data         Bytes
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  objectTypeId String
}

model DataType {
  id                  String                @id @default(cuid()) // indexed
  type                String // indexed
  jsonSchema          String // JSONB
  EncryptedClientData EncryptedClientData[]
}

*/
