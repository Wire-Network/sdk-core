export * as v1 from './v1/types';
export * as v2 from './v2/types';

import { ActionType, NameType } from '../chain';
import { TableIndexType, TableIndexTypes } from './v1/types';
export interface GetRowsOptions {
    contract: NameType;
    scope?: NameType;
    table: NameType;
    index_position?: "primary" | "secondary" | "tertiary" | "fourth" | "fifth" | "sixth" | "seventh" | "eighth" | "ninth" | "tenth" | undefined;
    limit?: number;
    lower_bound?: TableIndexType | string;
    upper_bound?: TableIndexType | string;
    key_type?: keyof TableIndexTypes;
        // float128: Float128;
        // float64: Float64;
        // i128: UInt128;
        // i64: UInt64;
        // name: Name;
        // ripemd160: Checksum160;
        // sha256: Checksum256;
    reverse?: boolean;
    [key: string]: any; 
}

export type TransactionExtraOptions = {
    wait_final?: boolean;
    context_free_actions?: ActionType[];
};
