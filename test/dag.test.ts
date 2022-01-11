import { expect } from "chai"
import { DAG } from "../src/dag"

describe("DAG", function() {
  beforeEach(function() {
    this.dag = DAG.from()
  })

  it("should set and get a value by CID", async function() {
    const { dag } = this
    const cid = await dag.set('hello world')
    expect(await dag.get(cid)).to.equal('hello world')
  })
})
