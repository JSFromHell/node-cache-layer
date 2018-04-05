export class Handler {
	private _cache = {};
	constructor(public config: any = null) {

	}

	get(key: string, callback: Function) {
		if (this.config.prefix) {
			key = this.config.prefix + "_" + key;
		}

		const data = this._cache[key];
		if (data && data.expire >= new Date()) {
			return callback(null, data);
		}

		return callback(null, null);
	}
	set(key: string, content: Buffer, header: any, rawUrl: string, expire: number = null) {
		if (this.config.prefix) {
			key = this.config.prefix + "_" + key;
		}

		expire = expire || this.config.expire || 8640;
		expire = expire * 1e3 + +new Date;

		this._cache[key] = {
			content,
			header,
			rawUrl,
			expire
		}
	}

	del(key: string) {
		if (this.config.prefix) {
			key = this.config.prefix + "_" + key;
		}

		delete this._cache[key];
	}

	delGroup(group: string) {
		if (this.config.prefix) {
			group = this.config.prefix + "_" + group;
		}

		for (const k in this._cache) {
			if (k.startsWith(group + "_")) {
				delete this._cache[k];
			}
		}
	}
}

