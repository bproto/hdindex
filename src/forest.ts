import { Node, NodeLike } from "./node"
import { DAG, DAGLike } from "./dag"
import { Bytes32 } from "./bytes32"
import { Vector } from "./vector"
import { CID } from "multiformats"

export class Forest {
  private _dag: DAG

  constructor(dag: DAG) { this._dag = dag }

  get dag(): DAG { return this._dag }

  async node(node: NodeLike | Bytes32): Promise<Node> {
    if(node instanceof Bytes32) {
      node = Node.decode(await this.dag.get(CID.decode(node.cid), true))
    } else {
      node = Node.from(node)
      if (!node.isStub) { await this.dag.set(node.block, true) }
    }
    return node
  }

  async sync(vector: Vector): Promise<Vector> {
    await Promise.all(vector.nodes.map(n => this.node(n)))
    return vector
  }

  async insert(origin: Bytes32, path: Bytes32, pointer: Bytes32): Promise<Vector> {
    return this.sync((await this.vector(origin, path)).insert(path, pointer))
  }

  async remove(origin: Bytes32, path: Bytes32): Promise<Vector | undefined> {
    const vector = (await this.vector(origin, path)).remove(path)
    return vector ? this.sync(vector) : vector
  }

  async walk(
    nid: Bytes32,
    path: Bytes32,
    handler: TraversalHandler,
    collector: any = [],
    cursor: Cursor = {}
  ): Promise<any> {
    if (nid.isNull) { return collector }
    const node = await this.node(nid)
    cursor = { path, ...cursor }
    if(node.isBranch) {
      await handler.preOrder?.call(this, node, collector, cursor)
      await this.walk(node.next(path), path, handler, collector, cursor)
      await handler.postOrder?.call(this, node, collector, cursor)
    } else if (node.isLeaf) {
      await handler.leaf?.call(this, node, collector, cursor)
    }
    return collector
  }

  async vector(origin: Bytes32, target: Bytes32): Promise<Vector> {
    const { path, pointer, markers, waypoints } = await this.walk(origin, target, {
      leaf({ path, pointer }, collector, _) {
        collector.path = path
        collector.pointer = pointer
      },
      postOrder(node, collector, _) {
        collector.markers.on(node.marker)
        collector.waypoints.unshift(node.sidenode(collector.path))
      }
    }, { markers: Bytes32.null, waypoints: [] })
    return Vector.from([path, pointer, markers, ...waypoints])
  }

  // Depth first traversal
  async traverse(
    nid: Bytes32,
    handler: TraversalHandler = {},
    collector: any = [],
    cursor: Cursor = {}
  ): Promise<any> {
    if (nid.isNull) { return collector }
    const node = await this.node(nid)
    if(node.isBranch) {
      await handler.preOrder?.call(this, node, collector, cursor)
      await this.traverse(node.left, handler, collector, {...cursor})
      await handler.inOrder?.call(this, node, collector, cursor)
      await this.traverse(node.right, handler, collector, {...cursor})
      await handler.postOrder?.call(this, node, collector, cursor)
    } else if (node.isLeaf) {
      await handler.leaf?.call(this, node, collector, cursor)
    }
    return collector
  }

  static from(forest: ForestLike = DAG.from()): Forest {
    if (forest instanceof Forest) { return forest }
    else { return new Forest(DAG.from(forest)) }
  }
}

export interface TraversalHandler {
  leaf?(node: Node, collector: any, cursor?: any): any
  inOrder?(node: Node, collector: any, cursor?: any): any
  preOrder?(node: Node, collector: any, cursor?: any): any
  postOrder?(node: Node, collector: any, cursor?: any): any
}

export interface Cursor {
  [key: string]: any
}

export type ForestLike = Forest | DAGLike
