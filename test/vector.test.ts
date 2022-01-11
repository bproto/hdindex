import { expect } from "chai"
import { Vector } from "../src/vector"
import { Bytes32 } from "../src/bytes32"

const Empty = Bytes32.empty

const TestVectorA = [Empty, Empty, Bytes32.from('0x03'), Empty, Empty]
const TestVectorB = [Empty, Empty, Bytes32.from('0x04'), Empty, Empty]
const TestVectorC = [Bytes32.from('0x80'), Empty, Bytes32.from('0x12'), Empty, Empty]


describe("Vector", () => {
  describe("progression", () => {
    it("should convert markers to a progression", () => {
      const vector = Vector.from(TestVectorA)
      expect(vector.progression).to.eql([254, 255])
    })
  })

  describe("origin", () => {
    it("should calculate the origin node", () => {
      const vector = Vector.from(TestVectorA)
      expect(vector.origin.nid.toString()).to.eql('0x25eedc89591e140bab821aff820dfc7ccf55635c261696128f5aab81c14f3951')
    })
  })

  describe("endpoint", () => {
    it("should calculate the endpoint node", () => {
      const vector = Vector.from(TestVectorA)
      expect(vector.endpoint.nid.toString()).to.eql('0xdeb261c8185503783a53c731dec6a4070de3be930772cc4360ea771469d41f5a')
    })
  })

  describe("contains", () => {
    it("should return true if paths match at markers", () => {
      const vector = Vector.from(TestVectorB)
      expect(vector.contains(Bytes32.from('0x01'))).to.be.true
      expect(vector.contains(Bytes32.from('0x08'))).to.be.true
    })

    it("should return false if path diverges at a marker", () => {
      const vector = Vector.from(TestVectorB)
      expect(vector.contains(Bytes32.from('0x04'))).to.be.false
    })
  })

  describe("insert", () => {
    it("should return new vector", () => {
      const vector = Vector.from(TestVectorC).insert(Bytes32.from('0x09'), Empty)
      expect(vector.path.equals(Bytes32.from('0x09'))).to.be.true
    })
  })
})
