// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
// require('@nomiclabs/hardhat-web3');

const types = {
    payment: [
        { name: 'paymentAmt', type: 'uint256' },
        { name: 'paymentAddress', type: 'address' }
    ],
    order: [
        { name: 'collection', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'signer', type: 'address' },
        { name: 'orderType', type: 'uint256' },
        { name: 'totalAmt', type: 'uint256' },
        { name: 'exchange', type: 'payment' },
        { name: 'prePayment', type: 'payment' },
        { name: 'isERC721', type: 'bool' },
        { name: 'tokenAmt', type: 'uint256' },
        { name: 'refererrAmt', type: 'uint256' },
        { name: 'root', type: 'bytes32' },
        { name: 'reservedAddress', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
};

// fill bid function that takes, maker , taker , and amounts of all payments

// const contract = await MerkleProof.new();
const null_address = '0x0000000000000000000000000000000000000000';

async function main() {
    // console.log(hre.web3);
    // hre.web3.eth.abi.encodeParameter('uint256', '2345675643');
    // const leaves = [2, 3, 4, 5].map(v => keccak256(v));
    const leaves = [2, 3, 4, 5].map(v => keccak256(hre.web3.eth.abi.encodeParameter('uint256', v)));
    const tree = new MerkleTree(leaves, keccak256, { sort: true });
    const root = tree.getHexRoot();
    const leaf = keccak256(hre.web3.eth.abi.encodeParameter('uint256', 2));
    const leaf2 = keccak256(hre.web3.eth.abi.encodeParameter('uint256', 3));

    const proof = tree.getHexProof(leaf);
    const proof2 = tree.getHexProof(leaf2);
    console.log(proof, root);
    console.log(tree.verify(proof, leaf, root));

    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

    // deployment script
    const rewardDistributor = await hre.ethers.getContractFactory('RewardDistributor');
    const Funnel = await hre.ethers.getContractFactory('Funnel');
    const funnel = await Funnel.deploy();

    const Trader = await hre.ethers.getContractFactory('Molotrader');
    const trader = await Trader.deploy();

    await trader.deployed();
    const Ve = await hre.ethers.getContractFactory('ve');
    const ve = await Ve.deploy(funnel.address);

    console.log('addr', trader.address, funnel.address);
    const rewarddistributor = await rewardDistributor.deploy(1644742800, trader.address, funnel.address, ve.address);

    console.log(rewarddistributor.address, await rewarddistributor.epoch(), await rewarddistributor.trader());
    trader.setDistributor(rewarddistributor.address);
    funnel.setMinter(rewarddistributor.address);
    // deployment end

    const wethContract = await hre.ethers.getVerifiedContractAt('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

    // let wethContract = await hre.ethers.getContractAt('WETH9', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

    current = await wethContract.connect(addr2).deposit({ value: hre.ethers.utils.parseEther('200') });
    await current.wait();
    current = await wethContract.connect(addr2).approve(trader.address, hre.ethers.utils.parseEther('200'));
    await current.wait();

    await hre.ethers.provider.send('evm_setNextBlockTimestamp', [1644742805]);
    await hre.ethers.provider.send('evm_mine');
    // hre.ethers.provider.send("evm_mine"); // mine the next block
    const GameItem = await hre.ethers.getContractFactory('GameItem');
    var gameitem = await GameItem.deploy();

    var current = await gameitem.connect(addr1).setApprovalForAll(trader.address, true);
    await current.wait();

    var current = await gameitem.connect(addr2).setApprovalForAll(trader.address, true);
    await current.wait();

    var receipt = await (await gameitem.awardItem(addr1.address)).wait(); // 1
    var receipt = await (await gameitem.awardItem(addr1.address)).wait();
    var receipt = await (await gameitem.awardItem(addr1.address)).wait();
    var receipt = await (await gameitem.awardItem(addr1.address)).wait(); //4

    const domain = {
        name: 'GOLOM.IO',
        version: '1',
        chainId: 1,
        verifyingContract: trader.address
    };
    console.log(owner.address, addr1.address);

    var totoamt = 10000000;
    var deadline = Date.now() + 100000;
    const order = {
        collection: gameitem.address,
        tokenId: 0,
        signer: addr2.address,
        orderType: 2,
        totalAmt: totoamt,
        exchange: { paymentAmt: 100, paymentAddress: owner.address },
        prePayment: { paymentAmt: 100, paymentAddress: addr3.address },
        isERC721: true,
        tokenAmt: 2,
        refererrAmt: 10,
        root: root,
        reservedAddress: owner.address,
        nonce: 1,
        deadline: deadline
    };
    console.log(order);

    var signature2 = await addr2._signTypedData(domain, types, order);
    //   console.log("21",signature2)
    console.log('sig', signature2);
    var signature = signature2.substring(2);
    order.r = '0x' + signature.substring(0, 64);
    order.s = '0x' + signature.substring(64, 128);
    order.v = parseInt(signature.substring(128, 130), 16);

    // //   console.log(order)

    console.log(order);

    var postPay = 0;
    const recoveredAddress = hre.ethers.utils.verifyTypedData(domain, types, order, signature2);
    console.log(recoveredAddress);
    // var signedMatch = ["0x30917a657ae7d1132bdca40187d781fa3b60002f",2608,"0x55ca81f5f00dee4a072f793d67296abd6b56ba0b",100000000000,[1000000,"0xcd105202276e97b531065a087cecf8f0b76ab737"],[1000000,"0xcd105202276e97b531065a087cecf8f0b76ab737"],true,1000000,20,1655555,27,"0xd3dc3475099d1f59fa88de9d0d547a6b26a5e38fb210f0bdded377e089d3eb5c","0xd3dc3475099d1f59fa88de9d0d547a6b26a5e38fb210f0bdded377e089d3eb5c"]

    var d = await trader
        .connect(addr1)
        .fillCriteriaBid(order, 1, 2, proof, null_address, [postPay, '0x6067D233D5eA619d464a218eAf9921B9343e4d16']);

    // console.log(root, proof);
    // // var d = await trader._verifyProof(root, leaf, proof);
    // var d = await trader.verify(root, 1, proof);
    console.log(leaf);
    console.log(d);
    receipt = await d.wait();
    console.log(receipt.cumulativeGasUsed);

    d = await trader
        .connect(addr1)
        .fillCriteriaBid(order, 1, 3, proof2, null_address, [postPay, '0x6067D233D5eA619d464a218eAf9921B9343e4d16']);
    receipt = await d.wait();
    console.log(receipt.cumulativeGasUsed);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
