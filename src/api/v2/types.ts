import { Action, Signature, Struct } from '../../chain';


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
    @Struct.field(Action) declare act: Action;
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

@Struct.type('get_actions_params')
export class GetActionsParams extends Struct {
    @Struct.field('string') declare account?: string;
    @Struct.field('string') declare filter?: string;
    @Struct.field('string') declare track?: string;
    @Struct.field('number') declare skip?: number;
    @Struct.field('number') declare limit?: number;
    @Struct.field('string') declare sort?: string;
    @Struct.field('string') declare block_num?: string;
    @Struct.field('string') declare global_sequence?: string;
    @Struct.field('string') declare after?: string;
    @Struct.field('string') declare before?: string;
    @Struct.field('boolean') declare simple?: boolean;
    @Struct.field('boolean') declare noBinary?: boolean;
    @Struct.field('boolean') declare checkLib?: boolean;
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
    @Struct.field(Action) declare act: Action;
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
