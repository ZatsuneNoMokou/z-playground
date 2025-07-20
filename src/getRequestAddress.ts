import {FastifyRequest} from "fastify";

export function getRequestAddress(request: FastifyRequest): string {
	const xRealIp = request.headers['x-client-ip'] ? request.headers['x-client-ip'] : request.headers['x-real-ip'];
	if (request.ip === '127.0.0.1' && request.headers.connection === 'upgrade' && xRealIp) {
		return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
	}
	if (request.ip === '127.0.0.1' && request.headers['x-forwarded-proto'] === 'https' && xRealIp) {
		return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
	}

	return request.ip;
}
