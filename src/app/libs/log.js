import pino from "pino";

const log = pino({
	transport: {
		target: 'pino-pretty',
		options: {
			levelFirst: true,
			translateTime: true,
			colorize: true,
		}
	}
});

export default log;
