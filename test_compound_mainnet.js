const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const axios = require('axios');

const web3 = new Web3('https://mainnet.infura.io/v3/');

const DelegatorABI = require('./abis/Delegator.json');
const vBTCBAddress = "0x39AA39c021dfbaE8faC545936693aC917d5E7563";
const delegator = new web3.eth.Contract(DelegatorABI, vBTCBAddress);
const bnbMantissa = 1e18;
const blocksPerDay = 6570;
const daysPerYear = 365;

const UnitrollerABI = require('./abis/CompUnitroller.json');
const unitrollerAddr = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
const unitroller = new web3.eth.Contract(UnitrollerABI, unitrollerAddr);
const usdcMantissal = 1e6
const compMantissal = 1e18

const vXVSAddress = '0xc00e94Cb662C3520282E6f5717214004A7f26888';

async function test() {
    const supplyRatePerBlock = await delegator.methods.supplyRatePerBlock().call();
    const borrowRatePerBlock = await delegator.methods.borrowRatePerBlock().call();
    console.log('SUPPLY:', supplyRatePerBlock);
    console.log('BORROW:', borrowRatePerBlock);

    const supplyApy = ((((BigNumber(supplyRatePerBlock).div(bnbMantissa).times(blocksPerDay)).plus(1)).pow(daysPerYear)).minus(1)).times(100).toFixed(2)
    const borrowApy = ((((BigNumber(borrowRatePerBlock).div(bnbMantissa).times(blocksPerDay)).plus(1)).pow(daysPerYear)).minus(1)).times(100).toFixed(2)
    console.log(`Supply APY ${supplyApy} %`);
    console.log(`Borrow APY ${-borrowApy} %`);

    const vBTCBSpeed = await unitroller.methods.compSupplySpeeds(vBTCBAddress).call();
    const vBorrowSpeed = await unitroller.methods.compBorrowSpeeds(vBTCBAddress).call();
    console.log('Speed:', vBTCBSpeed);
    console.log('Borrow Speed:', vBorrowSpeed);

    const exchangeRate = await delegator.methods.exchangeRateStored().call();
    const totalSupply = await delegator.methods.totalSupply().call();

    console.log('ExchangeRate:', exchangeRate);
    console.log('TotalSupply:', totalSupply);

    const totalUnderlyingSupply = BigNumber(totalSupply).times(exchangeRate).div(bnbMantissa).toFixed(0);

    const totalUnderlyingBorrow = await delegator.methods.totalBorrows().call();

    console.log('Total Underlying Supply:', totalUnderlyingSupply);
    console.log('Total Underlying Borrow:', totalUnderlyingBorrow);
    // const xvsPrice = await getPrice(vXVSAddress)
    // const vBTCPrice = await getPrice(vBTCBAddress)
    const xvsPrice = 49.63
    const vBTCPrice = 1

    const compOverMarket = BigNumber(vBTCBSpeed).times(blocksPerDay).times(xvsPrice).div(vBTCPrice).div(totalUnderlyingSupply).times(usdcMantissal).div(compMantissal).toFixed();
    const compOverBorrowMarket = BigNumber(vBorrowSpeed).times(blocksPerDay).times(xvsPrice).div(vBTCPrice).div(totalUnderlyingBorrow).times(usdcMantissal).div(compMantissal).toFixed();
    const distributeSupplyApy = ((BigNumber(compOverMarket).plus(1).pow(daysPerYear)).minus(1)).times(100).toFixed(2);
    const distributeBorrowApy = ((BigNumber(compOverBorrowMarket).plus(1).pow(daysPerYear)).minus(1)).times(100).toFixed(2);

    console.log('Distribute Supply APY:', distributeSupplyApy, "%");
    console.log('Distribute Borrow APY:', distributeBorrowApy, "%");

    console.log('Total supply APY:', BigNumber(supplyApy).plus(distributeSupplyApy).toFixed(2), "%")
    console.log('Total borrow APY:', BigNumber(distributeBorrowApy).minus(borrowApy).toFixed(2), "%")
}

async function getPrice(tokenAddress) {
    const url = 'https://testnetapi.venus.io/api/vtoken?addresses=' + tokenAddress;

    const { data } = await axios.get(url);

    return data.data.markets[0].tokenPrice;
}

test();
