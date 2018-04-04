import { config } from "./config"
import { hash } from "./hash"
import * as url from "url"

export class RouteCheck {
	private _key: string;
	private _expire: number;
	private _url: string;
	private _original: string;

	private _isCacheable: boolean = false;
	constructor(private req) {
		this._original = url.parse(req.originalUrl).pathname;
		if(config.ignore_case) {
			this._original = this._original.toLocaleLowerCase();
		}

		const mayCache = this.matchesRule();
		if (mayCache) {
			if (typeof config.isCacheable == "function") {
				this._isCacheable = config.isCacheable(this.req);
			}
			else {
				this._isCacheable = true;
			}
		}
	}

	private getNormalizedKey(): string {
		const vars = config.variables;

		let baseUrl: string[] = [
			this._original,
			this.req.method
		];
		let param: string[] = [];

		for (let o in vars) {
			if (o in this.req) {
				const values = this.req[o];
				const type = vars[o];
				for (let i = 0; i < type.length; i++) {
					let n: string;
					let v: string;
					if (typeof type[i] == "object") {
						[n, v] = [type[i].value, values[n]];

						if (typeof v == "undefined") {
							continue;
						}

						if (type[i].ignore_case) {
							v = v.toLocaleLowerCase();
						}
					}
					else {
						[n, v] = [type[i], values[i]];

						if (typeof v == "undefined") {
							continue;
						}
					}
					param.push(n + "=" + v);
				}
			}
		}

		if (param.length) {
			baseUrl.push("?");
		}
		return baseUrl.join("_") + param.join("&");
	}

	private hasMethod(rule: any): boolean {
		if (rule.methods && rule.methods != "*") {
			if (!~rule.methods.indexOf(this.req.method)) {
				return false;
			}
		}
		return true;
	}

	private matchesRule(): boolean {
		let url = this._original;
		let has: boolean = false;

		let rule;
		for (rule of config.rules) {
			if(!this.hasMethod(rule))
				continue;
			
			if (rule.regex && rule.regex.test(url)) {
				has = true;
				break;
			}
			else if (rule.route) {
				if (rule.route == url) {
					has = true;
					break;
				}
			}
		}
		if (has) {
			this.useMatchedRule(rule);
		}
		return has;
	}

	private useMatchedRule(rule) {
		let group = rule.group ? rule.group + "_" : "";
		this._url = this.getNormalizedKey();
		this._key = group + hash(this._url);
		this._expire = rule.expire;
	}

	get isCacheable(): boolean {
		return this._isCacheable;
	}

	get key(): string {
		return this._key;
	}

	get expire(): number {
		return this._expire;
	}

	get normalizedKey(): string {
		return this._url;
	}

	mergeHeaders(original: any, newValues: any): any {
		let head = Object.assign({}, original);

		for (let o in head) {
			let n = o.toLocaleLowerCase();
			if (n in newValues)
				delete head[o];
		}

		return Object.assign(head, newValues);
	}
}