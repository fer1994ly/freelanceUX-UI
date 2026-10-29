export interface IdGenerator {
  /** Internal entity id. */
  id(): string
  /** Opaque, unguessable token for public links and QR codes. */
  token(): string
}

const hex = (bytes: number): string => {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

export class CryptoIdGenerator implements IdGenerator {
  id(): string {
    return hex(8)
  }
  token(): string {
    return hex(16)
  }
}
