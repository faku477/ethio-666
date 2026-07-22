/**
 * Pixel dimensions from image bytes.
 *
 * The browser can read a photo's dimensions with an `Image` element, but the
 * browser is not a control: a hand-crafted request never runs that code. The
 * server therefore reads the dimensions out of the file header itself.
 *
 * Written by hand rather than pulled from a package — the three formats this
 * application accepts each state their size in the first few dozen bytes, and
 * an image-processing dependency would be a large amount of native code to
 * carry for that.
 */

export type ImageDimensions = { width: number; height: number };

/**
 * Returns the dimensions declared by the file, or null when they cannot be
 * read — a truncated file, an unsupported format, or bytes that are not an
 * image at all.
 */
export function readImageDimensions(
  bytes: Uint8Array,
): ImageDimensions | null {
  return readPng(bytes) ?? readWebp(bytes) ?? readJpeg(bytes);
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset]! << 24) |
      (bytes[offset + 1]! << 16) |
      (bytes[offset + 2]! << 8) |
      bytes[offset + 3]!) >>>
    0
  );
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset]! |
      (bytes[offset + 1]! << 8) |
      (bytes[offset + 2]! << 16) |
      (bytes[offset + 3]! << 24)) >>>
    0
  );
}

function matches(bytes: Uint8Array, offset: number, ascii: string): boolean {
  for (let i = 0; i < ascii.length; i += 1) {
    if (bytes[offset + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

/** PNG: an IHDR chunk at a fixed offset, width and height as big-endian u32. */
function readPng(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 24) return null;

  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (signature.some((b, i) => bytes[i] !== b)) return null;
  if (!matches(bytes, 12, "IHDR")) return null;

  return { width: readUint32BE(bytes, 16), height: readUint32BE(bytes, 20) };
}

/** WebP: RIFF container with three possible chunk layouts, all little-endian. */
function readWebp(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 30) return null;
  if (!matches(bytes, 0, "RIFF") || !matches(bytes, 8, "WEBP")) return null;

  // Lossy: 14-bit dimensions after the VP8 start code.
  if (matches(bytes, 12, "VP8 ")) {
    return {
      width: (bytes[26]! | (bytes[27]! << 8)) & 0x3fff,
      height: (bytes[28]! | (bytes[29]! << 8)) & 0x3fff,
    };
  }

  // Lossless: 14-bit dimensions packed across four bytes, minus one.
  if (matches(bytes, 12, "VP8L")) {
    const bits = readUint32LE(bytes, 21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  // Extended: 24-bit dimensions, minus one.
  if (matches(bytes, 12, "VP8X")) {
    return {
      width: (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16)) + 1,
      height: (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16)) + 1,
    };
  }

  return null;
}

/**
 * JPEG: dimensions live in a start-of-frame marker, whose position depends on
 * how many other segments precede it, so the segment chain has to be walked.
 */
function readJpeg(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;

  while (offset + 9 < bytes.length) {
    // Segments start with 0xFF; padding fill bytes are also 0xFF and are skipped.
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1]!;

    // Standalone markers carry no length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    // Start of scan — the compressed data begins; no frame header follows.
    if (marker === 0xda) return null;

    const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
    if (length < 2) return null;

    // SOF0..SOF15, excluding the DHT/JPG/DAC markers interleaved in that range.
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isStartOfFrame) {
      return {
        height: (bytes[offset + 5]! << 8) | bytes[offset + 6]!,
        width: (bytes[offset + 7]! << 8) | bytes[offset + 8]!,
      };
    }

    offset += 2 + length;
  }

  return null;
}
