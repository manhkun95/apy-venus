const Web3 = require('web3');
const BigNumber = require('bignumber.js');

const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545/');

const DelegatorABI = require('./abis/Delegator.json');
const vBTCB = "0xb6e9322c49fd75a367fcb17b0fcd62c5070ebcbe";
const delegator = new web3.eth.Contract(DelegatorABI, vBTCB);
const bnbMantissa = 1e18;
const blocksPerDay = 20 * 60 * 24;
const daysPerYear = 365;

const UnitrollerABI = require('./abis/Unitroller.json');
const unitrollerAddr = "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D";
const unitroller = new web3.eth.Contract(UnitrollerABI, unitrollerAddr);

async function test() {
    const supplyRatePerBlock = await delegator.methods.supplyRatePerBlock().call();
    const borrowRatePerBlock = await delegator.methods.borrowRatePerBlock().call();
    console.log('SUPPLY:', supplyRatePerBlock);
    console.log('BORROW:', borrowRatePerBlock);

    const supplyApy = (((Math.pow((supplyRatePerBlock / bnbMantissa * blocksPerDay) + 1, daysPerYear))) - 1) * 100;
    const borrowApy = (((Math.pow((borrowRatePerBlock / bnbMantissa * blocksPerDay) + 1, daysPerYear))) - 1) * 100;
    console.log(`Supply APY ${supplyApy} %`);
    console.log(`Borrow APY ${-borrowApy} %`);

    const vBTCBSpeed = await unitroller.methods.venusSpeeds(vBTCB).call();
    console.log('Speed:', vBTCBSpeed);

    const exchangeRate = await delegator.methods.exchangeRateStored().call();
    const totalSupply = await delegator.methods.totalSupply().call();

    console.log('ExchangeRate:', exchangeRate)
    console.log('TotalSupply:', totalSupply)

    const totalUnderlying = BigNumber(totalSupply).times(exchangeRate).div(bnbMantissa).toFixed();

    // const totalUnderlying = await delegator.methods.totalBorrows().call();

    console.log('Total Underlying:', totalUnderlying);
    const xvsPrice = '1';

    const compOverMarket = BigNumber(vBTCBSpeed).times(blocksPerDay).times(xvsPrice).div(totalUnderlying).toFixed();
    
    console.log(compOverMarket)
    const distributeApy = (((Math.pow(BigNumber(compOverMarket).plus(1), daysPerYear))) - 1) * 100;

    console.log('Distribute APY:', distributeApy);
}

test();


// // Calculate distribute API
// const venusSpeed = '10850694444444400';

// const totalSupply = '777264159863845292';

// const exchangeRate = '217584224422667459319439525';

// const temp = BigNumber(totalSupply).times(exchangeRate).div(bnbMantissa).toFixed();

// console.log('Total Underlying Supply:', temp)

// // const totalUSDC = '169120419395510991185583577';
// const totalUSDC = '88639596071381014512278470';
// const xvsPrice = '5.43';

// const compOverMarket = BigNumber(1).times(venusSpeed).times(blockPerDay).times(xvsPrice).div(totalUSDC).toFixed();
// const distributeApi = (((Math.pow(BigNumber(compOverMarket).plus(1), daysPerYear))) - 1) * 100;

// console.log('Distribution APY:', distributeApi)