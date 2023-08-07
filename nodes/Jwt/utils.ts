export function formatPrivateKey(privateKey: string): string {
	if (/\n/.test(privateKey)) {
		return privateKey;
	}
	let formattedPrivateKey = '';
	const parts = privateKey.split('-----').filter((item) => item !== '');
	parts.forEach((part) => {
		const regex = /(PRIVATE KEY|CERTIFICATE|PUBLIC KEY)/;
		if (regex.test(part)) {
			formattedPrivateKey += `-----${part}-----`;
		} else {
			const passRegex = /Proc-Type|DEK-Info/;
			if (passRegex.test(part)) {
				part = part.replace(/:\s+/g, ':');
				formattedPrivateKey += part.replace(/\s+/g, '\n');
			} else {
				formattedPrivateKey += part.replace(/\s+/g, '\n');
			}
		}
	});
	return formattedPrivateKey;
}
