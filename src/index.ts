import { CkitProvider } from '@ckitjs/ckit'

import { ckbIndexerURL, ckbRPCURL } from './constant'
import { ethAddrToDepositLock } from "./ethAddrToDepositLock"
import { linaCkitConfig } from './predefined'

const ckitProvider = new CkitProvider(ckbIndexerURL, ckbRPCURL)

async function main() {
  await ckitProvider.init(linaCkitConfig)
  console.log(ckitProvider.parseToAddress(ethAddrToDepositLock(process.argv[2], ckitProvider)))
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.log("err", err)
    process.exit(1)
  })
