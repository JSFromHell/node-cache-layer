import { config, updateConfig, loadHandler } from "./src/config"
import { RouteCheck } from "./src/RouteCheck"

export default (options: any = {}) => {
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
				// TESTTEEEEE
				reply.header["x-cached"] = "1";
				res.set(reply.header);

				res.removeHeader("X-Powered-By");

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

					// TESTEEEE
					cache.push(Buffer.from("<hr /><b>cac<font color='red'>hed</font></b>", encoding));

					const now = new Date();
					let dateExpire = new Date();
					dateExpire.setSeconds(now.getSeconds() + expire);

					const rawUrl = req.originalUrl;
					const buf = Buffer.concat(cache);

					const headers = route.mergeHeaders(
						res._headers,
						{
							"Content-Length": buf.length,
							"Last-Modified": now.toUTCString(),
							"Cache-Control": "max-age=" + (dateExpire.getTime() / 1000)
						}
					);
					
					cacheControl.set(
						key,
						buf,
						headers,
						rawUrl,
						expire
					);
					end.call(res);
				};
				return next();
			}
		});
	}
}