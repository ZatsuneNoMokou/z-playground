import Fastify, {FastifyReply, FastifyRequest} from 'fastify';
import {fastifyStatic} from '@fastify/static';
import {fastifyCookie} from '@fastify/cookie';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {Static, Type} from "@sinclair/typebox";
import {EditorData} from "./bo/flems.js";
import {getRequestAddress} from "./getRequestAddress.js";
import * as process from "node:process";
import * as crypto from "node:crypto";

const __dirname = import.meta.dirname;

// Create Fastify server instance
const server = Fastify({
	logger: {
		level: 'warn',
		transport: {
			target: 'pino-pretty',
			options: {
				translateTime: 'HH:MM:ss Z',
				ignore: 'pid,hostname',
				singleLine: true,
			},
		},
		serializers: {
			res(reply: FastifyReply) {
				// The default
				return {
					statusCode: reply.statusCode
				}
			},
			req(request: FastifyRequest) {
				return {
					method: request.method,
					url: request.url,
					ip: getRequestAddress(request),
					hostname: request.hostname,
					ua: request.headers['user-agent'],
				}
			}
		}
	},
});



// Secure cookie configuration
if (!process.env.COOKIE_SECRET) {
	server.log.error('COOKIE_SECRET environment variable not set.');
}
await server.register(fastifyCookie, {
	secret: process.env.COOKIE_SECRET ?? crypto.randomUUID(), // Use a strong, environment-specific secret
	parseOptions: {
		httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
		secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
		sameSite: 'strict', // Protect against CSRF attacks
		maxAge: 24 * 60 * 60 // Optional: cookie expiration (24 hours)
	}
})



// Static file hosting
server.register(fastifyStatic, {
	root: path.normalize(`${__dirname}/../public`),
	allowedPath(pathName) {
		const extension = path.extname(pathName);
		return /^\.(?:css|js|png|jpe?g|svg|web[pm]|woff2)$/i.test(extension) && !pathName.split(/[\/\\]/).some(part => part.startsWith('.'));
	},
	prefix: '/',
});

// Static file hosting
server.register(fastifyStatic, {
	root: path.normalize(`${__dirname}/../data`),
	allowedPath(pathName) {
		const extension = path.extname(pathName);
		return /^\.json$/i.test(extension) && !pathName.split(/[\/\\]/).some(part => part.startsWith('.'));
	},
	prefix: '/data',
	decorateReply: false,
});



// Basic route
const indexHtmlRoute = path.normalize(`${__dirname}/../public/index.html`);
server.get<{ Reply: string }>('/', {
	schema: {
		response: {
			200: Type.String()
		}
	}
}, async (_, reply) => {
	return reply.type('text/html')
		.send(fs.readFileSync(indexHtmlRoute, 'utf8'));
});



const queryWithId = Type.Object({
	id: Type.Optional(Type.String())
});
type queryWithId = Static<typeof queryWithId>;

const error = Type.Object({
	error: Type.String(),
});
type error = Static<typeof error>;



server.post<{ Params: queryWithId, Reply: EditorData|error }>('/data/:id.json', {
	schema: {
		params: queryWithId,
		response: {
			200: EditorData,
			400: error,
		},
	}
}, async (request, reply) => {
	const id = request.params.id,
		filePath = path.normalize(`${__dirname}/../data/${id}.json`);
	if (filePath.split(/[\/\\]/).some(part => part.startsWith('.'))) {
		return reply.status(400).send({ error: 'Bad Request' });
	}

	try {
		return reply.send(JSON.parse(fs.readFileSync(filePath, 'utf8')));
	} catch (err) {
		console.error(err);
		return reply.status(400).send({ error: 'Bad Request' });
	}
});

const saveReply = Type.Object({
	error: Type.Literal(false),
	data: Type.Object({
		id: Type.String(),
	})
});
type saveReply = Static<typeof saveReply>;

server.post<{ Querystring: queryWithId, Reply: saveReply|error }>('/save', {
	schema: {
		querystring: queryWithId,
		body: EditorData,
		response: {
			200: saveReply,
			500: error
		}
	}
}, async (request, reply) => {
	let id = request.query.id,
		filePath:string|null = null;
	if (id) {
		filePath = `${__dirname}/../data/${id}.json`;
		if (!fs.existsSync(filePath)) {
			request.log.error('Data file not found.');
			return reply.status(500).send({
				error: 'SAVE_ERROR'
			});
		}
	}
	if (!id) {
		id = crypto.randomUUID();
		filePath = `${__dirname}/../data/${id}.json`;
		if (fs.existsSync(filePath)) {
			request.log.error('Generated id already exists');
			return reply.status(500).send({
				error: 'SAVE_ERROR'
			});
		}
	}
	if (!id) {
		request.log.error('No id found.');
		return reply.status(500).send({
			error: 'SAVE_ERROR'
		});
	}

	if (process.env.COOKIE_NAME && process.env.COOKIE_VALUE) {
		if (request.cookies[process.env.COOKIE_NAME] !== process.env.COOKIE_VALUE) {
			return reply.status(500).send({
				error: 'SAVE_ERROR'
			});
		}
	}

	try {
		fs.writeFileSync(`${__dirname}/../data/${id}.json`, JSON.stringify(request.body, null, '\t'),'utf8');
		return reply.send({ error: false, data: { id } });
	} catch (err) {
		console.error(err);
		return reply.status(500).send({
			error: 'SAVE_ERROR'
		});
	}
});



server.get('/flems/flems.html', async (_, reply) => {
	return reply.type('text/html')
		.send(
			fs.readFileSync(path.normalize(import.meta.resolve('flems/dist/flems.html').replace(/file:\/{3}/, '')), 'utf8')
		)
});



// Start the server
const port = process.env.PORT ?? 3000;
server.listen({ port: typeof port === 'string' ? parseInt(port) : port, host: "127.0.0.1" }, (err, address) => {
	if (err) {
		server.log.error(err);
		process.exit(1);
	}
	server.log.warn(`Server listening on ${address}`);
});
