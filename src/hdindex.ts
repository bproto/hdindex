import { Bytes32, Bytes32Like } from "./bytes32"
import { Vector, VectorLike} from "./vector"
import { Forest, ForestLike } from "./forest"

import { CID } from "multiformats"

export class HDIndex {
  private _forest: Forest
  private _root: Bytes32 = Bytes32.null

  constructor(forest: Forest) { this._forest = forest }

  get forest(): Forest { return this._forest }
  get root(): Bytes32 { return this._root }
  get cid(): CID { return CID.decode(this._root.cid) }

  get isEmpty(): boolean { return this._root.isNull }

  async set(key: Bytes32Like, value: any, root: CIDLike = this.root): Promise<Bytes32> {
    const pointer = await this.forest.dag.set(value)
    const [_key, _root, _pointer] = Bytes32.normalize([key, root, pointer])

    return this._root = _root.isNull
      ? (await this.forest.node([_key, _pointer])).nid
      : (await this.forest.insert(_root, _key, _pointer)).origin.nid
  }

  async get(key: Bytes32Like, root: CIDLike = this.root): Promise<any> {
    const [_key, _root] = Bytes32.normalize([key, root])
    const { path, pointer } = await this.forest.vector(_root, _key)
    return path.equals(_key) ? this.forest.dag.get(CID.decode(pointer.cid)) : undefined
  }

  async delete(key: Bytes32Like, root: CIDLike = this.root): Promise<Bytes32> {
    const [_key, _root] = Bytes32.normalize([key, root])
    if (_root.isNull) { throw Error("index is empty") }

    return this._root = (await this.forest.remove(_root, _key))?.origin.nid ?? Bytes32.null
  }

  async proof(key: Bytes32Like, root: CIDLike = this.root): Promise<Vector> {
    const [_key, _root] = Bytes32.normalize([key, root])
    return this.forest.vector(_root, _key)
  }

  async verify(vector: VectorLike, root: CIDLike = this.root): Promise<boolean> {
    const [_root] = Bytes32.normalize([root])
    const _vector = Vector.from(vector)
    return _vector.origin.nid.equals(_root)
  }

  async draw(origin: Bytes32 = this.root): Promise<string> {
    const result = await this.forest.traverse(origin, {
      leaf: (node, collector, cursor) => {
        cursor.prefix = cursor.last ? ' └─ ' : ' ├─ '
        const hex = node.key.toString(true)
        const bin = node.key.toBin(true, cursor.depth)
        collector.push(`${cursor.gutter+cursor.prefix}\x1b[36m${hex} \x1b[32m${bin}\x1b[0m`)
        return cursor
      },
      preOrder: (node, collector, cursor) => {
        cursor.prefix = cursor.last ? ' └─ ' : ' ├─ '
        collector.push(`${cursor.gutter + cursor.prefix}\x1b[33m${node.depth}\x1b[0m`)
        cursor.gutter = cursor.gutter + (cursor.last ? '  ' : ' │')
        cursor.depth = node.depth
        cursor.last = false
        return cursor
      },
      inOrder: (_, __, cursor) => {
        cursor.last = true
        return cursor
      }
    }, [], { last: true, gutter: '' })
    return '\n\n' + [origin.toString(true), ...result].join('\n') + '\n\n'
  }

  static from(hdindex?: HDIndexLike): HDIndex {
    if (hdindex instanceof HDIndex) { return hdindex }
    else { return new HDIndex(Forest.from(hdindex)) }
  }
}

export type CIDLike = CID | Bytes32Like
export type HDIndexLike = HDIndex | ForestLike
