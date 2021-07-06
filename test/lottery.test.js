const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const provider = ganache.provider();
const web3 = new Web3(provider);

const { interface, bytecode } = require('../compile');

let lottery, accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '1000000' })

    lottery.setProvider(provider);
})

describe('Lottery', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    })

    it('allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')   //amount in wei, therefore we convert it to ether
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);  //in equal method, arguments -> (value that should be, value that it is)
    });

    it('allows multiple accounts to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    });

    it('requires a min amount of ether to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 10
            });
            assert(false);
        }
        catch (err) {
            //since this it function should generate an error, therefore the assert condition should be true here
            assert(err);  // if err has some value = true, otherwise false
        }
    });

    it('restricted call of pickWinner', async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            });
            assert(false);
        }
        catch (err) {
            assert(err); //accounts[1] is not manager, so err should have a value, i.e. there should be an error here
        }
    });

    it('sends money to winner', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        });
        const prevBalance = await web3.eth.getBalance(accounts[0]);   //gives the balance of the account, in wei

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });

        const currBalance = await web3.eth.getBalance(accounts[0]);
        const difference = currBalance - prevBalance;
        //console.log(difference);
        assert(difference > web3.utils.toWei('0.8', 'ether'));
        //difference won't exactly be 1, since some amount would be spent on gas too
    });

    it('players[] emptied after lottery over', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        });

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        //console.log(players, players.length)
        assert.equal(0, players.length);
    });

    it('lottery balance reset after over', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        });

        const prevBalance = await web3.eth.getBalance(lottery.options.address);
        //console.log(prevBalance);
        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });

        const currBalance = await web3.eth.getBalance(lottery.options.address);
        //console.log(currBalance);

        const difference = prevBalance - currBalance;  //currBalance should become 0
        //console.log(difference);
        assert.equal(web3.utils.toWei('1', 'ether'), difference);
    })
});