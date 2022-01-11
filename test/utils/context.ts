import { create, IPFS } from 'ipfs-core'
import { createTempRepo } from '.'
import { hasher } from '../../src'

export async function createContext(config: any = {}) {
  let repo: any

  if (config.repo) {
    if (typeof config.repo === 'string') {
      repo = await createTempRepo({ path: config.repo })
    } else {
      repo = config.repo
    }
  } else {
    repo = await createTempRepo()
  }

  const ipfs: IPFS = await create({
    silent: true,
    offline: true,
    repo,
    config: {
      Addresses: {
        Swarm: []
      },
      Bootstrap: []
    },
    preload: {
      enabled: false
    },
    ipld: {
      hashers: [ hasher ]
    },
    ...config
  })

  return {
    ipfs,
    repo,
    cleanup: async () => { await ipfs.stop() }
  }
}
