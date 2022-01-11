import { Bytes32 } from "./bytes32"
import sha3 from "js-sha3"

export class Node {
  private _raw: LeafOrBranch
  private _stub: boolean = false

  private _nid: Bytes32 | undefined
  private _cid: Uint8Array | undefined
  private _block: Uint8Array | undefined
  private _multihash: Uint8Array | undefined

  constructor(raw: LeafOrBranch, nid?: Bytes32) {
    this._raw = raw
    if (nid) {
      this._stub = true
      this._nid = nid
    }
  }

  get raw(): LeafOrBranch { return [...this._raw] }
  get nid(): Bytes32 { return this._nid ||= this._encode(this.block) }

  get isStub(): boolean { return this._stub }
  get isLeaf(): boolean { return !this._stub && this._raw.length === 2 }
  get isBranch(): boolean { return !this._stub && this._raw.length === 3 }

  get key(): Bytes32 { return this._raw[0] }
  get value(): Bytes32 { return this._raw[1] }

  get path(): Bytes32 { return this._raw[0] }
  get pointer(): Bytes32 { return this._raw[1] }

  get left(): Bytes32 { return this._raw[0] }
  get right(): Bytes32 { return this._raw[1] }
  get depth(): number { return this._raw[2] ?? -1 }
  get marker(): number { return this._raw[2] ?? -1 }
  get children(): Children { return [this._raw[0], this._raw[1]] }

  get cid(): Uint8Array { return this._cid ||= this.nid.cid }
  get multihash(): Uint8Array { return this._multihash ||= this.nid.multihash }

  get block(): Uint8Array { return this._block ||= this._createBlock() }

  next(path: Bytes32): Bytes32 {
    return this.children[0^path.bit(this.depth)]
  }

  sidenode(path: Bytes32): Bytes32 {
    return this.children[1^path.bit(this.depth)]
  }

  set(node: Bytes32, path: Bytes32): Branch {
    const branch = this.raw as Branch
    branch[0^path.bit(this.depth)] = node
    return branch
  }

  equals(node: Node) { return this.nid.equals(node.nid) }

  private _encode(bytes: Uint8Array): Bytes32 {
    return Bytes32.from(sha3.keccak256.array(bytes))
  }

  private _cidBlock(cid: Bytes32): Uint8Array {
    return Uint8Array.from([
      0xD8, 0x2A, // tag(42)
      0x58, 0x25, // bytes(37)
      0x00, ...Array.from(cid.cid)
    ])
  }

  private _leafBlock(): Uint8Array {
    return Uint8Array.from([
      0x82, // array(2)
      0x58, 0x20, // bytes(32)
      ...Array.from(this.key),
      ...Array.from(this._cidBlock(this.value))
    ])
  }

  private _branchBlock(): Uint8Array {
    const depth = this.depth
    return Uint8Array.from([
      0x83, // array(3)
      ...Array.from(this._cidBlock(this.left)),
      ...Array.from(this._cidBlock(this.right)),
      ...(depth >= 24 ? [0x18, depth] : [depth])
    ])
  }

  private _createBlock(): Uint8Array {
    if (this.isLeaf) { return this._leafBlock() }
    else if ( this.isBranch ) { return this._branchBlock() }
    return Uint8Array.from([]) // just incase
  }

  static from(node: NodeLike) {
    if (node instanceof Node) { return node }
    else if (node instanceof Uint8Array) { return Node.decode(node) }
    else { return new Node(node) }
  }

  static decode(block: Uint8Array): Node {
    if(block[0] === 0x82) {
      return new Node([
        Bytes32.from(block.slice(3,35)),
        Bytes32.from(block.slice(44,76))
      ])
    } else if (block[0] === 0x83) {
      return new Node([
        Bytes32.from(block.slice(10,42)),
        Bytes32.from(block.slice(51,83)),
        block[83] === 0x18 ? block[84] : block[83]
      ])
    }
    throw Error('invalid block')
  }

  static stub(nid: Bytes32, path: Bytes32 = Bytes32.null): Node {
    return new Node([path, Bytes32.null], nid)
  }

  static leaf(path: Bytes32, pointer: Bytes32): Node {
    return new Node([path, pointer])
  }

  static branch(path: Bytes32, node: Bytes32, sidenode: Bytes32, depth: number): Node {
    const bit = path.bit(depth)
    const children = [node, sidenode]
    return new Node([children[0^bit], children[1^bit], depth])
  }
}

export type Leaf = [Bytes32, Bytes32]
export type Branch = [Bytes32, Bytes32, number]

export type LeafOrBranch = Leaf | Branch
export type NodeLike = Node | LeafOrBranch | Uint8Array
export type Children = [Bytes32, Bytes32]
