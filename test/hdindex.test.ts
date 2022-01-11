import { expect } from "chai"
import { Bytes32 } from "../src/bytes32"
import { HDIndex } from "../src/hdindex"

import { CID } from "multiformats"

const testKeys = ["a", "3", "2b", "20", "9", "17"]

const ACID = CID.parse('bafyrwig7uv6fil7kfhwsslhpbtqtluhcegetmx5ftk7ny6rrbn2rvttij4')
const BCID = CID.parse('bafyrwidh7lj37ipagin5aiokqboocsdw4ufmvsgkquzo3kgl7esnuvsrma')

describe("HDIndex", function() {
  beforeEach(function() {
    this.index = HDIndex.from()
  })

  describe("Create hexadecimal trees", function() {
    it("should create an empty hdindex", async function() {
      const { index } = this
      expect(index.isEmpty).to.be.true
    })
  })

  describe("Add new entries (key/value) in the tree", function() {
    it("Should add a new entry", async function() {
      const { index } = this
      await index.set("2", ACID)
      expect(index.isEmpty).to.be.false
    })

    it("Should not change when adding the same entry", async function() {
      const { index } = this
      const root = await index.set("2", ACID)
      await index.set("2", ACID)
      expect((index.root).equals(root)).to.be.true
    })

    it("Should wrap in CID", async function() {
      const { index } = this
      await index.set("2", { hello: "world" })
      expect(index.root.toString()).to.be.equal("0xfbb534f06c89a6d57f40577e425e85e0a8c29f4aa83c77ed972ac210ed116e59")
    })

    it("Should add 6 new entries and create the correct root hash", async function() {
      const { index } = this
      for (const key of testKeys) { await index.set(key, ACID) }
      const root = CID.decode(index.root.cid)
      expect(root.toString()).to.equal("bafyrwieysln5nb63blnb22us6npfi6bvo25q7d4su2baegfyabj6cavu34")
    })
  })

  describe("Get values from the tree", function() {
    it("Should get a value from the tree using an existing key", async function() {
      const { index } = this
      await index.set("2", ACID)
      const cid = await index.get("2")
      expect(cid.equals(ACID)).to.be.true
    })

    it("Should not get a value from the tree using a non-existing key", async function() {
      const { index } = this
      await index.set("2", ACID)
      const cid = await index.get("1")
      expect(cid).to.be.undefined
    })
  })

  describe("Update values in the tree", function() {
    it("Should update a value of an existing key", async function() {
      const { index } = this
      await index.set("2", ACID)
      await index.set("2", 'hello')
      expect(await index.get("2")).to.equal('hello')
    })
  })

  describe("Delete entries from the tree", function() {
    it("Should delete an entry with an existing key", async function() {
      const { index } = this
      await index.set("2", ACID)
      await index.delete("2")
      expect(index.isEmpty).to.be.true
    })

    it("Should delete 3 entries and create the correct root hash", async function() {
      const { index } = this
      for (const key of testKeys) { await index.set(key, ACID) }
      for (const key of testKeys) { await index.delete(key) }
      expect(index.isEmpty).to.be.true
    })

    it("Should not delete an entry with a non-existing key", async function() {
      const { index } = this
      expect(await index.delete("1").catch((_: any) => false)).to.be.false
    })
  })

  describe("Create Merkle proofs and verify them", function() {
    it("Should create some Merkle proofs and verify them", async function() {
      const { index } = this
      for (const key of testKeys) { await index.set(key, ACID) }
      await index.set("01", BCID)
      await index.set("05", BCID)
      const proof = await index.proof("01")
      expect(await index.verify(proof)).to.be.true
    })

    it("Should not verify a wrong Merkle proof", async function() {
      const { index } = this
      for (const key of testKeys) { await index.set(key, ACID) }
      const proof = (await index.proof("19")).encoded
      const valid = await index.verify(proof, Bytes32.null)
      expect(valid).to.be.false
    })
  })
})
