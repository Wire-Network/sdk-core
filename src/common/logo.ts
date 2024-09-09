import {Struct} from '../';

import type {LogoType} from './types';

@Struct.type('logo')
export class Logo extends Struct {
    @Struct.field('string') declare dark: string;
    @Struct.field('string') declare light: string;

    static from(data: LogoType): Logo {
        if (typeof data === 'string') {
            return new Logo({light: data, dark: data});
        }

        return super.from(data) as Logo;
    }

    getVariant(variant: 'dark' | 'light'): string | undefined {
        return this[variant];
    }

    toString() {
        return this.light;
    }
}
