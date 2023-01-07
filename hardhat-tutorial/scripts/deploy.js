const { ethers } = require("hardhat")
const { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS } = require("../constants/index")

async function main() {
    const cryptoDevsTokenContract = await ethers.getContractFactory(
        "CryptoDevToken"
    )
    const deployedCryptoDevsTokenContract =
        await cryptoDevsTokenContract.deploy(CRYPTO_DEVS_NFT_CONTRACT_ADDRESS)
    await deployedCryptoDevsTokenContract.deployed()

    console.log("Contract address:", deployedCryptoDevsTokenContract.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
