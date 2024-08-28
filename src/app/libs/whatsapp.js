import makeWASocket, {
	isJidBroadcast, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers,
	DisconnectReason } from '@whiskeysockets/baileys';

import authState from '../helpers/authState';
import log from '../libs/log';
import { prisma } from '../libs/db';
import { isEmpty } from '../helpers/func';

const sessoes = {};

export const getWbot = (dispositivoId) => {
	if (sessoes[dispositivoId] != null) {
		return sessoes[dispositivoId];
	}

	throw new Error("Sessao nao iniciada");
};

export const removeWbot = (dispositivoId) => {
	if (sessoes[dispositivoId] != null) {
		sessoes[dispositivoId].logout();
		sessoes[dispositivoId].ws.close();
		delete sessoes[dispositivoId];
	}
};

export const initWASocket = async (dispositivoId) => {
	const dispositivo = await prisma.dispositivo.findUnique({ where: { dispositivoId } });

	await prisma.dispositivo.update({
		data: { dispositivoStatus: "Abrindo" },
		where: { dispositivoId },
	});

	const { version } = await fetchLatestBaileysVersion();
	const { state, saveState } = await authState(dispositivoId);
	var retriesQrCode = 0;

	if (!isEmpty(dispositivo.dispositivoTentativas)) {
		retriesQrCode = dispositivo.dispositivoTentativas;
	}

	var wsocket = makeWASocket({
		logger: log,
		printQRInTerminal: true,
		browser: Browsers.appropriate("Desktop"),
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, log),
		},
		version,
		shouldIgnoreJid: jid => isJidBroadcast(jid),
	});

	wsocket.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
		const statusCode = lastDisconnect?.error.output.statusCode;
		const dispositivo = await prisma.dispositivo.findFirst({ where: { dispositivoId } });
		if (dispositivo == null || dispositivo.isEmpty) {
			log.warn(`dispositivo_id ${dispositivoId} não encontrado`);

			wsocket.ev.removeAllListeners("connection.update");
			wsocket.ws.close();
			wsocket = null;
			removeWbot(dispositivoId);
		} else {
			if (connection === "close") {
				if (statusCode === DisconnectReason.forbidden) {
					await prisma.dispositivo.update({
						data: { dispositivoSessao: "", dispositivoStatus: "Pendente" },
						where: { dispositivoId },
					});
				}

				if (statusCode === DisconnectReason.loggedOut) {
					await prisma.dispositivo.update({
						data: { dispositivoSessao: "", dispositivoStatus: "Pendente", dispositivoTentativas: 0 },
						where: { dispositivoId },
					});
				}

				// io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
				// 	action: "update",
				// 	session: whatsapp
				// });
				removeWbot(dispositivoId);
				return await startSession(dispositivoId);
			}

			if (connection === "open") {
				await prisma.dispositivo.update({
					data: { dispositivoQrcode: "", dispositivoStatus: "Conectado" },
					where: { dispositivoId },
				});

				// io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
				// 	action: "update",
				// 	session: whatsapp
				// });

				if (sessoes[dispositivoId] == null) {
					sessoes[dispositivoId] = wsocket;
				}

				messageListener(dispositivoId);
				// wbotMonitor(wbot, whatsapp, companyId);

				return wsocket;
			}

			if (qr !== undefined) {
				if (retriesQrCode >= 3) {
					await prisma.dispositivo.update({
						data: { dispositivoStatus: "Desconectado", dispositivoQrcode: "" },
						where: { dispositivoId },
					});

					wsocket.ev.removeAllListeners("connection.update");
					wsocket.ws.close();
					wsocket = null;

					removeWbot(dispositivoId);
				} else {
					await prisma.dispositivo.update({
						data: {
							dispositivoTentativas: (retriesQrCode += 1),
							dispositivoQrcode: qr,
							dispositivoStatus: "Qrcode",
						},
						where: { dispositivoId },
					});
				}
			}
		}
	});

	wsocket.ev.on("creds.update", saveState);
}

export const messageListener = (dispositivoId) => {
	if (sessoes[dispositivoId] != null) {
		const sessao = sessoes[dispositivoId];

		sessao.ev.on("messages.upsert", async (messageUpsert) => {
			for (const i in messageUpsert) {
				const message = messageUpsert[i];
				if (message.message?.conversation || message.message?.extendedTextMessage) {
					var msg = "";

					if (!isEmpty(message.message?.conversation)) {
						msg = message.message.conversation;
					} else if (!isEmpty(message.message.extendedTextMessage?.text)) {
						msg = message.message.extendedTextMessage.text;
					}

					await prisma.mensagem.create({
						data: {
							mensagemId: message.key.id,
							mensagemJid: message.key.remoteJid,
							mensagemNome: message.pushName,
							mensagemCorpo: msg,
						},
					});
				}
			}
		});
	} else {
		throw new Error("Erro ao lidar com mensagens. Sessao nao iniciada");
	}
};

export const startSession = async (dispositivoId) => {
	try {
		await prisma.dispositivo.update({
			data: { dispositivoStatus: "Abrindo", dispositivoTentativas: 0 },
			where: { dispositivoId },
		});

		await initWASocket(dispositivoId);
	} catch (e) {
		log.error(e);
	}
};

export const startAllSessions = async () => {
	const dispositivos = await prisma.dispositivo.findMany();

	if (dispositivos != null && !dispositivos.isEmpty) {
		log.info('Iniciando sessoes...');
		for (const { dispositivoId } of dispositivos) {
			await startSession(dispositivoId);
		}
	}
}