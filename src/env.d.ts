/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

// override interface from the default > vendor/vite/types/importMeta.d.ts
interface ImportMetaEnv {
    readonly VITE_API_DNS: string;
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
