import { Bytes32 } from "./bytes32"
import { Node } from "./node"

export class Vector {
  private _markers: Bytes32
  private _waypoints: Array<Bytes32>
  private _progression: Array<number> | undefined

  private _origin: Node | undefined
  private _endpoint: Node

  private _marker: number | undefined
  private _waypoint: Bytes32 | undefined

  private _nodes: Array<Node> | undefined

  constructor(
    endpoint: Node,
    markers: Bytes32,
    waypoints: Array<Bytes32>
  ) {
    this._markers = markers
    this._endpoint = endpoint
    this._waypoints = waypoints
  }

  get root(): Bytes32 { return this.origin.nid }
  get path(): Bytes32 { return this._endpoint.path }
  get pointer(): Bytes32 { return this._endpoint.pointer }

  get markers(): Bytes32 { return this._markers }
  get waypoints(): Array<Bytes32> { return this._waypoints }
  get progression(): Array<number> { return this._progression ??= this.markers.setBits }

  get origin(): Node { return this._origin ??= this.nodes[0] }
  get endpoint(): Node { return this._endpoint }

  get marker(): number { return this._marker ??= this.markers.lsb }
  get waypoint(): Bytes32 | undefined { return this._waypoint ??= [...this._waypoints].pop() }

  get nodes(): Array<Node> {
    return this._nodes ||= this.progression.reduceRight((nodes, marker, i): Array<Node> => {
      return [Node.branch(this.path, nodes[0].nid, this.waypoints[i], marker), ...nodes]
    }, [this.endpoint])
  }

  get encoded(): Array<Bytes32> {
    const { path, pointer, markers, waypoints } = this
    return [path, pointer, markers, ...waypoints]
  }

  contains(path: Bytes32): boolean {
    return this.path.xor(path).and(this.markers).isNull
  }

  insert(path: Bytes32, pointer: Bytes32): Vector {
    if (!this.contains(path)) { throw Error('vector does not contain path') }
    if (this.path.xor(path).isNull) { return this.update(pointer) }

    const marker = this.path.xor(path).msb
    const markers = this.markers.copy.on(marker)

    let node = this.endpoint, i = this.progression.length
    while (i-- && this.progression[i] > marker ) {
      markers.off(this.progression[i])
      node = Node.branch(this.path, node.nid, this.waypoints[i], this.progression[i])
    }

    return Vector.from([path, pointer, markers, ...this.waypoints.slice(0,i+1), node.nid])
  }

  update(pointer: Bytes32): Vector {
    this._endpoint = Node.leaf(this.path, pointer)
    return this
  }

  remove(path: Bytes32 = this.path): Vector | undefined {
    if (!this.path.equals(path)) { throw Error(`unable to remove key ${path.toString(true)}`) }
    if (!this.waypoints.length) { return }

    const waypoints = [...this.waypoints]
    const markers = this.markers.copy.off(this.marker)
    return Vector.stub(waypoints.pop() as Bytes32, this.path, markers, waypoints)
  }

  verify(origin: Bytes32, path: Bytes32 = this.path, pointer: Bytes32 = this.pointer): boolean {
    return (
      this.path.equals(path) &&
      this.pointer.equals(pointer) &&
      this.origin.nid.equals(origin)
    )
  }

  excludes(origin: Bytes32, path: Bytes32): boolean {
    return (
      this.contains(path) &&
      !this.path.equals(path) &&
      this.origin.nid.equals(origin)
    )
  }

  static from(vector: VectorLike): Vector {
    if (vector instanceof Vector) { return vector }
    else {
      const [path, pointer, markers, ...waypoints] = vector
      return new Vector(Node.leaf(path, pointer), markers, waypoints)
    }
  }

  static stub(nid: Bytes32, path: Bytes32, markers: Bytes32, waypoints: Array<Bytes32>): Vector {
    return new Vector(Node.stub(nid, path), markers, waypoints)
  }
}

export type VectorLike = Vector | Array<Bytes32>
