import type { Config } from "./types";

export const config: Config = {
    sleepBetweenAccs: {
        isSleep: true,
        sleepDelay: [300, 1800]
    },
    sleepBetweenTransfers: {
        isSleep: true,
        sleepDelay: [30, 120]
    },
    sleepBetweenCycle: {
        isSleep: true,
        sleepDelay: 86400
    },
    txCount: [1, 9],
    valueToSend: [0.01, 0.09],
    rpc: 'https://evmrpc-testnet.0g.ai',
    scan: 'https://chainscan-newton.0g.ai/tx/'
}