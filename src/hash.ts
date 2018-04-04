// Edited from original: https://github.com/darkskyapp/string-hash
export function hash(s) {
	let h = 5381;
	for (let i = s.length; i--; )
		h = (h * 33) ^ s.charCodeAt(i);
	return (h >>> 0).toString(36);
}