# Node.js Cache Layer

Cache layer compatible with express framework. 

## Install

#### First step:
Install the main package:
```
npm install node-cache-layer --save
```

#### Second step:
Install the handler desired to store the cache:

**Redis**:
```
npm install cache-layer-redis --save
```

**MongoDB**:
```
npm install cache-layer-mongodb --save
```

**FileSystem**:
```
npm install cache-layer-filesystem --save
```


## Usage

Seamless integration without any major change in your application.
It caches the entire body response and the headers as well.

```javascript
import cache from "node-cache-layer"

const app = express();

app.use(cache());
```

Complete options:

```javascript
app.use(
	cache({
		config_file: "./path/config.json", // If you prefer not to use the default location
		handler: "cache-layer-redis", // Name of the module that will handle the cache. It can be set here or in the config file.
		isCacheable(req: any) { // Custom function to define whether the response can be cached
			if(req.query.is_preview == "1")
				return false;
			
			return true;
		},
		callbacks: { // Optional callbacks. Customized modifications could be done here
			before_serve(key: string, body: string, headers: any, encoding?: string): void {
				// If the route is cached, this function will be called before send the output to the client.
			},
			before_cache(route: any, cache: Buffer[], headers: any, encoding?: string): void {

			},
			after_cache(key: string, route: any, body: Buffer, headers: any, encoding?: string): void {

			}
		}
	})
);
```

### Config File

The default config file is located at the application root.
It's a JSON named "**cache-config.json**".

```json
{
	"prefix": "cache_",
	"handler": "",
	"status": [200],
	"expire": 86400,
	"rules": [
		{
			"name": "",
			"group": "",
			"status": [],
			"route": "",
			"regex": "",
			"ignore_case": false,
			"expire": 10,
			"methods": ["OPTIONS", "GET", "HEAD", "POST", "PUT", "DELETE", "TRACE", "CONNECT"],
			"variables": {
				"params": [],
				"query": [
					{
						"value": "",
						"ignore_case": true
					}
				],
				"cookies": [],
				"body": [],
				"session": [],
				"header": [],
				"subdomains": []
			}
		}
	]
}
```

### General properties
Property | Description | Type | Example | Default Value
------------ | ------------- | ------------- | ------------- | -------------
prefix | If you want to prefix the record id/key to store. In case of databases with the concept of tables/collections, this will be used to name it. | string | `prefix: "cache_"` | cache_
handler | The name of the module to handle the cache. | string | `handler: "cache-layer-redis"` | built-in memory (not recommended for production)
status | Array containg all the status code that must be cached. This is valid for all the rules without the property status declared in itself. | number[] | `status: "[ 200, 401 ]"` | [ 200 ]
expire | Time to live (in seconds) of the cached route. | number | `expire: 60` | 86400 (1 day)
rules | Array containing all the rules to cache the routes. | object[] |  | []

#### Rules properties