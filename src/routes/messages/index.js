import { Router } from 'express';

import MessageController from '../../app/controllers/MessageController';

const route = new Router();

route.post('/api/message', MessageController.store);

export default route;