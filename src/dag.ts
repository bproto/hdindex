import type { API as BlockAPI } from 'ipfs-core-types/src/block'

import { encode, decode } from '@ipld/dag-cbor'
import { CID } from 'multiformats'
import LRUCache from 'lru-cache'

import { Blockstore } from './blockstore'

export class DAG {
  private _blocks: BlockAPI
  private _cache: LRUCache<string, Uint8Array> | undefined

  constructor(blockstore: BlockAPI, cache: number = 0) {
    this._blocks = blockstore
    this._cache = new LRUCache(cache)
  }

  get blocks(): BlockAPI { return this._blocks }
  get cache(): LRUCache<string, Uint8Array> | undefined { return this._cache }

  cached(cid: CID, block?: Uint8Array): Uint8Array | undefined {
    if (!this.cache) { return block }
    if (!block) { block = this.cache.get(cid.toString()) }
    else { this.cache.set(cid.toString(), block) }
    return block
  }

  async set(value: any, asBlock: boolean = false): Promise<CID> {
    if (!asBlock) { value = encode(value) }
    const cid = await this.blocks.put(value, {
      format: 'dag-cbor', mhtype: 'keccak-256', version: 1
    })
    this.cached(cid, value)
    return cid
  }

  async get(cid: CID, asBlock: boolean = false): Promise<any> {
    const block = this.cached(cid) ?? await this._blocks.get(cid)
    return asBlock ? block : decode(block)
  }

  static from(dag: DAGLike = Blockstore.from()): DAG {
    if (dag instanceof DAG) { return dag }
    dag = (dag as IPFSLike)?.block ?? dag
    return new DAG(dag)
  }
}

export interface IPFSLike { block: BlockAPI }
export type DAGLike = DAG | IPFSLike | BlockAPI
