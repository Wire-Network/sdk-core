import {API, Checksum256, Checksum256Type, Float64, Int64, Struct, TimePoint} from '../';

import {ExplorerDefinition} from './explorer';
import {Logo} from './logo';

import type {ChainDefinitionType, ExplorerDefinitionType, LogoType} from './types';

export interface ChainDefinitionArgs {
    id: Checksum256Type;
    url: string;
    logo?: LogoType;
    explorer?: ExplorerDefinitionType;
    accountDataType?: typeof API.v1.AccountObject;
}

/**
 * The information required to interact with a given chain.
 */
export class ChainDefinition<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AccountDataType extends API.v1.AccountObject = API.v1.AccountObject
> {
    /**
     * The chain ID.
     */
    public id: Checksum256;

    /**
     * The base URL of the chain's API endpoint (e.g. https://jungle4.greymass.com).
     */
    public url: string;

    /**
     * The absolute URL(s) to the chain's logo.
     */
    public logo?: LogoType;

    /**
     * The explorer definition for the chain.
     */
    explorer?: ExplorerDefinitionType;

    /**
     * The account data type for the chain.
     */
    accountDataType?: typeof API.v1.AccountObject;

    constructor(data: ChainDefinitionArgs) {
        this.id = Checksum256.from(data.id);
        this.url = data.url;
        this.logo = data.logo;
        this.explorer = data.explorer;
        this.accountDataType = data.accountDataType;
    }

    static from<AccountDataType extends API.v1.AccountObject = API.v1.AccountObject>(
        data: ChainDefinitionArgs
    ): ChainDefinition<AccountDataType> {
        return new ChainDefinition<AccountDataType>({
            ...data,
            explorer: data.explorer ? ExplorerDefinition.from(data.explorer) : undefined,
            logo: data.logo ? Logo.from(data.logo) : undefined,
        });
    }

    get name() {
        const indice = chainIdsToIndices.get(String(this.id));

        if (!indice) {
            return 'Unknown blockchain';
        }

        return ChainNames[indice];
    }

    public getLogo(): Logo | undefined {
        const id = String(this.id);

        if (this.logo) {
            return Logo.from(this.logo);
        }

        if (chainLogos.has(id)) {
            const logo = chainLogos.get(id);

            if (logo) {
                return Logo.from(logo);
            }
        }

        return undefined;
    }

    equals(def: ChainDefinitionType): boolean {
        const other = ChainDefinition.from(def);
        return this.id.equals(other.id) && this.url === other.url;
    }
}

/**
 * A list of string-based chain names to assist autocompletion
 */
export type ChainIndices =
    | 'EOS'
    | 'FIO'
    | 'FIOTestnet'
    | 'Jungle4'
    | 'KylinTestnet'
    | 'Libre'
    | 'LibreTestnet'
    | 'Proton'
    | 'ProtonTestnet'
    | 'Telos'
    | 'TelosTestnet'
    | 'WAX'
    | 'WAXTestnet'
    | 'UX';

/**
 * List of human readable chain names based on the ChainIndices type.
 */
export const ChainNames: Record<ChainIndices, string> = {
    EOS: 'EOS',
    FIO: 'FIO',
    FIOTestnet: 'FIO (Testnet)',
    Jungle4: 'Jungle 4 (Testnet)',
    KylinTestnet: 'Kylin (Testnet)',
    Libre: 'Libre',
    LibreTestnet: 'Libre (Testnet)',
    Proton: 'Proton',
    ProtonTestnet: 'Proton (Testnet)',
    Telos: 'Telos',
    TelosTestnet: 'Telos (Testnet)',
    WAX: 'WAX',
    WAXTestnet: 'WAX (Testnet)',
    UX: 'UX Network',
};

@Struct.type('telos_account_voter_info')
export class TelosAccountVoterInfo extends API.v1.AccountVoterInfo {
    @Struct.field(Int64) last_stake!: Int64;
}

@Struct.type('telos_account_object')
export class TelosAccountObject extends API.v1.AccountObject {
    @Struct.field(TelosAccountVoterInfo, {optional: true})
    declare voter_info?: TelosAccountVoterInfo;
}

@Struct.type('wax_account_voter_info')
export class WAXAccountVoterInfo extends API.v1.AccountVoterInfo {
    @Struct.field(Float64) declare unpaid_voteshare: Float64;
    @Struct.field(TimePoint) declare unpaid_voteshare_last_updated: TimePoint;
    @Struct.field(Float64) declare unpaid_voteshare_change_rate: Float64;
    @Struct.field(TimePoint) declare last_claim_time: TimePoint;
}

@Struct.type('wax_account_object')
export class WAXAccountObject extends API.v1.AccountObject {
    @Struct.field(WAXAccountVoterInfo, {optional: true})
    declare voter_info?: WAXAccountVoterInfo;
}

/**
 * An exported list of ChainDefinition entries for select chains.
 */
export namespace Chains {
    export const EOS = ChainDefinition.from({
        id: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
        url: 'https://eos.greymass.com',
        explorer: {
            prefix: 'https://bloks.io/transaction/',
            suffix: '',
        },
    });

    export const FIO = ChainDefinition.from({
        id: '21dcae42c0182200e93f954a074011f9048a7624c6fe81d3c9541a614a88bd1c',
        url: 'https://fio.greymass.com',
        explorer: {
            prefix: 'https://fio.bloks.io/transaction/',
            suffix: '',
        },
    });

    export const FIOTestnet = ChainDefinition.from({
        id: 'b20901380af44ef59c5918439a1f9a41d83669020319a80574b804a5f95cbd7e',
        url: 'https://fiotestnet.greymass.com',
        explorer: {
            prefix: 'https://fio-test.bloks.io/transaction/',
            suffix: '',
        },
    });

    export const Jungle4 = ChainDefinition.from({
        id: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
        url: 'https://jungle4.greymass.com',
    });

    export const KylinTestnet = ChainDefinition.from({
        id: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
        url: 'https://api.kylin.alohaeos.com',
    });

    export const Libre = ChainDefinition.from({
        id: '38b1d7815474d0c60683ecbea321d723e83f5da6ae5f1c1f9fecc69d9ba96465',
        url: 'https://libre.greymass.com',
        explorer: {
            prefix: 'https://www.libreblocks.io/tx/',
            suffix: '',
        },
    });

    export const LibreTestnet = ChainDefinition.from({
        id: 'b64646740308df2ee06c6b72f34c0f7fa066d940e831f752db2006fcc2b78dee',
        url: 'https://libretestnet.greymass.com',
    });

    export const Proton = ChainDefinition.from({
        id: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
        url: 'https://proton.greymass.com',
        explorer: {
            prefix: 'https://www.protonscan.io/transaction/',
            suffix: '',
        },
    });

    export const ProtonTestnet = ChainDefinition.from({
        id: '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd',
        url: 'https://proton-testnet.greymass.com',
    });

    export const Telos = ChainDefinition.from<TelosAccountObject>({
        id: '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',
        url: 'https://telos.greymass.com',
        explorer: {
            prefix: 'https://explorer.telos.net/transaction/',
            suffix: '',
        },
        accountDataType: TelosAccountObject,
    });

    export const TelosTestnet = ChainDefinition.from<TelosAccountObject>({
        id: '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
        url: 'https://telostestnet.greymass.com',
        accountDataType: TelosAccountObject,
    });

    export const WAX = ChainDefinition.from<WAXAccountObject>({
        id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        url: 'https://wax.greymass.com',
        explorer: {
            prefix: 'https://waxblock.io/transaction/',
            suffix: '',
        },
        accountDataType: WAXAccountObject,
    });

    export const WAXTestnet = ChainDefinition.from<WAXAccountObject>({
        id: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
        url: 'https://waxtestnet.greymass.com',
        accountDataType: WAXAccountObject,
    });

    export const UX = ChainDefinition.from({
        id: '8fc6dce7942189f842170de953932b1f66693ad3788f766e777b6f9d22335c02',
        url: 'https://api.uxnetwork.io',
        explorer: {
            prefix: 'https://explorer.uxnetwork.io/tx/',
            suffix: '',
        },
    });
}

/**
 * A list of chain IDs and their ChainIndices for reference lookups
 */
export const chainIdsToIndices: Map<Checksum256Type, ChainIndices> = new Map([
    ['aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906', 'EOS'],
    ['21dcae42c0182200e93f954a074011f9048a7624c6fe81d3c9541a614a88bd1c', 'FIO'],
    ['b20901380af44ef59c5918439a1f9a41d83669020319a80574b804a5f95cbd7e', 'FIOTestnet'],
    ['73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d', 'Jungle4'],
    ['5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191', 'KylinTestnet'],
    ['38b1d7815474d0c60683ecbea321d723e83f5da6ae5f1c1f9fecc69d9ba96465', 'Libre'],
    ['b64646740308df2ee06c6b72f34c0f7fa066d940e831f752db2006fcc2b78dee', 'LibreTestnet'],
    ['384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0', 'Proton'],
    ['71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd', 'ProtonTestnet'],
    ['4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11', 'Telos'],
    ['1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f', 'TelosTestnet'],
    ['8fc6dce7942189f842170de953932b1f66693ad3788f766e777b6f9d22335c02', 'UX'],
    ['1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4', 'WAX'],
    ['f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12', 'WAXTestnet'],
]);

/**
 * A list of known chain IDs and their logos.
 */
export const chainLogos: Map<Checksum256Type, LogoType> = new Map([
    ['aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906', '../assets/logos/eos.png'],
    ['21dcae42c0182200e93f954a074011f9048a7624c6fe81d3c9541a614a88bd1c', '../assets/logos/fio.png'],
    ['b20901380af44ef59c5918439a1f9a41d83669020319a80574b804a5f95cbd7e', '../assets/logos/fio.png'],
    [
        '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
        '../assets/logos/jungle.png',
    ],
    [
        '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
        '../assets/logos/jungle.png',
    ],
    [
        '38b1d7815474d0c60683ecbea321d723e83f5da6ae5f1c1f9fecc69d9ba96465',
        '../assets/logos/libre.png',
    ],
    [
        'b64646740308df2ee06c6b72f34c0f7fa066d940e831f752db2006fcc2b78dee',
        '../assets/logos/libre.png',
    ],
    [
        '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
        '../assets/logos/proton.png',
    ],
    [
        '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd',
        '../assets/logos/proton.png',
    ],
    [
        '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',
        '../assets/logos/telos.png',
    ],
    [
        '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
        '../assets/logos/telos.png',
    ],
    ['8fc6dce7942189f842170de953932b1f66693ad3788f766e777b6f9d22335c02', '../assets/logos/ux.png'],
    ['1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4', '../assets/logos/wax.png'],
    ['f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12', '../assets/logos/wax.png'],
]);
