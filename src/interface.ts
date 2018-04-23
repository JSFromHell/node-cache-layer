export declare interface ConfigCallbacks {
	before_serve?(key: string, body: string, headers: any, encoding?: string): void;
	before_cache?(route: any, cache: Buffer[], headers: any, encoding?: string): void;
	after_cache?(key: string, route: any, body: Buffer, headers: any, encoding?: string): void;
}
export declare interface ConfigParameters {
	config_file?: string;
	handler?: string;
	isCacheable?(req: any): boolean;
	callbacks?: ConfigCallbacks;
}
