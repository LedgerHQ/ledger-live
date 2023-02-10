import zlib from "zlib";

/*
  Utility classes to extract zip files.
  See: https://en.wikipedia.org/wiki/ZIP_(file_format)#File_headers
*/

// Get the "End of central directory record" (EOCD)
function getEndOfCentralDirectory(buffer: Buffer) {
  let eodOffset = buffer.length - 4;
  const EOD_SIGNATURE = 0x06054b50;
  while (eodOffset > 0) {
    const test = buffer.readUInt32LE(eodOffset);
    if (test === EOD_SIGNATURE) break;
    eodOffset--;
  }
  if (eodOffset === 0) throw new Error("End of central directory not found");
  return {
    eodOffset,
    eodSignature: buffer.readUInt32LE(eodOffset),
    diskNumber: buffer.readUInt16LE(eodOffset + 4),
    diskWhereCentralDirectoryStarts: buffer.readUInt16LE(eodOffset + 6),
    numberOfCentralDirectoryRecordsOnThisDisk: buffer.readUInt16LE(
      eodOffset + 8
    ),
    totalNumberOfCentralDirectoryRecords: buffer.readUInt16LE(eodOffset + 10),
    sizeOfCentralDirectory: buffer.readUInt32LE(eodOffset + 12),
    offsetOfStartOfCentralDirectory: buffer.readUInt32LE(eodOffset + 16),
  };
}

// Generator function that yields one entry from the central directory
function* centralDirectoryYielder(
  buffer: Buffer,
  offset: number,
  eodOffset: number
) {
  while (offset < eodOffset) {
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const entry = {
      centralDirectoryFileHeaderSignature: buffer.readUInt32LE(offset),
      versionMadeBy: buffer.readUInt16LE(offset + 4),
      versionNeededToExtract: buffer.readUInt16LE(offset + 6),
      generalPurposeBitFlag: buffer.readUInt16LE(offset + 8),
      compressionMethod: buffer.readUInt16LE(offset + 10),
      fileLastModificationTime: buffer.readUInt16LE(offset + 12),
      fileLastModificationDate: buffer.readUInt16LE(offset + 14),
      crc32OfUncompressedData: buffer.readUInt32LE(offset + 16),
      compressedSize: buffer.readUInt32LE(offset + 20),
      uncompressedSize: buffer.readUInt32LE(offset + 24),
      fileNameLength,
      extraFieldLength,
      fileCommentLength,
      diskNumberWhereFileStarts: buffer.readUInt16LE(offset + 34),
      internalFileAttributes: buffer.readUInt16LE(offset + 36),
      externalFileAttributes: buffer.readUInt32LE(offset + 38),
      relativeOffsetOfLocalFileHeader: buffer.readUInt32LE(offset + 42),
      fileName: buffer
        .slice(offset + 46, offset + 46 + fileNameLength)
        .toString("utf8"),
      extraField: buffer.slice(
        offset + 46 + fileNameLength,
        offset + 46 + fileNameLength + extraFieldLength
      ),
      fileComment: buffer.slice(
        offset + 46 + fileNameLength + extraFieldLength,
        offset + 46 + fileNameLength + extraFieldLength + fileCommentLength
      ),
    };
    yield entry;
    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }
}

// Read the local file header
function readLocalHeader(buffer: Buffer, offset: number) {
  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraFieldLength = buffer.readUInt16LE(offset + 28);

  return {
    length: 30 + fileNameLength + extraFieldLength,
    localFileHeaderSignature: buffer.readUInt32LE(offset),
    versionNeededToExtract: buffer.readUInt16LE(offset + 4),
    generalPurposeBitFlag: buffer.readUInt16LE(offset + 6),
    compressionMethod: buffer.readUInt16LE(offset + 8),
    fileLastModificationTime: buffer.readUInt16LE(offset + 10),
    fileLastModificationDate: buffer.readUInt16LE(offset + 12),
    crc32OfUncompressedData: buffer.readUInt32LE(offset + 14),
    compressedSize: buffer.readUInt32LE(offset + 18),
    uncompressedSize: buffer.readUInt32LE(offset + 22),
    fileNameLength,
    extraFieldLength,
    fileName: buffer
      .slice(offset + 30, offset + 30 + fileNameLength)
      .toString("utf-8"),
    extraField: buffer.slice(
      offset + 30 + fileNameLength,
      offset + 30 + fileNameLength + extraFieldLength
    ),
  };
}

// Unzip a single file from a zip buffer.
// /!\ Do not use when there are multiple files/folders inside the archive
export function unzipSingleFile(buffer: Buffer): Buffer {
  const endOfCentralDirectory = getEndOfCentralDirectory(buffer);
  const centralDirectory = centralDirectoryYielder(
    buffer,
    endOfCentralDirectory.offsetOfStartOfCentralDirectory,
    endOfCentralDirectory.eodOffset
  );
  const centralDirectoryEntry = centralDirectory.next().value;
  if (!centralDirectoryEntry) return Buffer.alloc(0);
  const localHeader = readLocalHeader(
    buffer,
    centralDirectoryEntry.relativeOffsetOfLocalFileHeader
  );
  const start =
    centralDirectoryEntry.relativeOffsetOfLocalFileHeader + localHeader.length;
  const end = start + centralDirectoryEntry.compressedSize;
  return zlib.inflateRawSync(buffer.slice(start, end));
}
