// import Transport from '@ledgerhq/hw-transport'
// import SpeculosTransport from '@ledgerhq/hw-transport-node-speculos-http'
// import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
// import Aptos from './src/Aptos'

// function hexStringToBytes (hex: string) {
//   const value: number[] = []
//   for (var i = 0; i < hex.length; i += 2) {
//     value.push(parseInt(hex.substring(i, i + 2), 16))
//   }

//   return Buffer.from(value)
// }

// async function exampleRaw (transport: Transport) {
//   console.log('getVersion(raw)', await transport.send(0x5b, 0x03, 0x00, 0x00))
// }

// async function exampleAptos (transport: Transport) {
//   const aptosClinet = new Aptos(transport)

//   console.log('getVersion', await aptosClinet.getVersion())
//   console.log('getAddress', await aptosClinet.getAddress("m/44'/637'/1'/0'/0'", true))

//   const rawTx = 'b5e97db07fa0bd0e5598aa3643a9bc6f6693bddc1a9fec9e674a461eaa00b193783135e8b00430253a22ba041d860c373d7a1501ccf7ac2d1ad37a8ed2775aee000000000000000002000000000000000000000000000000000000000000000000000000000000000104636f696e087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220094c6fc0d3b382a599c37e1aaa7618eff2c96a3586876082c4594c50c50d7dde082a00000000000000204e0000000000006400000000000000565c51630000000022'
//   const tx = hexStringToBytes(rawTx)
//   console.log('signTransaction', (await aptosClinet.signTransaction("m/44'/637'/1'/0'/0'", tx)))
// }

// const args = process.argv.slice(2)
// const main = async (): Promise<void> => {
//   const mode = args[0]
//   let transport: Transport
//   switch (mode) {
//     case 'hid':
//       transport = await TransportNodeHid.open(null)
//       break
//     case 'headless':
//       transport = await SpeculosTransport.open({ baseURL: 'http://localhost:5000' })
//       break
//     default:
//       console.error('Transport mode is not specified, available options: hid, headless')
//       return
//   }

//   try {
//     await exampleRaw(transport)
//     await exampleAptos(transport)
//   } catch (err) {
//     console.log(err)
//   } finally {
//     await transport.close()
//   }
// }

// main().catch(error => {
//   console.error(error)
//   process.exit(1)
// })
