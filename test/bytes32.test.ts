import { expect } from "chai"
import { Bytes32 } from "../src/bytes32"

describe("Bytes32", () => {
  describe("constructor", () => {
    it("should parse a 0x hex string", () => {
      const bytes = new Bytes32("0xdeadbeef")
      expect(bytes.toString()).to.equal("0x00000000000000000000000000000000000000000000000000000000deadbeef")
    })

    it("should parse a 0X hex string", () => {
      const bytes = new Bytes32("0Xdeadbeef")
      expect(bytes.toString()).to.equal("0x00000000000000000000000000000000000000000000000000000000deadbeef")
    })

    it("should parse a hex string", () => {
      const bytes = new Bytes32("deadbeef")
      expect(bytes.toString()).to.equal("0x00000000000000000000000000000000000000000000000000000000deadbeef")
    })

    it("should parse a hex string and pad left", () => {
      const bytes = new Bytes32("ace")
      expect(bytes.toString()).to.equal("0x0000000000000000000000000000000000000000000000000000000000000ace")
    })
  })

  describe("toString", () => {
    it("should return 0x hex", () => {
      const bytes = new Bytes32([15,255])
      expect(bytes.toString()).to.equal("0x0000000000000000000000000000000000000000000000000000000000000fff")
    })
  })

  describe("bit", () => {
    it("should return be bit at index", () => {
      const a = new Bytes32(Array(32).fill(0xF0)) // 11110000 11110000
      expect(a.bit(0)).to.equal(1)
      expect(a.bit(4)).to.equal(0)
      expect(a.bit(251)).to.equal(1)
      expect(a.bit(255)).to.equal(0)
    })

    it("should return le bit at index", () => {
      const a = new Bytes32(Array(32).fill(0xF0)) // 11110000 11110000
      expect(a.bit(0, true)).to.equal(0)
      expect(a.bit(4, true)).to.equal(1)
      expect(a.bit(251, true)).to.equal(0)
      expect(a.bit(255, true)).to.equal(1)
    })
  })

  describe("compare", () => {
    it("should return -1 if all bits match", () => {
      const a = new Bytes32('0x00')
      const b = new Bytes32('0x00')
      expect(a.compare(b)).to.equal(-1)
    })

    it("should return 255 if last msb(be) doesn't match", () => {
      const a = new Bytes32('0x01')
      const b = new Bytes32('0x00')
      expect(a.compare(b)).to.equal(255)
    })

    it("should return number of matching lsb(be)", () => {
      const a = new Bytes32('0x0200')
      const b = new Bytes32('0x0000')
      expect(a.compare(b)).to.equal(246)
    })
  })

  describe("twiddle the bits", () => {
    it("should turn on a bit at index", () => {
      const a = new Bytes32('0x00')
      a.on(0).on(1)
      expect(a[0]).to.equal(0b11000000)

      const b = new Bytes32('0x00')
      b.on(255).on(255).on(0).on(0)
      expect(b[0]).to.equal(0b10000000)
      expect(b[31]).to.equal(1)
    })

    it("should turn off a bit at index", () => {
      const a = new Bytes32(Array(32).fill(255))
      a.off(0).off(1)
      expect(a[0]).to.equal(0b00111111)

      const b = new Bytes32(Array(32).fill(255))
      b.off(255).off(255).off(0).off(0)
      expect(b[0]).to.equal(0b01111111)
      expect(b[31]).to.equal(0b11111110)
    })

    it("should flip a bit at index", () => {
      const a = new Bytes32('0x00')
      a.flip(0).flip(1)
      expect(a[0]).to.equal(0b11000000)

      const b = new Bytes32('0x00')
      b.flip(255).flip(255).flip(0)
      expect(b[0]).to.equal(0b10000000)
      expect(b[31]).to.equal(0b00000000)
    })
  })

  describe("read the bits", () => {
    it("should return the lsb", () => {
      const a = new Bytes32('0x00')
      expect(a.lsb).to.equal(-1)
      expect(a.on(0).lsb).to.equal(0)
      expect(a.on(7).lsb).to.equal(7)
      expect(a.on(32).lsb).to.equal(32)
      expect(a.on(255).lsb).to.equal(255)
    })

    it("should return the msb", () => {
      const a = Bytes32.empty
      expect(a.msb).to.equal(-1)
      expect(a.on(255).msb).to.equal(255)
      expect(a.on(32).msb).to.equal(32)
      expect(a.on(7).msb).to.equal(7)
      expect(a.on(0).msb).to.equal(0)
    })

    it("should return the number of ones", () => {
      const a = new Bytes32('0x00')
      a.on(0).on(1)
      a.on(255).on(128)
      expect(a.ones).to.equal(4)
    })

    it("should return the number of zeros", () => {
      const a = new Bytes32('0x00')
      a.on(0).on(1)
      a.on(255).on(128)
      expect(a.zeros).to.equal(252)
    })
  })

  describe("be bitwise", () => {
    it("should do a bitwise not", () => {
      const a = new Bytes32('0xff')
      expect(a.not[0]).to.be.eql(0xff)
      expect(a.not[31]).to.be.eql(0x00)
    })

    it("should do a bitwise inplace and", () => {
      const a = new Bytes32('0xffff')
      a.iand(new Bytes32())
      expect(a.isZero).to.be.true
    })

    it("should do a bitwise and", () => {
      const a = new Bytes32('0xffff')
      const b = a.and(new Bytes32())

      expect(a.isZero).to.be.false
      expect(b.isZero).to.be.true
    })

    it("should do a bitwise inplace or", () => {
      const a = new Bytes32('0x00ff')
      a.ior(new Bytes32('0xff00'))
      expect(a.toString(true)).to.equal('0xffff')
    })

    it("should do a bitwise or", () => {
      const a = new Bytes32('0x00ff')
      const b = a.or(new Bytes32('0xff00'))

      expect(a.toString(true)).to.equal('0xff')
      expect(b.toString(true)).to.equal('0xffff')
    })

    it("should do a bitwise inplace xor", () => {
      const a = new Bytes32('0xf00f')
      a.ixor(new Bytes32('0xff00'))
      expect(a.toString(true)).to.equal('0x0f0f')
    })

    it("should do a bitwise xor", () => {
      const a = new Bytes32('0xf00f')
      const b = a.xor(new Bytes32('0xff00'))

      expect(a.toString(true)).to.equal('0xf00f')
      expect(b.toString(true)).to.equal('0x0f0f')
    })
  })
})
