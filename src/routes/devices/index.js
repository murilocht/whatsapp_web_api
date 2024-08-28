import { Router } from 'express';

import DeviceController from '../../app/controllers/DeviceController';

const route = new Router();

route.get('/api/devices', DeviceController.index);
route.post('/api/devices', DeviceController.store);
route.get('/api/devices/:dispositivo_id', DeviceController.show);
route.put('/api/devices/:dispositivo_id', DeviceController.update);
route.delete('/api/devices/:dispositivo_id', DeviceController.delete);

export default route;