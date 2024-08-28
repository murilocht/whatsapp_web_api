import { initAuthCreds, proto, BufferJSON } from "@whiskeysockets/baileys";

import { prisma } from '../libs/db'
import { isEmpty } from '../helpers/func'

const authState = async (dispositivoId) => {
	const dispositivo = await prisma.dispositivo.findUnique({ where: { dispositivoId } });
	var creds = {};
	var keys = {};

	if (isEmpty(dispositivo.dispositivoSessao)) {
		creds = initAuthCreds();
		keys = {};
	} else {
		const sessao = JSON.parse(dispositivo.dispositivoSessao, BufferJSON.reviver);
		creds = sessao.creds;
		keys = sessao.keys;
	}

	const saveState = async () => {
		await prisma.dispositivo.update({
			data: { dispositivoSessao: JSON.stringify({ creds, keys }, BufferJSON.replacer, 0) },
			where: { dispositivoId },
		});
	};

	return {
		state: {
			creds,
			keys: {
				get: (key, ids) => {
					return ids.reduce((dict, id) => {
						var value = keys[key]?.[id];
						if (value) {
							if (key === "app-state-sync-key") {
								value = proto.Message.AppStateSyncKeyData.fromObject(value);
							}
							dict[id] = value;
						}
						return dict;
					}, {});
				},
				set: (data) => {
					for (const key in data) {
						keys[key] = keys[key] || {};
						Object.assign(keys[key], data[key]);
					}
					saveState();
				},
			},
		},
		saveState,
	};
};

export default authState;