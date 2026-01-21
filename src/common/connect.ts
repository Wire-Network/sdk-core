import { SignerProvider } from "../signing/signer-provider";

export enum Curve {
    EC = 'EC',
    ED = 'ED'   
}

export enum SolChainID {
    Devnet = 'devnet',
    Testnet = 'testnet',
    Mainnet = 'mainnet-beta',
    WireTestnet = 'wire-testnet'
}

export enum EvmChainID {
    Ethereum = 1,
    Hoodi = 560048,
    Sepolia = 11155111,
    Polygon = 137,
    WireTestnet = 1122334455
}

export type ChainID = SolChainID | EvmChainID;

export enum ProviderType {
    Window = 'window',
    WalletConnect = 'walletconnect',
    CoinbaseWallet = 'coinbasewallet',
    Phantom = 'phantom',
    Solflare = 'solflare',
    Backpack = 'backpack'
}

export type EcProviderType = 
    ProviderType.Window |
    ProviderType.WalletConnect |
    ProviderType.CoinbaseWallet;

export type EdProviderType = 
    ProviderType.Phantom | 
    ProviderType.Solflare | 
    ProviderType.Backpack;

export interface WalletConnections {
    [Curve.EC]?: WalletConnection;
    [Curve.ED]?: WalletConnection;
}

export interface WalletConnection {
    address: string;
    chainId: ChainID;
    curve: Curve;
    providerType: ProviderType;
    signer: SignerProvider;
}

export interface ExternalNetwork {
    name: string;
    chainId: ChainID; 
    curve: Curve;
    rpcUrls: string[];
    blockExplorerUrls: string[];
    iconUrls: string[];
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    alchemyId?: string;
}

