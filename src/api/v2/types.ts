import { 
    Action, 
    BlockTimestamp, 
    Checksum256, 
    Name, 
    Struct, 
    UInt32 
} from '../../chain';

@Struct.type('transaction_receipt')
export class TransactionReceipt extends Struct {
    @Struct.field(Name) declare receiver: Name;
    @Struct.field('string') declare global_sequence: string;
    @Struct.field('string') declare recv_sequence: string;
    @Struct.field('array') declare auth_sequence: Array<{ account: string; sequence: string }>;
}

@Struct.type('action_data')
export class ActionData extends Struct {
    @Struct.field('object') declare header: {
        timestamp: number;
        producer: string;
        confirmed: number;
        previous: string;
        transaction_mroot: string;
        action_mroot: string;
        schedule_version: number;
        new_producers: any;
    };
}

@Struct.type('transaction_action')
export class TransactionAction extends Struct {
    @Struct.field(UInt32) declare action_ordinal: UInt32;
    @Struct.field(UInt32) declare creator_action_ordinal: UInt32;
    @Struct.field(Action) declare act: {
        account: string;
        name: string;
        authorization: Array<{ actor: string; permission: string }>;
        data: ActionData;
    };
    @Struct.field(BlockTimestamp) declare timestamp: BlockTimestamp;
    @Struct.field(UInt32) declare block_num: UInt32;
    @Struct.field(Checksum256) declare block_id: Checksum256;
    @Struct.field(Name) declare producer: Name;
    @Struct.field(Checksum256) declare trx_id: Checksum256;
    @Struct.field('number') declare global_sequence: number;
    @Struct.field('number') declare cpu_usage_us: number;
    @Struct.field('number') declare code_sequence: number;
    @Struct.field('number') declare abi_sequence: number;
    @Struct.field('string') declare act_digest: string;
    @Struct.field(TransactionReceipt, { array: true }) declare receipts: TransactionReceipt[];
}

@Struct.type('get_transaction_response')
export class GetTransactionResponse extends Struct {
    @Struct.field('number') declare query_time_ms: number;
    @Struct.field('boolean') declare executed: boolean;
    @Struct.field(Checksum256) declare trx_id: Checksum256;
    @Struct.field(UInt32) declare lib: UInt32;
    @Struct.field('boolean') declare cached_lib: boolean;
    @Struct.field(TransactionAction, { array: true }) declare actions: TransactionAction[];
    @Struct.field(UInt32) declare last_indexed_block: UInt32;
    @Struct.field(BlockTimestamp) declare last_indexed_block_time: BlockTimestamp;
}