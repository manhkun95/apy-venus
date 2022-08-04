const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const axios = require('axios');

const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545/');

const DelegatorABI = require('./abis/Delegator.json');
const vBTCBAddress = "0x74469281310195A04840Daf6EdF576F559a3dE80";
const delegator = new web3.eth.Contract(DelegatorABI, vBTCBAddress);
const bnbMantissa = 1e18;
const blocksPerDay = 20 * 60 * 24;
const daysPerYear = 365;

const UnitrollerABI = require('./abis/Unitroller.json');
const unitrollerAddr = "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D";
const unitroller = new web3.eth.Contract(UnitrollerABI, unitrollerAddr);

const vXVSAddress = '0x6d6F697e34145Bb95c54E77482d97cc261Dc237E';

async function test() {
    const supplyRatePerBlock = await delegator.methods.supplyRatePerBlock().call();
    const borrowRatePerBlock = await delegator.methods.borrowRatePerBlock().call();
    console.log('SUPPLY:', supplyRatePerBlock);
    console.log('BORROW:', borrowRatePerBlock);

    const supplyApy = ((((BigNumber(supplyRatePerBlock).div(bnbMantissa).times(blocksPerDay)).plus(1)).pow(daysPerYear)).minus(1)).times(100).toFixed(2)
    const borrowApy = ((((BigNumber(borrowRatePerBlock).div(bnbMantissa).times(blocksPerDay)).plus(1)).pow(daysPerYear)).minus(1)).times(100).toFixed(2)
    console.log(`Supply APY ${supplyApy} %`);
    console.log(`Borrow APY ${-borrowApy} %`);

    const vBTCBSpeed = await unitroller.methods.venusSpeeds(vBTCBAddress).call();
    console.log('Speed:', vBTCBSpeed);

    const exchangeRate = await delegator.methods.exchangeRateStored().call();
    const totalSupply = await delegator.methods.totalSupply().call();

    console.log('ExchangeRate:', exchangeRate)
    console.log('TotalSupply:', totalSupply)

    const totalUnderlyingSupply = BigNumber(totalSupply).times(exchangeRate).div(bnbMantissa).toFixed(0);

    const totalUnderlyingBorrow = await delegator.methods.totalBorrows().call();

    console.log('Total Underlying Supply:', totalUnderlyingSupply);
    console.log('Total Underlying Borrow:', totalUnderlyingBorrow);
    const xvsPrice = await getPrice(vXVSAddress)
    const vBTCPrice = await getPrice(vBTCBAddress)

    const compOverMarket = BigNumber(vBTCBSpeed).times(blocksPerDay).times(xvsPrice).div(vBTCPrice).div(totalUnderlyingSupply).toFixed();
    const compOverBorrowMarket = BigNumber(vBTCBSpeed).times(blocksPerDay).times(xvsPrice).div(vBTCPrice).div(totalUnderlyingBorrow).toFixed();
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

    return data.data.markets[0].tokenPrice
}

test();