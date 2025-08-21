export function formatSeconds(seconds: number) {
	if (isNaN(seconds)) return "...";

	const minutes = Math.floor(seconds / 60);
	seconds = Math.floor(seconds % 60);
	let secs = seconds.toString();
	if (seconds < 10) secs = "0" + seconds;

	return `${minutes}:${secs}`;
}

export const formatPhoneNumber = (value: number | string) => {
	let prefix: string;
	let numberStr = value.toString().replace("+", "");
	if (numberStr.startsWith("88314") && numberStr.length === 15) {
		prefix = "xxxxx"
	} else if (numberStr.startsWith("8")) {
		prefix = "x"
	} else {
		prefix = "+x"
	}
	return numberStr.split("").reduce((acc, v) => acc.replace("x", v), `${prefix} xxx xxx-xx-xx`);
};
