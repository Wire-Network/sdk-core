import {Checksum256Type} from '../';

import {ChainDefinition} from './chains';
import {ExplorerDefinition} from './explorer';
import {Logo} from './logo';

export type Fetch = (input: any, init?: any) => Promise<any>;

export type LogoType = Logo | {dark: string; light: string} | string;

export type ExplorerDefinitionType =
    | ExplorerDefinition
    | {prefix: string; suffix: string; url?: (id: string) => string};

export type ChainDefinitionType =
    | ChainDefinition
    | {
          id: Checksum256Type;
          url: string;
          explorer?: ExplorerDefinitionType;
          logo?: LogoType;
      };

export type LocaleDefinitions = Record<string, any>;
