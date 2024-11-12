import { AnyAction, Signature, Struct } from '../../chain';

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
export class HealthResponse extends Struct {
    @Struct.field('string') declare version: string;
    @Struct.field('string') declare version_hash: string;
    @Struct.field('string') declare host: string;
    @Struct.field(HealthService, { array: true }) declare health: HealthService[];
    @Struct.field(HealthFeatures) declare features: HealthFeatures;
    @Struct.field('number') declare query_time_ms: number;
    @Struct.field('number') declare last_indexed_block: number;
    @Struct.field('string') declare last_indexed_block_time: string;
}

export interface GetActionsParams {
    account?: string;
    filter?: string;
    track?: string;
    skip?: number;
    limit?: number;
    sort?: 'asc' | 'desc';
    block_num?: string;
    global_sequence?: string;
    after?: string;
    before?: string;
    simple?: boolean;
    noBinary?: boolean;
    checkLib?: boolean;
}