const hre = require('hardhat')
const { linkLibraries } = require('./linkLibraries')
const { ContractFactory } = require('ethers')

const WETH9 = '0x4200000000000000000000000000000000000006'
const FACTORY = '' //UniswapV3Factory address

async function depolyNFTDescriptor() {
  // NFTDescriptor
  const contractFactory = await hre.ethers.getContractFactory('NFTDescriptor')
  const deployContract = await contractFactory.deploy()
  await deployContract.deployed()
  consoleLog('NFTDescriptor deployed to ========>', deployContract.address)

  try {
    await hre.run('verify:verify', {
      address: deployContract.address,
      constructorArguments: [],
    })
  } catch (err) {
    throw err
  }
  return deployContract.address
}

async function depolyNonfungibleTokenPositionDescriptor(NFTDescriptor) {
  // NonfungibleTokenPositionDescriptor
  const [owner] = await hre.ethers.getSigners()

  const artifactsNonfungibleTokenPositionDescriptor = require('../artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json')
  const linkedBytecode = linkLibraries(
    {
      bytecode: artifactsNonfungibleTokenPositionDescriptor.bytecode,
      linkReferences: {
        'NFTDescriptor.sol': {
          NFTDescriptor: [
            {
              length: 20,
              start: 1657,
            },
          ],
        },
      },
    },
    {
      NFTDescriptor: NFTDescriptor,
    }
  )

  const NonfungibleTokenPositionDescriptor = new ContractFactory(
    artifactsNonfungibleTokenPositionDescriptor.abi,
    linkedBytecode,
    owner
  )

  const params = [
    WETH9,
    asciiStringToBytes32('ETH'), // "0x4554480000000000000000000000000000000000000000000000000000000000"
  ]
  const deployContract = await NonfungibleTokenPositionDescriptor.deploy(...params)

  consoleLog('NonfungibleTokenPositionDescriptor deployed to ========>', deployContract.address)

  try {
    await hre.run('verify:verify', {
      address: deployContract.address,
      constructorArguments: params,
    })
  } catch (err) {
    throw err
  }

  return deployContract.address
}

async function depolyNonfungiblePositionManager(NonfungibleTokenPositionDescriptor) {
  //   NonfungiblePositionManager
  const contractFactory = await hre.ethers.getContractFactory('NonfungiblePositionManager')
  const params = [FACTORY, WETH9, NonfungibleTokenPositionDescriptor]
  const deployContract = await contractFactory.deploy(...params)

  await deployContract.deployed()

  consoleLog('NonfungiblePositionManager deployed to ========>', deployContract.address)

  try {
    await hre.run('verify:verify', {
      address: deployContract.address,
      constructorArguments: params,
    })
  } catch (err) {
    throw err
  }

  return deployContract.address
}

async function depolySwapRouter() {
  // SwapRouter
  const contractFactory = await hre.ethers.getContractFactory('SwapRouter')
  const params = [FACTORY, WETH9]
  const deployContract = await contractFactory.deploy(...params)

  await deployContract.deployed()

  consoleLog('SwapRouter deployed to ========>', deployContract.address)

  try {
    await hre.run('verify:verify', {
      address: deployContract.address,
      constructorArguments: params,
    })
  } catch (err) {
    throw err
  }
}

async function depolyQuoterV2() {
  // QuoterV2
  const contractFactory = await hre.ethers.getContractFactory('QuoterV2')
  const params = [FACTORY, WETH9]
  const deployContract = await contractFactory.deploy(...params)

  await deployContract.deployed()

  consoleLog('QuoterV2 deployed to ========>', deployContract.address)

  try {
    await hre.run('verify:verify', {
      address: deployContract.address,
      constructorArguments: params,
    })
  } catch (err) {
    throw err
  }
}

async function main() {
  const NFTDescriptor = await depolyNFTDescriptor()
  const NonfungibleTokenPositionDescriptor = await depolyNonfungibleTokenPositionDescriptor(NFTDescriptor)
  const NonfungiblePositionManager = await depolyNonfungiblePositionManager(NonfungibleTokenPositionDescriptor)
  const SwapRouter = await depolySwapRouter()
  const QuoterV2 = await depolyQuoterV2()
}

function consoleLog(str, log) {
  console.log('\033[31m' + str + log + '\033[0m')
}

function asciiStringToBytes32(str) {
  if (str.length > 32 || !isAscii(str)) {
    throw new Error('Invalid label, must be less than 32 characters')
  }

  return '0x' + Buffer.from(str, 'ascii').toString('hex').padEnd(64, '0')
}

function isAscii(str) {
  return /^[\x00-\x7F]*$/.test(str)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
