import { SignerProvider } from "../signing/signer-provider";

export enum Curve {
    EC = 'EC',
    ED = 'ED'
}

export type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta' | 'wire-testnet';

export type EcProviderType = 'metamask' | 'walletconnect' | 'coinbasewallet';
export type EdProviderType = 'phantom' | 'solflare';  // …plus 'sui' later
export type ProviderType = EcProviderType | EdProviderType;


export interface WalletConnections {
    [Curve.EC]?: WalletConnection;
    [Curve.ED]?: WalletConnection;
}

export interface WalletConnection {
    address: string;
    chainId: number | SolanaCluster | string;
    curve: Curve;
    providerType: ProviderType;
    signer: SignerProvider;
}

export interface ExternalNetwork {
    name: string;
    chainId: number | SolanaCluster; // For EVM: numeric chain ID; for Solana: a cluster name (e.g., "devnet")
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

 