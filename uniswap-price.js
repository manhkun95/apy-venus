const { ChainId, Token, WETH, Fetcher, Route } = require('@uniswap/sdk')

const COMP = new Token(ChainId.ROPSTEN, '0xf76D4a441E4ba86A923ce32B89AFF89dBccAA075', 18)
const USDC = new Token(ChainId.ROPSTEN, '0x07865c6E87B9F70255377e024ace6630C1Eaa37F', 6)
// const COMP = new Token(ChainId.ROPSTEN, '0xc00e94Cb662C3520282E6f5717214004A7f26888', 18)
// const USDC = new Token(ChainId.ROPSTEN, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6)

async function test() {
    // note that you may want/need to handle this async code differently,
    // for example if top-level await is not an option
    const COMPUSDCPair = await Fetcher.fetchPairData(WETH[ChainId.ROPSTEN], COMP)
    const USDCWETHPair = await Fetcher.fetchPairData(USDC, WETH[ChainId.ROPSTEN])

    const route = new Route([COMPUSDCPair, USDCWETHPair], COMP)

    console.log(route.midPrice.toSignificant(6))
    console.log(route.midPrice.invert().toSignificant(6))
}

test()