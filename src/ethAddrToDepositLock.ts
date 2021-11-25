import { HashType, SnakeScript } from '@lay2/pw-core'
import { Reader as CKBReader } from 'ckb-js-toolkit'
import { core as godwokenCore, normalizer as godwokenNormalizer } from 'godwoken'
import { CkitProvider } from '@ckitjs/ckit'
import { RcIdentityFlag, RcIdentityLockArgs } from '@ckitjs/rc-lock'
import { bytes } from '@ckitjs/utils'
import { Pw } from "@ckitjs/ckit/dist/helpers/pw"

import { gwPolyjuiceETHAccountLockCodeHash, gwRollupTypeHash, gwDepositLockCodeHash } from './constant'

interface DepositLockArgs {
  owner_lock_hash: string
  layer2_lock: SnakeScript
  cancel_timeout: string
}

export function ethAddrToDepositLock(ethAddr: string, ckitProvider: CkitProvider): SnakeScript {
  const rcLockScript= getRCLockScript(ethAddr, ckitProvider)
  const ownerLockHash = Pw.toPwScript(rcLockScript).toHash()

  const ethAccountLock = generateETHAccountLockScript(ethAddr)

  const depositLockArgs = getDepositLockArgs(ownerLockHash, ethAccountLock)
  const serializedArgs = serializeArgs(depositLockArgs)
  return generateDepositLockScript(serializedArgs)
}

function getRCLockScript(ethAddr: string, ckitProvider: CkitProvider) {
  const rcOwnerLockArgs = bytes.toHex(
    RcIdentityLockArgs.encode({
      rc_identity_flag: RcIdentityFlag.ETH,
      rc_identity_pubkey_hash: ethAddr,
      rc_lock_flag: 0,
    }),
  )

  return ckitProvider.newScript('RC_LOCK', rcOwnerLockArgs)
}

function generateETHAccountLockScript(ethAddr: string): SnakeScript {
  return {
    code_hash: gwPolyjuiceETHAccountLockCodeHash,
    hash_type: HashType.type,
    args: `${gwRollupTypeHash}${ethAddr.toLowerCase().slice(2)}`,
  }
}

function getDepositLockArgs(
  ownerLockHash: string,
  layer2_lock: SnakeScript,
  cancelTimeout = '0xc00000000002a300'
): DepositLockArgs {
  const depositLockArgs: DepositLockArgs = {
    owner_lock_hash: ownerLockHash,
    layer2_lock,
    cancel_timeout: cancelTimeout, // relative timestamp, 2 days
  }
  return depositLockArgs
}

function serializeArgs(args: DepositLockArgs): string {
  const serializedDepositLockArgs: ArrayBuffer = godwokenCore.SerializeDepositLockArgs(
    godwokenNormalizer.NormalizeDepositLockArgs(args)
  )

  const depositLockArgsStr = new CKBReader(serializedDepositLockArgs).serializeJson()

  return `${gwRollupTypeHash}${depositLockArgsStr.slice(2)}`
}

function generateDepositLockScript(args: string): SnakeScript {
  return {
    code_hash: gwDepositLockCodeHash,
    hash_type: HashType.type,
    args,
  }
}
