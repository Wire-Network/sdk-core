import { AnyAction, Checksum256Type, NameType, Signature, Struct } from '../../chain';


export interface HyperionBaseResponse {
    query_time_ms: number;
    last_indexed_block: number;
    last_indexed_block_time: string;
}

@Struct.type('account_ram_delta')
export class AccountRamDelta extends Struct {
    @Struct.field('string') declare account: string;
    @Struct.field('number') declare delta: number;
}

@Struct.type('auth_sequence')
export class AuthSequence extends Struct {
    @Struct.field('string') declare account: string;
    @Struct.field('string') declare sequence: string;
}

@Struct.type('receipt')
export class Receipt extends Struct {
    @Struct.field('string') declare receiver: string;
    @Struct.field('string') declare global_sequence: string;
    @Struct.field('string') declare recv_sequence: string;
    @Struct.field(AuthSequence, { array: true }) declare auth_sequence: AuthSequence[];
}


@Struct.type('get_transaction_response_action')
export class GetTransactionResponseAction extends Struct {
    @Struct.field('number') declare action_ordinal: number;
    @Struct.field('number') declare creator_action_ordinal: number;
    @Struct.field('AnyAction') declare act: AnyAction;
    @Struct.field(AccountRamDelta, { array: true }) declare account_ram_deltas: AccountRamDelta[];
    @Struct.field(Signature, { array: true }) declare signatures: Signature[];
    @Struct.field('string') declare '@timestamp': string;
    @Struct.field('number') declare block_num: number;
    @Struct.field('string') declare block_id: string;
    @Struct.field('string') declare producer: string;
    @Struct.field('string') declare trx_id: string;
    @Struct.field('number') declare global_sequence: number;
    @Struct.field('number') declare cpu_usage_us: number;
    @Struct.field('number') declare net_usage_words: number;
    @Struct.field('number') declare code_sequence: number;
    @Struct.field('number') declare abi_sequence: number;
    @Struct.field('string') declare act_digest: string;
    @Struct.field(Receipt, { array: true }) declare receipts: Receipt[];
    @Struct.field('string') declare timestamp: string;
}

@Struct.type('get_transaction_response_v2')
export class GetTransactionResponse extends Struct {
    @Struct.field('number') declare query_time_ms: number;
    @Struct.field('boolean') declare executed: boolean;
    @Struct.field('string') declare trx_id: string;
    @Struct.field('number') declare lib: number;
    @Struct.field('boolean') declare cached_lib: boolean;
    @Struct.field(GetTransactionResponseAction, { array: true }) declare actions: GetTransactionResponseAction[];
    @Struct.field('number') declare last_indexed_block: number;
    @Struct.field('string') declare last_indexed_block_time: string;
}

@Struct.type('action_data_header')
export class ActionDataHeader extends Struct {
    @Struct.field('number') declare timestamp: number;
    @Struct.field('string') declare producer: string;
    @Struct.field('number') declare confirmed: number;
    @Struct.field('string') declare previous: string;
    @Struct.field('string') declare transaction_mroot: string;
    @Struct.field('string') declare action_mroot: string;
    @Struct.field('number') declare schedule_version: number;
    @Struct.field('any') declare new_producers?: any;
}

@Struct.type('get_actions_response_action')
export class ActionObject extends Struct {
    @Struct.field('number') declare action_ordinal: number;
    @Struct.field('number') declare creator_action_ordinal: number;
    @Struct.field('AnyAction') declare act: AnyAction;
    @Struct.field(AccountRamDelta, { array: true }) declare account_ram_deltas: AccountRamDelta[];
    @Struct.field(Signature, { array: true }) declare signatures: Signature[];
    @Struct.field('string') declare '@timestamp': string;
    @Struct.field('string') declare timestamp: string;
    @Struct.field('number') declare block_num: number;
    @Struct.field('string') declare block_id: string;
    @Struct.field('string') declare trx_id: string;
    @Struct.field(Receipt, { array: true }) declare receipts: Receipt[];
    @Struct.field('number') declare cpu_usage_us: number;
    @Struct.field('number') declare global_sequence: number;
    @Struct.field('string') declare producer: string;
    @Struct.field('number') declare net_usage_words: number;
    @Struct.field('number') declare code_sequence: number;
    @Struct.field('number') declare abi_sequence: number;
    @Struct.field('string') declare act_digest: string;
}

@Struct.type('get_actions_total')
export class GetActionsTotal extends Struct {
    @Struct.field('number') declare value: number;
    @Struct.field('string') declare relation: string;
}

@Struct.type('get_actions_response')
export class GetActionsResponse extends Struct {
    @Struct.field('number') declare query_time_ms: number;
    @Struct.field('boolean') declare cached: boolean;
    @Struct.field('number') declare lib: number;
    @Struct.field('number') declare last_indexed_block: number;
    @Struct.field('string') declare last_indexed_block_time: string;
    @Struct.field(GetActionsTotal) declare total: GetActionsTotal;
    @Struct.field(ActionObject, { array: true }) declare actions: ActionObject[];
}

@Struct.type('health_service')
export class HealthService extends Struct {
    @Struct.field('string') declare service: string;
    @Struct.field('string') declare status: string;
    @Struct.field('number') declare time: number;
    @Struct.field('any', { optional: true }) declare service_data?: any;
}

@Struct.type('health_features_streaming')
export class HealthFeaturesStreaming extends Struct {
    @Struct.field('boolean') declare enable: boolean;
    @Struct.field('boolean') declare traces: boolean;
    @Struct.field('boolean') declare deltas: boolean;
}

@Struct.type('health_features_tables')
export class HealthFeaturesTables extends Struct {
    @Struct.field('boolean') declare proposals: boolean;
    @Struct.field('boolean') declare accounts: boolean;
    @Struct.field('boolean') declare voters: boolean;
}

@Struct.type('health_features')
export class HealthFeatures extends Struct {
    @Struct.field(HealthFeaturesStreaming) declare streaming: HealthFeaturesStreaming;
    @Struct.field(HealthFeaturesTables) declare tables: HealthFeaturesTables;
    @Struct.field('boolean') declare index_deltas: boolean;
    @Struct.field('boolean') declare index_transfer_memo: boolean;
    @Struct.field('boolean') declare index_all_deltas: boolean;
    @Struct.field('boolean') declare deferred_trx: boolean;
    @Struct.field('boolean') declare failed_trx: boolean;
    @Struct.field('boolean') declare resource_limits: boolean;
    @Struct.field('boolean') declare resource_usage: boolean;
}

@Struct.type('health_response')
export class HealthResponse extends Struct implements HyperionBaseResponse {
    @Struct.field('string') declare version: string;
    @Struct.field('string') declare version_hash: string;
    @Struct.field('string') declare host: string;
    @Struct.field(HealthService, { array: true }) declare health: HealthService[];
    @Struct.field(HealthFeatures) declare features: HealthFeatures;
    // HyperionBaseResponse
    @Struct.field('number') declare query_time_ms: number;
    @Struct.field('number') declare last_indexed_block: number;
    @Struct.field('string') declare last_indexed_block_time: string;
}
@Struct.type('api_usage_total')
export class ApiUsageTotal extends Struct {
    @Struct.field('any') declare responses: Record<string, Record<string, number>>;
}

@Struct.type('api_usage_bucket')
export class ApiUsageBucket extends Struct {
    @Struct.field('string') declare timestamp: string;
    @Struct.field('any') declare responses: Record<string, Record<string, number>>;
}

@Struct.type('api_usage_response')
export class ApiUsageResponse extends Struct implements HyperionBaseResponse {
    @Struct.field(ApiUsageTotal) declare total: ApiUsageTotal;
    @Struct.field(ApiUsageBucket, { array: true }) declare buckets: ApiUsageBucket[];
    // HyperionBaseResponse
    @Struct.field('number') declare query_time_ms: number;
    @Struct.field('number') declare last_indexed_block: number;
    @Struct.field('string') declare last_indexed_block_time: string;
}

@Struct.type('missed_blocks_stats')
export class MissedBlocksStats extends Struct {
    @Struct.field('any') declare by_producer: Record<string, number>;
}

@Struct.type('missed_blocks_response')
export class MissedBlocksResponse extends Struct implements HyperionBaseResponse {
    @Struct.field(MissedBlocksStats) declare stats: MissedBlocksStats;
    @Struct.field('any', { array: true }) declare events: any[];
    // HyperionBaseResponse
    @Struct.field('number') declare query_time_ms: number;
    @Struct.field('number') declare last_indexed_block: number;
    @Struct.field('string') declare last_indexed_block_time: string;
}

@Struct.type('resource_usage_stats')
export class ResourceUsageStats extends Struct {
    @Struct.field('number') declare count: number;
    @Struct.field('number', { optional: true }) declare min: number | null;
    @Struct.field('number', { optional: true }) declare max: number | null;
    @Struct.field('number', { optional: true }) declare avg: number | null;
    @Struct.field('number') declare sum: number;
    @Struct.field('number', { optional: true }) declare sum_of_squares: number | null;
    @Struct.field('number', { optional: true }) declare variance: number | null;
    @Struct.field('number', { optional: true }) declare variance_population: number | null;
    @Struct.field('number', { optional: true }) declare variance_sampling: number | null;
    @Struct.field('number', { optional: true }) declare std_deviation: number | null;
    @Struct.field('number', { optional: true }) declare std_deviation_population: number | null;
    @Struct.field('number', { optional: true }) declare std_deviation_sampling: number | null;
    @Struct.field('number', { optional: true }) declare std_deviation_bounds_upper: number | null;
    @Struct.field('number', { optional: true }) declare std_deviation_bounds_lower: number | null;
    @Struct.field('number', { optional: true }) declare std_deviation_bounds_upper_population: number | null;
    @Struct.field('number', { optional: true }) declare std_deviation_bounds_lower_population: number | null;
    @Struct.field('number', { optional: true }) declare std_deviation_bounds_upper_sampling: number | null;
    @Struct.field('number', { optional: true }) declare std_deviation_bounds_lower_sampling: number | null;
}

@Struct.type('resource_usage_percentiles')
export class ResourceUsagePercentiles extends Struct {
    @Struct.field('number', { optional: true }) declare '1.0': number | null;
    @Struct.field('number', { optional: true }) declare '5.0': number | null;
    @Struct.field('number', { optional: true }) declare '25.0': number | null;
    @Struct.field('number', { optional: true }) declare '50.0': number | null;
    @Struct.field('number', { optional: true }) declare '75.0': number | null;
    @Struct.field('number', { optional: true }) declare '95.0': number | null;
    @Struct.field('number', { optional: true }) declare '99.0': number | null;
}

@Struct.type('resource_usage')
export class ResourceUsage extends Struct {
    @Struct.field(ResourceUsageStats) declare stats: ResourceUsageStats;
    @Struct.field(ResourceUsagePercentiles) declare percentiles: ResourceUsagePercentiles;
}

@Struct.type('get_resource_usage_response')
export class GetResourceUsageResponse extends Struct implements HyperionBaseResponse {
    @Struct.field(ResourceUsage) declare cpu: ResourceUsage;
    @Struct.field(ResourceUsage) declare net: ResourceUsage;
    @Struct.field('boolean') declare cached: boolean;
    // HyperionBaseResponse
    @Struct.field('number') declare query_time_ms: number;
    @Struct.field('number') declare last_indexed_block: number;
    @Struct.field('string') declare last_indexed_block_time: string;
}

export interface GetActionsParams {
    /**
     * Notified account to filter actions.
     */
    account?: string;
    /**
     * Filter actions based on code:name (e.g., `eosio.token:transfer`).
     */
    filter?: string;
    /**
     * Track total results (count). Accepts a number or `true` for total count tracking.
     */
    track?: string | number;
    /**
     * Number of results to skip.
     */
    skip?: number;
    /**
     * Limit the number of results per page.
     */
    limit?: number;
    /**
     * Sort direction for results. Accepts `asc`, `desc`, `1`, or `-1`.
     */
    sort?: 'asc' | 'desc' | '1' | '-1';
    /**
     * Filter actions after the specified date (ISO8601 format).
     */
    after?: string;
    /**
     * Filter actions before the specified date (ISO8601 format).
     */
    before?: string;
    /**
     * Simplified output mode.
     */
    simple?: boolean;
    /**
     * Search only the latest hot index.
     */
    hot_only?: boolean;
    /**
     * Exclude large binary data from the response.
     */
    noBinary?: boolean;
    /**
     * Perform a reversibility check.
     */
    checkLib?: boolean;
}

@Struct.type('permission')
export class Permission extends Struct {
    @Struct.field('string') declare perm_name: string;
    @Struct.field('string') declare parent: string;
    @Struct.field('any') declare required_auth: {
        threshold: number;
        keys: { key: string; weight: number }[];
        accounts: any[];
        waits: any[];
    };
}

@Struct.type('limit')
export class Limit extends Struct {
    @Struct.field('number') declare used: number;
    @Struct.field('number') declare available: number;
    @Struct.field('number') declare max: number;
}

@Struct.type('total_resources')
export class TotalResources extends Struct {
    @Struct.field('string') declare owner: string;
    @Struct.field('string') declare net_weight: string;
    @Struct.field('string') declare cpu_weight: string;
    @Struct.field('number') declare ram_bytes: number;
}

@Struct.type('self_delegated_bandwidth')
export class SelfDelegatedBandwidth extends Struct {
    @Struct.field('string') declare from: string;
    @Struct.field('string') declare to: string;
    @Struct.field('string') declare net_weight: string;
    @Struct.field('string') declare cpu_weight: string;
}

@Struct.type('voter_info')
export class VoterInfo extends Struct {
    @Struct.field('string') declare owner: string;
    @Struct.field('string') declare proxy: string;
    @Struct.field('string[]') declare producers: string[];
    @Struct.field('number') declare staked: number;
    @Struct.field('string') declare last_vote_weight: string;
    @Struct.field('string') declare proxied_vote_weight: string;
    @Struct.field('number') declare is_proxy: number;
    @Struct.field('number') declare flags1: number;
    @Struct.field('number') declare reserved2: number;
    @Struct.field('string') declare reserved3: string;
}

@Struct.type('account')
export class Account extends Struct {
    @Struct.field('string') declare account_name: string;
    @Struct.field('number') declare head_block_num: number;
    @Struct.field('string') declare head_block_time: string;
    @Struct.field('boolean') declare privileged: boolean;
    @Struct.field('string') declare last_code_update: string;
    @Struct.field('string') declare created: string;
    @Struct.field('string') declare core_liquid_balance: string;
    @Struct.field('number') declare ram_quota: number;
    @Struct.field('number') declare net_weight: number;
    @Struct.field('number') declare cpu_weight: number;
    @Struct.field(Limit) declare net_limit: Limit;
    @Struct.field(Limit) declare cpu_limit: Limit;
    @Struct.field('number') declare ram_usage: number;
    @Struct.field(Permission, { array: true }) declare permissions: Permission[];
    @Struct.field(TotalResources) declare total_resources: TotalResources;
    @Struct.field(SelfDelegatedBandwidth) declare self_delegated_bandwidth: SelfDelegatedBandwidth;
    @Struct.field('any', { optional: true }) declare refund_request?: any;
    @Struct.field(VoterInfo) declare voter_info: VoterInfo;
    @Struct.field('any', { optional: true }) declare rex_info?: any;
    @Struct.field(Limit) declare subjective_cpu_bill_limit: Limit;
}

@Struct.type('link')
export class Link extends Struct {
    @Struct.field('string') declare timestamp: string;
    @Struct.field('string') declare permission: string;
    @Struct.field('string') declare code: string;
    @Struct.field('string') declare action: string;
}

@Struct.type('token')
export class Token extends Struct {
    @Struct.field('string') declare symbol: string;
    @Struct.field('number') declare precision: number;
    @Struct.field('number') declare amount: number;
    @Struct.field('string') declare contract: string;
}

@Struct.type('action')
export class Action extends Struct {
    @Struct.field('string') declare '@timestamp': string;
    @Struct.field('string') declare timestamp: string;
    @Struct.field('number') declare block_num: number;
    @Struct.field('string') declare block_id: string;
    @Struct.field('string') declare trx_id: string;
    @Struct.field('any') declare act: any;
    @Struct.field(Receipt, { array: true }) declare receipts: Receipt[];
    @Struct.field('number') declare cpu_usage_us: number;
    @Struct.field('number') declare net_usage_words: number;
    @Struct.field('number') declare global_sequence: number;
    @Struct.field('string') declare producer: string;
    @Struct.field('number') declare action_ordinal: number;
    @Struct.field('number') declare creator_action_ordinal: number;
    @Struct.field(Signature, { array: true }) declare signatures: Signature[];
}

@Struct.type('get_account_response')
export class GetAccountResponse extends Struct implements HyperionBaseResponse {
    @Struct.field('number') declare query_time_ms: number;
    @Struct.field('number') declare last_indexed_block: number;
    @Struct.field('string') declare last_indexed_block_time: string;
    @Struct.field(Account) declare account: Account;
    @Struct.field(Link, { array: true }) declare links: Link[];
    @Struct.field(Token, { array: true }) declare tokens: Token[];
    @Struct.field('number') declare total_actions: number;
    @Struct.field(Action, { array: true }) declare actions: Action[];
}
export interface MissedBlocksParams {
    producer?: NameType;
    after?: string;
    before?: string;
    min_blocks?: number;
}

export interface GetResourceUsageParams {
    code: NameType;
    action: NameType;
}

export interface GetCreatedAccountsParams {
    /**
     * creator account
     */
    account: NameType;
    /**
     * Number of results to skip.
     */
    skip?: number;
    /**
     * Limit the number of results per page.
     */
    limit?: number;
}
export interface CreatedAccount {
    name: string;
    timestamp: string;
    trx_id: string;
}

@Struct.type('get_account_response')
export class GetCreatedAccountsResponse extends Struct implements HyperionBaseResponse {
    @Struct.field('CreatedAccount[]') declare accounts: CreatedAccount[];
    // HyperionBaseResponse
    @Struct.field('number') declare query_time_ms: number;
    @Struct.field('number') declare last_indexed_block: number;
    @Struct.field('string') declare last_indexed_block_time: string;
}

