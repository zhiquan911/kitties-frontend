import React, { useEffect, useState } from 'react'
import { Form, Grid } from 'semantic-ui-react'

import { useSubstrate } from './substrate-lib'
import { TxButton } from './substrate-lib/components'

import KittyCards from './KittyCards'

const convertToKittyIndex = entry =>
  entry[0].args.map((k) => k.toHuman())

const constructKitty = (id, { dna, price, gender, owner, deposit }) => ({
  id: id,
  dna,
  price: price.toJSON(),
  gender: gender.toJSON(),
  owner: owner.toJSON(),
  deposit: deposit.toJSON()
})

export default function Kitties (props) {
  const { api, keyring } = useSubstrate()
  const { accountPair } = props

  const [kittyIndexs, setKittyIndexs] = useState([])
  const [kitties, setKitties] = useState([])
  const [status, setStatus] = useState('')

  const fetchKitties = () => {
    // 在这里调用 `api.query.kittiesModule.*` 函数去取得猫咪的信息。
    // 你需要取得：
    //   - 共有多少只猫咪
    //   - 每只猫咪的主人是谁
    //   - 每只猫咪的 DNA 是什么，用来组合出它的形态
    let unsub = null

    const asyncFetch = async () => {
      unsub = await api.query.kitties.kittyCnt(async cnt => {
        // Fetch all kitty keys
        const entries = await api.query.kitties.kitties.entries()
        const indexs = entries.map(convertToKittyIndex)
        setKittyIndexs(indexs)
      })
    }

    asyncFetch()

    return () => {
      unsub && unsub()
    }
  }

  const populateKitties = () => {
    //  在这里添加额外的逻辑。你需要组成这样的数组结构：
    //  ```javascript
    //  const kitties = [{
    //    id: 0,
    //    dna: ...,
    //    owner: ...
    //  }, { id: ..., dna: ..., owner: ... }]
    //  ```
    // 这个 kitties 会传入 <KittyCards/> 然后对每只猫咪进行处理
    let unsub = null

    const asyncFetch = async () => {
      unsub = await api.query.kitties.kitties.multi(kittyIndexs, kitties => {
        const kittyArr = kitties
          .map((kitty, ind) => constructKitty(kittyIndexs[ind], kitty.value))
        setKitties(kittyArr)
      })
    }

    asyncFetch()

    // return the unsubscription cleanup function
    return () => {
      unsub && unsub()
    }
  }

  useEffect(populateKitties, [api, kittyIndexs])
  useEffect(fetchKitties, [api, keyring])

  return <Grid.Column width={16}>
    <h1>小毛孩</h1>
    <KittyCards kitties={kitties} accountPair={accountPair} setStatus={setStatus} />
    <Form style={{ margin: '1em 0' }}>
      <Form.Field style={{ textAlign: 'center' }}>
        <TxButton
          accountPair={accountPair} label='创建小毛孩' type='SIGNED-TX' setStatus={setStatus}
          attrs={{
            palletRpc: 'kitties',
            callable: 'createKitty',
            inputParams: [],
            paramFields: []
          }}
        />
      </Form.Field>
    </Form>
    <div style={{ overflowWrap: 'break-word' }}>{status}</div>
  </Grid.Column>
}
