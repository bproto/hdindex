import { MemoryDatastore } from 'datastore-core/memory'
import { BlockstoreDatastoreAdapter } from 'blockstore-datastore-adapter'
import { Backends } from 'ipfs-repo'

export function createBackend (overrides = {}): Backends {
  return {
    datastore: new MemoryDatastore(),
    blocks: new BlockstoreDatastoreAdapter(
      new MemoryDatastore()
    ),
    pins: new MemoryDatastore(),
    keys: new MemoryDatastore(),
    root: new MemoryDatastore(),
    ...overrides
  } as unknown as Backends
}
