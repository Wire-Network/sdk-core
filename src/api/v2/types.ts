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


@Struct.type('get_actions_response_action')
export class GetActionsResponseAction extends Struct {
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
    @Struct.field(GetActionsResponseAction, { array: true }) declare actions: GetActionsResponseAction[];
    @Struct.field('number') declare last_indexed_block: number;
    @Struct.field('string') declare last_indexed_block_time: string;
}
