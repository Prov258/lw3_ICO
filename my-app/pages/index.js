import Head from "next/head"
import styles from "../styles/Home.module.css"
import Web3Modal from "web3modal"
import { providers, BigNumber, Contract, utils } from "ethers"
import { useEffect, useState, useRef } from "react"
import {
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    NFT_CONTRACT_ADDRESS,
    NFT_CONTRACT_ABI,
} from "../constants"

export default function Home() {
    const zero = BigNumber.from(0)

    const [walletConnected, setWalletConnected] = useState(false)
    const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
        useState(zero)
    const [tokensMinted, setTokensMinted] = useState(zero)
    const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero)
    const [loading, setLoading] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [tokenAmount, setTokenAmount] = useState(zero)

    const web3ModalRef = useRef()

    const getProviderOrSigner = async (needSigner = false) => {
        const provider = await web3ModalRef.current.connect()
        const web3Provider = new providers.Web3Provider(provider)

        const { chainId } = await web3Provider.getNetwork()
        if (chainId !== 5) {
            window.alert("Change the network to Goerli!")
            throw new Error("Change the network to Goerli!")
        }

        if (needSigner) {
            const signer = web3Provider.getSigner()
            return signer
        }

        return web3Provider
    }

    const getBalanceOfCryptoDevTokens = async () => {
        try {
            const provider = await getProviderOrSigner()

            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            )

            const signer = await getProviderOrSigner(true)
            const signerAddress = await signer.getAddress()
            const balance = await tokenContract.balanceOf(signerAddress)
            setBalanceOfCryptoDevTokens(balance)
        } catch (err) {
            console.error(err.message)
            setBalanceOfCryptoDevTokens(zero)
        }
    }

    const getTokensMinted = async () => {
        try {
            const provider = await getProviderOrSigner()

            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            )

            setTokensMinted(await tokenContract.totalSupply())
        } catch (err) {
            console.error(err.message)
        }
    }

    const getTokensToBeClaimed = async () => {
        try {
            const provider = await getProviderOrSigner()

            const nftContract = new Contract(
                NFT_CONTRACT_ADDRESS,
                NFT_CONTRACT_ABI,
                provider
            )

            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            )

            const signer = await getProviderOrSigner(true)
            const signerAddress = await signer.getAddress()

            const balance = await nftContract.balanceOf(signerAddress)

            if (balance === zero) {
                setTokensToBeClaimed(zero)
            } else {
                let amount = 0

                for (let i = 0; i < balance; i++) {
                    const tokenId = await nftContract.tokenOfOwnerByIndex(
                        signerAddress,
                        i
                    )
                    const claimed = await tokenContract.tokenIdsClaimed(tokenId)
                    if (!claimed) {
                        amount++
                    }
                }

                setTokensToBeClaimed(BigNumber.from(amount))
            }
        } catch (err) {
            console.error(err.message)
        }
    }

    const claimTokens = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                signer
            )
            const tx = await tokenContract.claim()
            setLoading(true)
            await tx.wait()
            setLoading(false)
            window.alert("You successfully claimed a Crypto Dev Tokens!")
            getBalanceOfCryptoDevTokens()
            getTokensMinted()
        } catch (err) {
            console.error(err.message)
        }
    }

    const mintTokens = async (amount) => {
        try {
            const signer = await getProviderOrSigner(true)
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                signer
            )
            const value = 0.001 * amount
            const tx = await tokenContract.mint(amount, {
                value: utils.parseEther(value.toString()),
            })
            setLoading(true)
            await tx.wait()
            setLoading(false)
            window.alert("Sucessfully minted Crypto Dev Tokens")
            getBalanceOfCryptoDevTokens()
            getTokensMinted()
        } catch (err) {
            console.error(err.message)
        }
    }

    const withdrawCoins = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                signer
            )

            const tx = await tokenContract.withdraw()
            setLoading(true)
            await tx.wait()
            setLoading(false)
        } catch (err) {
            console.error(err.message)
        }
    }

    const getOwner = async () => {
        try {
            const provider = await getProviderOrSigner()
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            )
            const signer = await getProviderOrSigner(true)
            const signerAddress = await signer.getAddress()
            const contractOwner = await tokenContract.owner()

            setIsOwner(
                signerAddress.toLowerCase() === contractOwner.toLowerCase()
            )
        } catch (err) {
            console.error(err.message)
        }
    }

    const connectWallet = async () => {
        try {
            await getProviderOrSigner()
            setWalletConnected(true)
        } catch (err) {
            console.error(err.message)
        }
    }

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "goerli",
                providerOptions: {},
                disableInjectedProvider: false,
            })
            connectWallet()
            getBalanceOfCryptoDevTokens()
            getTokensMinted()
            getTokensToBeClaimed()
            getOwner()
        }
    }, [walletConnected])

    const renderButton = () => {
        if (loading) {
            return (
                <div>
                    <button className={styles.button}>Loading...</button>
                </div>
            )
        }
        if (tokensToBeClaimed > 0) {
            return (
                <div>
                    <div className={styles.description}>
                        {tokensToBeClaimed * 10} Tokens can be claimed!
                    </div>
                    <button className={styles.button} onClick={claimTokens}>
                        Claim Tokens
                    </button>
                </div>
            )
        }
        return (
            <div style={{ display: "flex-col" }}>
                <div>
                    <input
                        type="number"
                        placeholder="Amount of Tokens"
                        onChange={(e) =>
                            setTokenAmount(BigNumber.from(e.target.value))
                        }
                        className={styles.input}
                    />
                </div>

                <button
                    className={styles.button}
                    disabled={!(tokenAmount > 0)}
                    onClick={() => mintTokens(tokenAmount)}
                >
                    Mint Tokens
                </button>
            </div>
        )
    }

    return (
        <div>
            <Head>
                <title>Crypto Devs</title>
                <meta name="description" content="ICO-Dapp" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>
                        Welcome to Crypto Devs ICO!
                    </h1>
                    <div className={styles.description}>
                        You can claim or mint Crypto Dev tokens here
                    </div>
                    {walletConnected ? (
                        <div>
                            <div className={styles.description}>
                                You have minted{" "}
                                {utils.formatEther(balanceOfCryptoDevTokens)}{" "}
                                Crypto Dev Tokens
                            </div>
                            <div className={styles.description}>
                                Overall {utils.formatEther(tokensMinted)}/10000
                                have been minted!!!
                            </div>
                            {renderButton()}
                            {isOwner ? (
                                <div>
                                    {loading ? (
                                        <button className={styles.button}>
                                            Loading...
                                        </button>
                                    ) : (
                                        <button
                                            className={styles.button}
                                            onClick={withdrawCoins}
                                        >
                                            Withdraw Coins
                                        </button>
                                    )}
                                </div>
                            ) : (
                                ""
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={connectWallet}
                            className={styles.button}
                        >
                            Connect your wallet
                        </button>
                    )}
                </div>
                <div>
                    <img
                        className={styles.image}
                        src="./0.svg"
                        alt="Crypto Dev NFT"
                    />
                </div>
            </div>

            <footer className={styles.footer}>
                Made with &#10084; by Crypto Devs
            </footer>
        </div>
    )
}
