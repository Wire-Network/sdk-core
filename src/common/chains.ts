import {
    Checksum256,
    Checksum256Type
} from '../';
import { Logo } from './logo';
import type { ChainDefinitionType, LogoType } from './types';

export interface ChainDefinitionArgs {
    id: Checksum256Type;
    name: string;
    endpoint: string;
    hyperion?: string;
    websocket?: string;
    watchdawg?: string;
    namespace: string;
    coreSymbol: string;
    selected?: boolean;
    logo?: LogoType;
}

/**
 * Holds all information for a single chain.
 */
export class ChainDefinition {
    public id: Checksum256;
    public name: string;
    public endpoint: string;
    public hyperion?: string;
    public websocket?: string;
    public watchdawg?: string;
    public namespace: string;
    public coreSymbol: string;
    public selected: boolean;
    public logo?: LogoType;

    constructor(data: ChainDefinitionArgs) {
        this.id = Checksum256.from(data.id);
        this.name = data.name;
        this.endpoint = data.endpoint;
        this.hyperion = data.hyperion;
        this.websocket = data.websocket;
        this.watchdawg = data.watchdawg;
        this.namespace = data.namespace;
        this.coreSymbol = data.coreSymbol;
        this.selected = !!data.selected;
        this.logo = data.logo;
    }

    static from(data: ChainDefinitionArgs): ChainDefinition {
        const inst = new ChainDefinition(data);

        if (data.logo) {
            inst.logo = Logo.from(data.logo);
        }

        return inst;
    }

    /**
     * If you passed a `logo`, returns a Logo instance.
     */
    public getLogo(): Logo | undefined {
        return this.logo ? Logo.from(this.logo) : undefined;
    }

    /**
     * Two chains are equal if ID+endpoint match.
     */
    equals(def: ChainDefinitionType): boolean {
        const other = ChainDefinition.from(def as any);
        return this.id.equals(other.id)
            && this.endpoint === other.endpoint;
    }
}

// ----------------------------------------------------------------------------
// built-in Wire networks
// ----------------------------------------------------------------------------

export namespace Chains {
    // export const TESTNET = ChainDefinition.from({
    //     id: '065dcca2dc758af25bcf3b878260a19dd1b81e4597f2af15a262a0c67f1e0106',
    //     name: 'Wire Testnet',
    //     endpoint: 'https://testnet-00.wire.foundation',
    //     hyperion: 'https://testnet-hyperion.wire.foundation',
    //     websocket: 'ws://testnet-ship.wire.foundation',
    //     watchdawg: 'https://dawg.wire.foundation',
    //     namespace: 'sysio',
    //     coreSymbol: 'SYS',
    //     selected: true,
    //     logo: '../assets/logos/wire-testnet.png'
    // });

    export const DEVNET = ChainDefinition.from({
        id: 'a53ac16673f6baf13b439d350e21dc8c37de7691ef4f287beca894dc23fdec34',
        name: 'Wire Devnet',
        endpoint: 'https://wire-sysio-chain-api.dev.wire-dev.com',
        hyperion: 'https://hyperion-wire-sysio.gitgo.app',
        // websocket: 'ws://dev-hist.gitgo.app',
        namespace: 'sysio',
        coreSymbol: 'SYS',
        logo: '../assets/logos/W.png',
        selected: true
    });

    // export const MAINNET_CLASSIC = ChainDefinition.from({
    //     id: 'de9943091e811bfb246ca243144b4d274886b959bbb17dd33d0bc97c745dbbe0',
    //     name: 'Wire Classic',
    //     endpoint: 'https://wire.siliconswamp.info',
    //     hyperion: 'https://hyperwire.airwire.io',
    //     websocket: 'ws://swamprod.airwire.io:8080',
    //     namespace: 'eosio',
    //     coreSymbol: 'EOS',
    //     logo: '../assets/logos/wire.png'
    // });
}
