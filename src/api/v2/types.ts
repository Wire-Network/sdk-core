import { Action, BlockTimestamp, Checksum256, Name, Signature, Struct, TransactionReceipt, UInt32 } from '../../chain';
import { AccountObject, TransactionTrace, Trx } from '../v1/types';

// v2/history endpoints

// Get Transaction
@Struct.type('get_transaction_response')
export class GetTransactionResponse extends Struct {
    @Struct.field(Checksum256) declare id: Checksum256;
    @Struct.field(UInt32) declare block_num: UInt32;
    @Struct.field(BlockTimestamp) declare block_time: BlockTimestamp;
    @Struct.field(UInt32) declare last_irreversible_block: UInt32;
    @Struct.field(TransactionTrace, { array: true, optional: true }) traces?: TransactionTrace[];
    @Struct.field(TransactionReceipt) declare trx: Trx;
}

// Check Transaction
@Struct.type('check_transaction_response')
export class CheckTransactionResponse extends Struct {
    @Struct.field(Checksum256) declare id: Checksum256;
    @Struct.field('string') declare status: string;
    @Struct.field(UInt32) declare block_num: UInt32;
    @Struct.field(Action) declare root_action: Action;
    @Struct.field(Signature, { array: true }) declare signatures: Signature[];
}

// Get ABI Snapshot
@Struct.type('get_abi_snapshot_response')
export class GetAbiSnapshotResponse extends Struct {
    @Struct.field(Name) declare contract: Name;
    @Struct.field('string') declare abi: string;
}

// Get Actions
@Struct.type('get_actions_response_action')
export class GetActionsResponseAction extends Struct {
    @Struct.field('string') declare '@timestamp': string;
    @Struct.field('string') declare timestamp: string;
    @Struct.field(UInt32) declare block_num: UInt32;
    @Struct.field(Checksum256) declare block_id: Checksum256;
    @Struct.field(Checksum256) declare trx_id: Checksum256;
    @Struct.field(Action) declare act: Action;
    @Struct.field(TransactionReceipt, { array: true }) declare receipts: TransactionReceipt[];
    @Struct.field(UInt32) declare cpu_usage_us: UInt32;
    @Struct.field(UInt32) declare net_usage_words: UInt32;
    @Struct.field('any', { optional: true }) declare account_ram_deltas?: any;
    @Struct.field(UInt32) declare global_sequence: UInt32;
    @Struct.field(Name) declare producer: Name;
    @Struct.field(UInt32) declare parent: UInt32;
    @Struct.field(UInt32) declare action_ordinal: UInt32;
    @Struct.field(UInt32) declare creator_action_ordinal: UInt32;
    @Struct.field(Signature, { array: true }) declare signatures: Signature[];
}

@Struct.type('get_actions_response')
export class GetActionsResponse extends Struct {
    @Struct.field(GetActionsResponseAction, { array: true }) declare actions: GetActionsResponseAction[];
}

// Get Created Accounts
@Struct.type('get_created_accounts_response_account')
export class GetCreatedAccountsResponseAccount extends Struct {
    @Struct.field(Name) declare name: Name;
    @Struct.field('string') declare timestamp: string;
    @Struct.field(Checksum256) declare trx_id: Checksum256;
}

@Struct.type('get_created_accounts_response')
export class GetCreatedAccountsResponse extends Struct {
    @Struct.field('number') declare query_time: number;
    @Struct.field('object') declare total: { value: number; relation: string };
    @Struct.field(GetCreatedAccountsResponseAccount, { array: true }) declare accounts: GetCreatedAccountsResponseAccount[];
}

// Get Account Creator
@Struct.type('get_creator_response')
export class GetCreatorResponse extends Struct {
    @Struct.field(Name) declare account: Name;
    @Struct.field(Name) declare creator: Name;
    @Struct.field('string') declare timestamp: string;
    @Struct.field(UInt32) declare block_num: UInt32;
    @Struct.field(Checksum256) declare trx_id: Checksum256;
    @Struct.field(Name, { optional: true }) declare indirect_creator?: Name;
}

// Get Deltas
@Struct.type('get_deltas_response_delta')
export class GetDeltasResponseDelta extends Struct {
    @Struct.field('string') declare timestamp: string;
    @Struct.field(UInt32) declare present: UInt32;
    @Struct.field(Name) declare code: Name;
    @Struct.field(Name) declare scope: Name;
    @Struct.field(Name) declare table: Name;
    @Struct.field(Name) declare primary_key: Name;
    @Struct.field(Name) declare payer: Name;
    @Struct.field(UInt32) declare block_num: UInt32;
    @Struct.field(Checksum256) declare block_id: Checksum256;
    @Struct.field('any') declare data: any;
}

@Struct.type('get_deltas_response')
export class GetDeltasResponse extends Struct {
    @Struct.field(GetDeltasResponseDelta, { array: true }) declare deltas: GetDeltasResponseDelta[];
}

// Get Transacted Accounts
@Struct.type('get_transacted_accounts_response')
export class GetTransactedAccountsResponse extends Struct {
    @Struct.field(Name, { array: true }) declare accounts: Name[];
}

// Get Transfers
@Struct.type('get_transfers_response_transfer')
export class GetTransfersResponseTransfer extends Struct {
    @Struct.field(Name) declare from: Name;
    @Struct.field(Name) declare to: Name;
    @Struct.field('string') declare quantity: string;
    @Struct.field('string') declare memo: string;
    @Struct.field(UInt32) declare block_num: UInt32;
    @Struct.field(Checksum256) declare trx_id: Checksum256;
}

@Struct.type('get_transfers_response')
export class GetTransfersResponse extends Struct {
    @Struct.field(GetTransfersResponseTransfer, { array: true }) declare transfers: GetTransfersResponseTransfer[];
}

// v2/state endpoints

// Get Account
@Struct.type('get_account_response')
export class GetAccountResponse extends Struct {
    @Struct.field(AccountObject) declare account: AccountObject;
    @Struct.field('array') declare links: Array<{ timestamp: string, permission: string, code: string, action: string }>;
    @Struct.field('array') declare tokens: Array<{ symbol: string, precision: number, amount: number, contract: string }>;
    @Struct.field('number') declare total_actions: number;
    @Struct.field(GetActionsResponseAction, { array: true }) declare actions: GetActionsResponseAction[];
}

// Get Key Accounts
@Struct.type('get_key_accounts_response')
export class GetKeyAccountsResponse extends Struct {
    @Struct.field(Name, { array:    true }) declare account_names: Name[];
    @Struct.field('array', { optional: true }) declare permissions?: Array<{
        owner: Name;
        block_num: UInt32;
        parent: Name;
        last_updated: string;
        auth: any;
        name: string;
        present: UInt32;
    }>;
}

// Get Links
@Struct.type('get_links_response_link')
export class GetLinksResponseLink extends Struct {
    @Struct.field(UInt32) declare block_num: UInt32;
    @Struct.field('string') declare timestamp: string;
    @Struct.field(Name) declare account: Name;
    @Struct.field(Name) declare permission: Name;
    @Struct.field(Name) declare code: Name;
    @Struct.field(Name) declare action: Name;
    @Struct.field('boolean') declare irreversible: boolean;
}

@Struct.type('get_links_response')
export class GetLinksResponse extends Struct {
    @Struct.field(GetLinksResponseLink, { array: true }) declare links: GetLinksResponseLink[];
}

// Get Proposals
@Struct.type('get_proposals_response_proposal')
export class GetProposalsResponseProposal extends Struct {
    @Struct.field('string') declare proposer: string;
    @Struct.field('string') declare proposal_name: string;
    @Struct.field('array') declare requested: Array<{ actor: string; permission: string }>;
    @Struct.field('array') declare provided: Array<{ actor: string; permission: string }>;
    @Struct.field('boolean') declare executed: boolean;
}

@Struct.type('get_proposals_response')
export class GetProposalsResponse extends Struct {
    @Struct.field(GetProposalsResponseProposal, { array: true }) declare proposals: GetProposalsResponseProposal[];
}

// Get Tokens
@Struct.type('get_tokens_response_token')
export class GetTokensResponseToken extends Struct {
    @Struct.field('string') declare symbol: string;
    @Struct.field(UInt32) declare precision: UInt32;
    @Struct.field('number') declare amount: number;
    @Struct.field(Name) declare contract: Name;
}

@Struct.type('get_tokens_response')
export class GetTokensResponse extends Struct {
    @Struct.field(GetTokensResponseToken, { array: true }) declare tokens: GetTokensResponseToken[];
}

// Get Voters
@Struct.type('get_voters_response_voter')
export class GetVotersResponseVoter extends Struct {
    @Struct.field(Name) declare account: Name;
    @Struct.field('number') declare weight: number;
    @Struct.field('number') declare last_vote: number;
    @Struct.field('object') declare data: { [key: string]: any };
}

@Struct.type('get_voters_response')
export class GetVotersResponse extends Struct {
    @Struct.field(GetVotersResponseVoter, { array: true }) declare voters: GetVotersResponseVoter[];
}

// v2/stats endpoints

// Get Action Usage
@Struct.type('get_action_usage_response')
export class GetActionUsageResponse extends Struct {
    @Struct.field('string') declare period: string;
    @Struct.field('string', { optional: true }) declare end_date?: string;
    @Struct.field('boolean', { optional: true }) declare unique_actors?: boolean;
}

// Get API Usage
@Struct.type('get_api_usage_response_bucket')
export class GetApiUsageResponseBucket extends Struct {
    @Struct.field('string') declare timestamp: string;
    @Struct.field('object') declare responses: { [key: string]: any };
}

@Struct.type('get_api_usage_response')
export class GetApiUsageResponse extends Struct {
    @Struct.field('object') declare total: { responses: { [key: string]: any } };
    @Struct.field(GetApiUsageResponseBucket, { array: true }) declare buckets: GetApiUsageResponseBucket[];
}

// Get Missed Blocks
@Struct.type('get_missed_blocks_response_event')
export class GetMissedBlocksResponseEvent extends Struct {
    @Struct.field('string') declare '@timestamp': string;
    @Struct.field(UInt32) declare last_block: UInt32;
    @Struct.field(UInt32) declare schedule_version: UInt32;
    @Struct.field(UInt32) declare size: UInt32;
    @Struct.field(Name) declare producer: Name;
}

@Struct.type('get_missed_blocks_response')
export class GetMissedBlocksResponse extends Struct {
    @Struct.field('object') declare stats: { by_producer: { [key: string]: any } };
    @Struct.field(GetMissedBlocksResponseEvent, { array: true }) declare events: GetMissedBlocksResponseEvent[];
}

// Get Resource Usage
@Struct.type('get_resource_usage_response')
export class GetResourceUsageResponse extends Struct {
    @Struct.field(Name) declare code: Name;
    @Struct.field(Name) declare action: Name;
    @Struct.field('object') declare usage_stats: { [key: string]: any };
}