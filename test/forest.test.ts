import { expect } from "chai"
import { Forest } from "../src/forest"
import { Bytes32 } from "../src/bytes32"
import { LeafOrBranch, Node } from "../src/node"

const A = Bytes32.from(Array(32).fill(0xAA))

const buildTree = async (forest: Forest, node: Array<any>): Promise<Node> => {
  node = await Promise.all(node.map(n => Array.isArray(n) ? buildTree(forest, n) : n ))
  node[0] = node[0]?.nid ?? Bytes32.from(node[0])
  node[1] = node[1]?.nid ?? Bytes32.from(node[1])
  return forest.node(node as LeafOrBranch)
}

const TreeA = [
  [Bytes32.from("0000"), A],
  [Bytes32.from("0100"), A],
  247
]

describe("Forest", function() {
  beforeEach(function() {
    this.forest = Forest.from()
  })

  describe("vector", function() {
    it("should return the starting node if it is a leaf", async function() {
      const { forest } = this
      const root = await buildTree(forest, ["deadbeef", A])
      const vector = await forest.vector(root.nid, Bytes32.from("1"))
      expect(vector.origin.equals(root)).to.be.true
    })

    it("should follow a branch down to a matching leaf", async function() {
      const { forest } = this
      const root = await buildTree(forest, TreeA)
      const { endpoint: { nid } } = await forest.vector(root.nid, Bytes32.from("0100"))
      expect(nid.equals(root.right)).to.be.true
    })

    it("should follow a branch down to sibling leaf", async function() {
      const { forest } = this
      const root = await buildTree(forest, TreeA)
      const { endpoint } = await forest.vector(root.nid, Bytes32.from("0001"))
      expect(endpoint.nid.equals(root.left)).to.be.true
    })
  })

  describe("traverse", () => {
    it("should traverse a tree from a root", async function() {
      const { forest } = this
      const root = await buildTree(forest, TreeA)
      const leaves = await forest.traverse(root.nid, {
        leaf(node: any, collector: any) {
          collector.push(node.key.toString())
        }
      }, [])

      expect(leaves.length).to.equal(2)
    })
  })
})
