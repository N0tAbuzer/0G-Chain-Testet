type Delay = [number, number];

interface SleepConfig {
    isSleep: boolean;
    sleepDelay: number | Delay;
}

export interface Config {
    sleepBetweenAccs: SleepConfig;
    sleepBetweenTransfers: SleepConfig;
    sleepBetweenCycle: SleepConfig;
    txCount: Delay;
    valueToSend: Delay;
    rpc: string;
    scan: string;
}