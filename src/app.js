import express from 'express';
import cors from 'cors';

import routes from './routes/Routes';
import { startAllSessions } from './app/libs/whatsapp';

class App {
	constructor() {
		this.server = express();

		this.middlewares();
		this.routes();
		startAllSessions();
	}

	middlewares() {
		this.server.use(cors());
		this.server.use(express.json());
		this.server.use(express.urlencoded({ extended: true }));
	}

	routes() {
		routes(this.server);
	}
}

export default new App().server;