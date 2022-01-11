import type {
  API as BlockAPI,
  RmResult, StatResult
} from 'ipfs-core-types/src/block'

import { NotFoundError } from './errors'

import { from } from 'multiformats/hashes/hasher'
import { CID } from 'multiformats'
import { code, decode } from '@ipld/dag-cbor'
import sha3 from 'js-sha3'

import { Bytes32 } from "./bytes32"

export const hasher = from({
  code: 0x1b,
  name: 'keccak-256',
  encode: (b: any): Uint8Array => {
    return new Uint8Array(sha3.keccak256.array(b))
  }
})

export class Blockstore implements BlockAPI {
  private _map: Map<string, Uint8Array>

  constructor() { this._map = new Map() }

  async get(cid: CID, _?: unknown): Promise<Uint8Array> {
    const block = this._map.get(cid.toString())
    if (!block) { throw new NotFoundError() }
    return block
  }

  async put(block: Uint8Array, _?: unknown): Promise<CID> {
    const cid = CID.create(1, code, await hasher.digest(block))
    this._map.set(cid.toString(), block)
    return cid
  }

  async * rm(cids: CID | CID[], _?: unknown): AsyncIterable<RmResult> {
    if (!Array.isArray(cids)) { cids = [cids] }
    for (const cid of cids) {
      this._map.delete(cid.toString())
      yield({ cid })
    }
  }

  async stat(cid: CID, _?: unknown): Promise<StatResult> {
    const block = await this.get(cid)
    return { cid, size: block.length }
  }

  static from(): Blockstore { return new Blockstore() }
}

