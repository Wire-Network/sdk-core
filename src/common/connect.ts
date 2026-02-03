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
    Metamask = 'metamask',
    RabbyWallet = 'rabbywallet',
    BraveWalletEth = 'bravewalleteth',
    WalletConnect = 'walletconnect',
    CoinbaseWallet = 'coinbasewallet',
    BraveWalletSol = 'bravewalletsol',
    Phantom = 'phantom',
    Solflare = 'solflare',
    Backpack = 'backpack',
    SquadsX = 'squadsx',
}

export type EcProviderType =
    ProviderType.Metamask |
    ProviderType.BraveWalletEth |
    ProviderType.WalletConnect |
    ProviderType.CoinbaseWallet |
    ProviderType.RabbyWallet;

export type EdProviderType =
    ProviderType.BraveWalletSol |
    ProviderType.Phantom |
    ProviderType.Solflare |
    ProviderType.Backpack |
    ProviderType.SquadsX;

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

