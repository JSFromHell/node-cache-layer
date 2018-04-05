import * as path from "path";
import * as fs from "fs"

export let config: any = {}

export function updateConfig(options: any) {
	this.config = Object.assign(this.config, options);
}

export function loadHandler(config: any) {
	if(config.handler)
		return require(config.handler);
	
	return require("./handler/InMemory");
}

function loadConfigFile() {
	try {
		const file = path.join(process.cwd(), "cache-config.json");

		if (fs.existsSync(file)) {
			config = JSON.parse(
				fs.readFileSync(file).toString()
			);

			// Convert Rules RegExp
			for (const o in config.rules) {
				const rule = config.rules[o];
				if (rule.regex) {
					try {
						const reg = new RegExp(rule.regex, rule.ignore_case ? "i" : "");
						rule.regex = reg;
					}
					catch {
						console.warn(`Cache Rule "${rule.name}" ignored. Wrong regular expression "${rule.regex}"`);
						delete config.rules[o];
					}
				}

				// Sort Variables
				for (const tp in rule.variables) {
					let vars = rule.variables[tp];
					if(!Array.isArray(vars)) {
						vars = [vars];
					}
					vars.sort((x, y) => {
						const xv = typeof(x) == "object" ? x.value : x;
						const yv = typeof(y) == "object" ? y.value : y;
						return xv > yv ? 1 : -1;
					});
				}
			}
		}
		else {
			console.warn(`WARNING: Config file could not be found at '${file}'.`);
		}
	}
	catch (e) {
		console.warn(`Unexpected ERROR while parsing the configuration file.`);
	}
}
loadConfigFile();