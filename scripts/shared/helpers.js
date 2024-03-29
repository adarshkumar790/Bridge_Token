const fs = require('fs')
const path = require('path')
const parse = require('csv-parse')

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

const ARBITRUM = 42161
const AVALANCHE = 43114
const GOERLI = 5
const OPTIMISM = 10
const ARBITRUM_SEPOLIA = 421614
const MUMBAI =  80001


const {
  arbitrumSepolia_DEPLOY_KEY,
  arbitrumSepolia_URL,
  mumbai_DEPLOY_KEY,
  mumbai_URL,
  // ARBITRUM_URL,
  // AVAX_URL,
  // ARBITRUM_DEPLOY_KEY,
  // AVAX_DEPLOY_KEY,
  // GOERLI_URL,
  // GOERLI_DEPLOY_KEY,
  OPTIMISM_URL,
  OPTIMISM_DEPLOY_KEY
} = require("../../env.json");
const { ethers } = require('hardhat');

const providers = {
  // arbitrum: new ethers.providers.JsonRpcProvider(ARBITRUM_URL),
  // avax: new ethers.providers.JsonRpcProvider(AVAX_URL),
  // goerli: new ethers.providers.JsonRpcProvider(GOERLI_URL)
  // optimism: new ethers.providers.JsonRpcProvider(OPTIMISM_URL),
  arbitrumSepolia: new ethers.providers.JsonRpcProvider(arbitrumSepolia_URL),
  mumbai: new ethers.providers.JsonRpcProvider(mumbai_URL)
}

const signers = {
  // arbitrum: new ethers.Wallet(ARBITRUM_DEPLOY_KEY).connect(providers.arbitrum),
  // avax: new ethers.Wallet(ARBITRUM_DEPLOY_KEY).connect(providers.avax),
  // goerli: new ethers.Wallet(GOERLI_DEPLOY_KEY).connect(providers.goerli),
  // optimism: new ethers.Wallet(OPTIMISM_DEPLOY_KEY).connect(providers.goerli)
  arbitrumSepolia: new ethers.Wallet(arbitrumSepolia_DEPLOY_KEY).connect(providers.arbitrumSepolia),
  mumbai: new ethers.Wallet(mumbai_DEPLOY_KEY).connect(providers.mumbai)

}

const readCsv = async (file) => {
  records = []
  const parser = fs
  .createReadStream(file)
  .pipe(parse({ columns: true, delimiter: ',' }))
  parser.on('error', function(err){
    console.error(err.message)
  })
  for await (const record of parser) {
    records.push(record)
  }
  return records
}

function getChainId(network) {
  if (network === "arbitrum") {
    return 42161
  }

  if (network === "avax") {
    return 43114
  }

  if (network === "goerli") {
    return 5
  }

  if (network === "optimism") {
    return 10
  }

  if (network === "mumbai") {
    return 80001
  }

  if (network === "arbitrumSepolia") {
    return 421614
  }

  throw new Error("Unsupported network")
}

async function getFrameSigner() {
  try {
    const frame = new ethers.providers.JsonRpcProvider("http://127.0.0.1:1248")
    const signer = frame.getSigner()
    if (getChainId(network) !== await signer.getChainId()) {
      throw new Error("Incorrect frame network")
    }
    return signer
  } catch (e) {
    throw new Error(`getFrameSigner error: ${e.toString()}`)
  }
}

async function sendTxn(txnPromise, label) {
  const txn = await txnPromise
  console.info(`Sending ${label}...`)
  await txn.wait()
  console.info(`... Sent! ${txn.hash}`)
  return txn
}

async function callWithRetries(func, args, retriesCount = 3) {
  let i = 0
  while (true) {
    i++
    try {
      return await func(...args)
    } catch (ex) {
      if (i === retriesCount) {
        console.error("call failed %s times. throwing error", retriesCount)
        throw ex
      }
      console.error("call i=%s failed. retrying....", i)
      console.error(ex.message)
    }
  }
}

async function deployContract(name, args, label, options) {
  let info = name
  if (label) { info = name + ":" + label }
  const contractFactory = await ethers.getContractFactory(name)
  let contract
  if (options) {
    contract = await contractFactory.deploy(...args, options)
  } else {
    contract = await contractFactory.deploy(...args)
  }
  const argStr = args.map((i) => `"${i}"`).join(" ")
  console.info(`Deploying ${info} ${contract.address} ${argStr}`)
  await contract.deployTransaction.wait()
  console.info("... Completed!")
  return contract
}

async function contractAt(name, address, provider) {
  let contractFactory = await ethers.getContractFactory(name)
  if (provider) {
    contractFactory = contractFactory.connect(provider)
  }
  return await contractFactory.attach(address)
}

const tmpAddressesFilepath = path.join(__dirname, '..', '..', `.tmp-addresses-${process.env.HARDHAT_NETWORK}.json`)

function readTmpAddresses() {
  if (fs.existsSync(tmpAddressesFilepath)) {
    return JSON.parse(fs.readFileSync(tmpAddressesFilepath))
  }
  return {}
}

function writeTmpAddresses(json) {
  const tmpAddresses = Object.assign(readTmpAddresses(), json)
  fs.writeFileSync(tmpAddressesFilepath, JSON.stringify(tmpAddresses))
}

// batchLists is an array of lists
async function processBatch(batchLists, batchSize, handler) {
  let currentBatch = []
  const referenceList = batchLists[0]

  for (let i = 0; i < referenceList.length; i++) {
    const item = []

    for (let j = 0; j < batchLists.length; j++) {
      const list = batchLists[j]
      item.push(list[i])
    }

    currentBatch.push(item)

    if (currentBatch.length === batchSize) {
      console.log("handling currentBatch", i, currentBatch.length, referenceList.length)
      await handler(currentBatch)
      currentBatch = []
    }
  }

  if (currentBatch.length > 0) {
    console.log("handling final batch", currentBatch.length, referenceList.length)
    await handler(currentBatch)
  }
}

module.exports = {
  ARBITRUM,
  AVALANCHE,
  GOERLI,
  OPTIMISM,
  MUMBAI,
  ARBITRUM_SEPOLIA,
  providers,
  signers,
  readCsv,
  getFrameSigner,
  sendTxn,
  deployContract,
  contractAt,
  writeTmpAddresses,
  readTmpAddresses,
  callWithRetries,
  processBatch
}
