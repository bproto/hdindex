const log2 = (byte: number): number | undefined => {
  if (!byte) { return }
  let bit = 0
  if (byte >> 4) { bit += 4; byte >>= 4 }
  if (byte >> 2) { bit += 2; byte >>= 2 }
  if (byte >> 1) { bit += 1 }
  return bit
}

export interface Bytes32 {
  readonly length: 32;
}

export class Bytes32 extends Uint8Array {
  constructor(bytes: Bytes32Like = []) {
    if (bytes instanceof Bytes32) { bytes = bytes.buffer }
    else if (Array.isArray(bytes)) { bytes = [...Array(32).fill(0), ...bytes].slice(-32) }
    else if (typeof bytes == "string") {
      const hex = (bytes.match(/^ *(0x|0X)?([a-fA-F0-9]+)$/) || [])[2]
      if (!hex) { throw Error("invalid hex string") }
      bytes = (hex.padStart(64, '0').match(/.{1,2}/g) || []).map(byte => parseInt(byte, 16))
    }
    super(bytes)
  }

  get copy(): Bytes32 { return new Bytes32(this.buffer.slice(0)) }

  get isZero(): boolean { return !this.ones }
  get isNull(): boolean { return this.isZero }
  get isEmpty(): boolean { return this.isZero }

  toString(compact: boolean = false): string {
    let hex = this.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
    if (compact) { hex = hex.replace(/^(00)+/, '') }
    return '0x' + hex
  }

  toBin(compact: boolean = false, bit: number = -1): string {
    let hex = this.reduce((str, byte) => str + byte.toString(2).padStart(8, '0'), '')
    if (bit >= 0 && bit <= 255) {
      bit -= 256
      hex = `${hex.substring(0, hex.length + bit)}\x1b[31m${hex.substring(bit)}\x1b[0m`
    }
    if (compact) { hex = hex.replace(/^(00000000)+/, '') }
    return '0b' + hex
  }

  // twiddle the bits
  on(index: number, le: boolean = false): Bytes32 {
    if (le) { index = 255 - index }
    this._checkIndex(index)
    this[(index >> 3)] |= (0x80 >> (index & 7))
    return this
  }

  off(index: number, le: boolean = false): Bytes32 {
    if (le) { index = 255 - index }
    this._checkIndex(index)
    this[index >> 3] &= ~(0x80 >> (index & 7))
    return this
  }

  flip(index: number, le: boolean = false): Bytes32 {
    if (le) { index = 255 - index }
    this._checkIndex(index)
    this[index >> 3] ^= (0x80 >> (index & 7))
    return this
  }

  // read the bits
  bit(index: number, le: boolean = false): number {
    if (le) { index = 255 - index }
    this._checkIndex(index)
    return (this[index >> 3] >> (7 - index % 8)) & 1
  }

  get lsb(): number {
    let byte, i = 31
    while (!(byte = this[i]) && i--) { }
    return (i*8) + 7 - (log2(byte^(byte &= byte-1)) ?? 0)
  }

  get msb(): number {
    let byte, i = 0
    while (!(byte = this[i]) && i < 31) { i++ }
    return (i*8) + 7 - (log2(byte) ?? 256)
  }

  get ones(): number {
    return this.reduce((ones, byte) => {
      while(byte) { byte &= (byte - 1); ones++ }
      return ones
    }, 0)
  }

  get zeros(): number { return 256 - this.ones }

  get setBits(): Array<number> {
    return this.reduceRight((bits: Array<number>, byte: number, i: number) => {
      while(byte) { bits.unshift((i*8) + 7 - (log2(byte^(byte &= byte-1)) ?? 0)) }
      return bits
    }, [])
  }

  // convert
  get multihash(): Uint8Array {
    return Uint8Array.from([
      0x1B, // hash(keccak-256)
      0x20, // bytes(32)
      ...Array.from(this)
    ])
  }

  get cid(): Uint8Array {
    return Uint8Array.from([
      0x01, // version(1)
      0x71, // codec(dag-cbor)
      ...Array.from(this.multihash)
    ])
  }


  // bitwise
  get not(): Bytes32 {
    return this.reduce((bytes: Bytes32, byte, i) => {
      bytes[i] = ~byte & 0xff
      return bytes
    }, this.copy)
  }

  iand(b: Bytes32): Bytes32 {
    return b.reduce((bytes: Bytes32, byte, i) => {
      bytes[i] &= byte
      return bytes
    }, this)
  }

  and(b: Bytes32): Bytes32 { return this.copy.iand(b) }

  ior(b: Bytes32): Bytes32 {
    return b.reduce((bytes: Bytes32, byte, i) => {
      bytes[i] |= byte
      return bytes
    }, this)
  }

  or(b: Bytes32): Bytes32 { return this.copy.ior(b) }

  ixor(b: Bytes32): Bytes32 {
    return b.reduce((bytes: Bytes32, byte, i) => {
      bytes[i] ^= byte
      return bytes
    }, this)
  }

  xor(b: Bytes32): Bytes32 { return this.copy.ixor(b) }

  compare(b: Bytes32): number { return this.xor(b).msb }

  equals(b: Bytes32): boolean {
    return this.compare(b) === -1
  }

  private _checkIndex(index: number) {
    if (index > 255 || index < 0) { throw Error(`index (${index}) out of bounds`) }
  }

  static from(bytes: any = []): Bytes32 {
    bytes = bytes?.digest ?? bytes
    bytes = bytes?.multihash?.digest ?? bytes
    return new Bytes32(bytes)
  }

  static normalize(bytes: Array<any>): Array<Bytes32> {
    return bytes.map(b => Bytes32.from(b))
  }

  static get zero(): Bytes32 { return new Bytes32() }
  static get null(): Bytes32 { return Bytes32.zero }
  static get empty(): Bytes32 { return Bytes32.zero }

}

export type Bytes32Like = string | Bytes32 | ArrayBufferLike | Array<number>
