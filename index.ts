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

				res.set(reply.header);
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


					let originalHeaders = Object.assign({}, res._headers);
					if(config.callbacks && config.callbacks.before_cache) {
						config.callbacks.before_cache(route, cache, originalHeaders, encoding);
					}

					const now = new Date();
					let dateExpire = new Date();
					dateExpire.setSeconds(now.getSeconds() + expire);

					const rawUrl = req.originalUrl;
					const buf = Buffer.concat(cache);

					const headers = route.mergeHeaders(
						originalHeaders,
						{
							"Content-Length": buf.length,
							"Last-Modified": now.toUTCString(),
							"Cache-Control": "max-age=" + (dateExpire.getTime() / 1000 >> 0)
						}
					);
					
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