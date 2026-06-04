// A lightweight, fast non-cryptographic hashing function (MurmurHash3)
function murmurhash3_32_gc(key: string, seed = 0): string {
  const remainder = key.length & 3;
  const bytes = key.length - remainder;
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let i = 0;

  while (i < bytes) {
    let k1 =
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(++i) & 0xff) << 8) |
      ((key.charCodeAt(++i) & 0xff) << 16) |
      ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }

  let k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
      // fall through
    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
      // fall through
    case 1:
      k1 ^= key.charCodeAt(i) & 0xff;
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return (h1 >>> 0).toString(16);
}

// Generate a unique fingerprint from browser attributes
export function getFingerprint(): string {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "ssr-fallback";
  }
  const navigatorKeys = [
    navigator.userAgent || "unknown-ua",
    navigator.language || "unknown-lang",
    typeof screen !== "undefined" ? screen.colorDepth : "24",
    typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "1920x1080",
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 2
  ].join("|");

  return murmurhash3_32_gc(navigatorKeys);
}
