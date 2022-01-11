import { expect } from "chai"
import { Node } from "../src/node"
import { Bytes32 } from "../src/bytes32"

import { CID } from "multiformats"
import { Block, encode } from 'multiformats/block'

import * as codec from '@ipld/dag-cbor'
import { hasher } from "../src"

const A = Bytes32.from(Array(32).fill(0xAA))
const B = Bytes32.from(Array(32).fill(0xBB))

const Null = Bytes32.from()
const NullCID = CID.parse('bafyrwiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

const toBlock = async (value: any): Promise<Block<any>> => {
  return encode({value, codec, hasher})
}

describe("Node", () => {
  describe("nid", () => {
    it("should create the nid for a leaf", async () => {
      const node = new Node([Null, Null])
      const block = await toBlock([Null, NullCID])
      const cid = Bytes32.from(block.cid.multihash.digest)
      expect(node.nid.equals(cid)).to.be.true
    })

    it("should create the nid for a branch", async () => {
      const node = new Node([Null, Null, 42])
      const block = await toBlock([NullCID, NullCID, 42])
      const cid = Bytes32.from(block.cid.multihash.digest)
      expect(node.nid.equals(cid)).to.be.true
    })
  })

  describe("isLeaf", () => {
    it("should return true if is leaf", () => {
      const node = new Node([A, B])
      expect(node.isLeaf).to.be.true
    })

    it("should return false if is branch", () => {
      const node = new Node([A, B, 42])
      expect(node.isLeaf).to.be.false
    })
  })

  describe("isBranch", () => {
    it("should return true if is branch", () => {
      const node = new Node([A, B, 42])
      expect(node.isBranch).to.be.true
    })

    it("should return false if is leaf", () => {
      const node = new Node([A, B])
      expect(node.isBranch).to.be.false
    })
  })

  describe("cid", () => {
    it("should return true if is branch", async () => {
      const node = new Node([A, B])
      const block = await toBlock([A, CID.decode(B.cid)])
      expect(node.cid).to.eql(block.cid.bytes)
    })
  })

  describe("multihash", () => {
    it("should return true if is branch", async () => {
      const node = new Node([A, B])
      const block = await toBlock([A, CID.decode(B.cid)])
      expect(node.multihash).to.eql(block.cid.multihash.bytes)
    })
  })

  describe("block", () => {
    it("should return cbor encoded leaf block if leaf", async () => {
      const node = new Node([A, B])
      const block = await toBlock([A, CID.decode(B.cid)])
      expect(node.block).to.eql(block.bytes)
    })

    it("should return cbor encoded branch block if branch", async () => {
      const node = new Node([A, B, 16])
      const block = await toBlock([CID.decode(A.cid), CID.decode(B.cid), 16])
      expect(node.block).to.eql(block.bytes)
    })

    it("should return cbor encoded branch block if branch with depth >= 24", async () => {
      const node = new Node([A, B, 42])
      const block = await toBlock([CID.decode(A.cid), CID.decode(B.cid), 42])
      expect(node.block).to.eql(block.bytes)
    })
  })

  describe("decode", () => {
    it("should decode a leaf block", async () => {
      const block = await toBlock([A, CID.decode(B.cid)])
      const node = Node.decode(block.bytes)
      expect(node.raw).to.eql([A, B])
    })

    it("should decode a branch block", async () => {
      const block = await toBlock([CID.decode(A.cid), CID.decode(B.cid), 16])
      const node = Node.decode(block.bytes)
      expect(node.raw).to.eql([A, B, 16])
    })

    it("should decode a branch block with depth >= 24", async () => {
      const block = await toBlock([CID.decode(A.cid), CID.decode(B.cid), 42])
      const node = Node.decode(block.bytes)
      expect(node.raw).to.eql([A, B, 42])
    })
  })
})
