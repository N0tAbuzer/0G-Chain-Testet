import { ethers } from "ethers";
import { config } from "./config";

import { logger } from "./utils/logger";
import { sleep } from "./utils/sleep";

import * as fs from "fs/promises";
import * as path from "path";

import chalk from "chalk";
import * as readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const provider = new ethers.JsonRpcProvider(config.rpc);

async function isFileExist(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function parsePrivateKeys(): Promise<string[]> {
    const filePath = await path.resolve('./data/privateKeys.txt');

    if (!(await isFileExist(filePath))) {
        logger.error(chalk.hex('#e7e7e7')('File searching error'));
        throw new Error(`File ${filePath} not found`);
    }

    try {
        let data = await fs.readFile(filePath, 'utf-8');
        let privateKeys = data.split('\n')
            .map(str => str.trim())
            .filter(str => str);

        return privateKeys;
    } catch (err) {
        logger.error(chalk.hex('#e7e7e7')('File reading error'), err);
        throw new Error(`Failed to load ${filePath}`);
    }
}

async function parseAddrToSend(): Promise<string[]> {
    const filePath = await path.resolve('./data/addrToSend.txt');

    if (!(await isFileExist(filePath))) {
        logger.error(chalk.hex('#e7e7e7')('File searching error'));
        throw new Error(`File ${filePath} not found`);
    }

    try {
        let data = await fs.readFile(filePath, 'utf-8');
        let addrToSend = data.split('\n')
            .map(str => str.trim())
            .filter(str => str);

        return addrToSend;

    } catch (err) {
        logger.error(chalk.hex('#e7e7e7')('File reading error'), err);
        throw new Error(`Failed to load ${filePath}`);
    }
}

async function getRandValues(addrToSend: string[]): Promise<[number, number, number, number, string]> {
    const sleepBAccs: number | [number, number] = config.sleepBetweenAccs.sleepDelay;
    const sleepBTransfers: number | [number, number] = config.sleepBetweenTransfers.sleepDelay;

    const txCount: number[] = config.txCount;
    const valueToSend: number[] = config.valueToSend;

    try {
        let resSleepBAccs: number = config.sleepBetweenAccs.isSleep && Array.isArray(sleepBAccs)
            ? Math.floor(Math.random() * (sleepBAccs[1] - sleepBAccs[0] + 1)) + sleepBAccs[0]
            : 0;

        let resSleepBTransfers: number = config.sleepBetweenTransfers.isSleep && Array.isArray(sleepBTransfers)
            ? Math.floor(Math.random() * (sleepBTransfers[1] - sleepBTransfers[0] + 1)) + sleepBTransfers[0]
            : 0;

        let resTxCount: number = Math.floor(Math.random() * (txCount[1] - txCount[0] + 1)) + txCount[0];
        let resValueToSend: number = parseFloat(
            (Math.random() * (valueToSend[1] - valueToSend[0]) + valueToSend[0]).toFixed(2)
        );

        let resAddrToSend: string = addrToSend[
            Math.floor(Math.random() * addrToSend.length)
        ];

        return [
            resSleepBAccs,
            resTxCount,
            resSleepBTransfers,
            resValueToSend,
            resAddrToSend
        ];
    } catch (err) {
        logger.error(chalk.hex('#e7e7e7')('Randomization error'), err);
        throw new Error('Failed to randomize data');
    }
}

async function askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer));
    });
}

async function processAccounts(): Promise<void> {
    const privateKeys: string[] = await parsePrivateKeys();
    logger.info(chalk.hex('#e7e7e7')('Private keys successfully uploaded'));

    await sleep(5000);

    const addrToSend: string[] = await parseAddrToSend();
    logger.info(chalk.hex('#e7e7e7')('Addresses for transfering $A0GI successfully uploaded'));

    await sleep(5000);

    const processedIds: number[] = [];
    while (processedIds.length !== privateKeys.length) {
        let randIndex: number = 0;

        do {
            randIndex = Math.floor(Math.random() * privateKeys.length);
        } while (processedIds.includes(randIndex));
        processedIds.push(randIndex);

        const signer = new ethers.Wallet(privateKeys[randIndex], provider);
        logger.info(chalk.hex('#e7e7e7')('Starting acc ') + chalk.bold.cyan(`#${randIndex + 1}`) + chalk.hex('#e7e7e7')(':'))

        let [resSleepBAccs, resTxCount] = await getRandValues(addrToSend);

        await sleep(3000);

        for (let count: number = 1; count <= resTxCount; count++) {
            let [, , resSleepBTransfers, resValueToSend, resAddrToSend] = await getRandValues(addrToSend);
            let signerBalance = await provider.getBalance(signer);
            let value = ethers.parseUnits(`${resValueToSend}`, 'ether');

            if (signerBalance >= value) {
                try {
                    let tx = await signer.sendTransaction({
                        to: resAddrToSend,
                        value: value
                    });

                    logger.info(
                        '\n' +
                        chalk.hex('#e7e7e7')('Transaction successfully sended:') + '\n' + chalk.hex('#e7e7e7')('Tx ') + chalk.bold.cyan(`#${count}`) +
                        chalk.hex('#e7e7e7')(' | From: ') + chalk.bold.cyan(`${signer.address}`) + chalk.hex('#e7e7e7')(' -> To: ') + chalk.bold.cyan(`${resAddrToSend}`) +
                        chalk.hex('#e7e7e7')(' | Value: ') + chalk.bold.cyan(`${resValueToSend}`) + chalk.hex('#e7e7e7')(' $A0GI') + '\n' + chalk.hex('#e7e7e7')('Remained Balance:') + '\n' +
                        chalk.hex('#e7e7e7')('Acc ') + chalk.bold.cyan(`#${randIndex + 1}`) + chalk.hex('#e7e7e7')(' | Balance: ') + chalk.bold.cyan(`${(Number(ethers.formatUnits(await provider.getBalance(signer), "ether"))).toFixed(2)}`) +
                        chalk.hex('#e7e7e7')(' $A0GI') + '\n' + chalk.hex('#e7e7e7')('Explorer: ') +  chalk.bold.underline.cyan(`https://chainscan-newton.0g.ai/tx/${tx.hash}`) +
                        '\n' +
                        chalk.hex('#e7e7e7')('+-------------------------------------------------------+')
                    );

                } catch (err) {
                    logger.error(
                        '\n' +
                        chalk.hex('#e7e7e7')('Error sending transaction:') + '\n' + chalk.hex('#e7e7e7')('Tx ') + chalk.bold.red(`#${count}`) +
                        chalk.hex('#e7e7e7')(' | From: ') + chalk.bold.red(`${signer}`) + chalk.hex('#e7e7e7')(' -> To: ') + chalk.bold.red(`${resAddrToSend}`) +
                        chalk.hex('#e7e7e7')(' | Value: ') + chalk.bold.red(`${resAddrToSend}`) + chalk.hex('#e7e7e7')(' $A0GI') +
                        '\n' +
                        chalk.hex('#e7e7e7')('+-------------------------------------------------------+')
                    , err);
                }
            } else {
                logger.warn(
                    '\n' + chalk.hex('#e7e7e7')('Insufficient account balance:') + '\n' + chalk.hex('#e7e7e7')('Acc ') + chalk.bold.yellow(`#${randIndex + 1}`) +
                    chalk.hex('#e7e7e7')(' | Address: ') + chalk.bold.yellow(`${signer.address}`) + chalk.hex('#e7e7e7')(' | Balance: ') +
                    chalk.bold.yellow(`${ethers.formatUnits(signerBalance, 'ether')}`) + chalk.hex('#e7e7e7')(' $A0GI') +
                    '\n' +
                    chalk.hex('#e7e7e7')('+-------------------------------------------------------+')
                );
                break;
            }

            await sleep(resSleepBTransfers * 1000);
        }

        logger.info(chalk.hex('#e7e7e7')(`Sleep...`));
        await sleep(resSleepBAccs * 1000);
    }

    if (config.sleepBetweenCycle.isSleep) {
        let sleepDelay = config.sleepBetweenCycle.sleepDelay;
        let delay = Array.isArray(sleepDelay)
            ? Math.floor(Math.random() * (sleepDelay[1] - sleepDelay[0] + 1)) + sleepDelay[0]
            : sleepDelay;

        logger.info(chalk.hex('#e7e7e7')('Sleep...'));
        await sleep(delay * 1000);

        await processAccounts();
    } else {
        logger.info(chalk.hex('#e7e7e7')('All accounts processed, script completed'));
    }
}

async function chooseOption(): Promise<void> {
    console.log(await fs.readFile('./logo.txt', 'utf-8'));
    logger.info(
        '\n' +
        chalk.hex('#e7e7e7')('Select option:') + '\n' +
        chalk.bold.cyan('1: ') + chalk.hex('#e7e7e7')('Request $AOGI (Once every 24h)') + '\n' +
        chalk.bold.cyan('2: ') + chalk.hex('#e7e7e7')('Start script')
    );

    let answer = await askQuestion(chalk.hex('#e7e7e7')('Your choice: '));

    switch (answer) {
        case '1':
            logger.warn(
                '\n' +
                chalk.hex('#e7e7e7')('For the correct script work you need $A0GI:') + '\n' +
                chalk.hex('#e7e7e7')('Faucet link - ') + chalk.bold.underline.yellow('https://faucet.0g.ai/')
            );
        break;
        case '2':
            rl.close();
            await processAccounts();
        break;
        default:
            logger.warn(
                chalk.hex('#e7e7e7')('Incorrect Input. Please, select option ') +
                chalk.bold.yellow('1') + chalk.hex('#e7e7e7')(' or ') + chalk.bold.yellow('2')
            );
            rl.close();
    }
}

async function main(): Promise<void> {
    try {
        await chooseOption();
    } catch (err) {}
    finally {
        rl.close();
        logger.info(chalk.hex('#e7e7e7')('Console is closed'));
    }
}

main();