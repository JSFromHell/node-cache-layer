import { config, loadConfigFile, updateConfig, loadHandler } from "./src/config"
import { RouteCheck } from "./src/RouteCheck"
import { ConfigParameters } from "./src/interface";

export default (options: ConfigParameters = {}) => {
	loadConfigFile(options.config_file);
	updateConfig(options);

	const module = loadHandler(config);
	const cacheControl = new module.Handler(config);

	return (req, res, next) => {
		const route = new RouteCheck(req);
		if (!route.isCacheable)
			return next();

		const end = res.end;
		const write = res.write;
		const writeHeader = res.writeHeader;
		const cache = [];
		const key = route.key;
		const expire = route.expire;
		const status = route.status || config.status;

		cacheControl.get(key, (error, reply) => {
			if (error) {
				return next();
			}
			else if (reply) {
				if(config.callbacks && config.callbacks.before_serve) {
					config.callbacks.before_serve(key, reply.content, reply.header, reply.encoding);
				}

				writeHeader.call(res, 200, reply.header);
				write.call(res, reply.content, reply.encoding);
				return res.end(reply.content, reply.encoding);
			}
			else {
				res.write = function (chunk, encoding) {
					if(typeof chunk == "string") {
						chunk = Buffer.from(chunk, encoding);
					}

					cache.push(chunk);
					write.call(res, chunk, encoding);
				}

				res.end = function (chunk, encoding) {
					if (chunk)
						this.write(chunk, encoding);

					
					if(!~status.indexOf(res.statusCode)){
						end.call(res);
						return;
					}


					let headers = {};
					const originalHeaders = res._header.split("\r\n");
					for(const h of originalHeaders) {
						if(h.includes(":")) {
							const val = h.split(":");
							headers[val[0].toLowerCase()] = val[1].trim();
						}
					}
					if(config.callbacks && config.callbacks.before_cache) {
						config.callbacks.before_cache(route, cache, headers, encoding);
					}

					const now = new Date();
					let dateExpire = new Date();
					dateExpire.setSeconds(now.getSeconds() + expire);

					const rawUrl = req.originalUrl;
					const buf = Buffer.concat(cache);

					headers["content-length"] = buf.length;
					headers["last-modified"] = now.toUTCString();
					headers["cache-control"] = "max-age=" + (dateExpire.getTime() / 1000 >> 0);
					
					cacheControl.set(
						key,
						buf,
						headers,
						rawUrl,
						expire
					, (key) => {
						if(config.callbacks && config.callbacks.after_cache) {
							config.callbacks.after_cache(key, route, buf, headers, encoding);
						}
					});
					end.call(res);
				};
				return next();
			}
		});
	}
}