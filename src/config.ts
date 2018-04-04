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
			for (let o in config.rules) {
				let rule = config.rules[o];
				if (rule.regex) {
					try {
						let reg = new RegExp(rule.regex, rule.ignore_case ? "i" : "");
						rule.regex = reg;
					}
					catch {
						console.warn(`Cache Rule "${rule.name}" ignored. Wrong regular expression "${rule.regex}"`);
						delete config.rules[o];
					}
				}
			}

			// Sort Variables
			for (let o of config.variables) {
				for (let a of o) {
					if(!Array.isArray(a)) {
						a = [a];
					}
					a.sort();
				}
			}
		}
	}
	catch (e) {

	}
}
loadConfigFile();