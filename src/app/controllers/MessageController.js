import { isEmpty } from '../helpers/func';
import { prisma } from '../libs/db'
import { getWbot } from '../libs/whatsapp';

class MessageController {
	async store(req, res) {
		const { msg, dispositivo_id, numero_destinatario } = req.body;

		if (isEmpty(msg)) {
			return res.status(400).json({ message: "msg obrigatório" })
		}

		if (isEmpty(dispositivo_id)) {
			return res.status(400).json({ message: "dispositivo_id obrigatório" })
		}

		if (isEmpty(numero_destinatario)) {
			return res.status(400).json({ message: "numero_destinatario obrigatório" })
		}

		if (numero_destinatario.length != 12) {
			return res.status(400).json({ message: "numero_destinatario precisa ter 12 caracteres. ex: 559991397351" })
		}

		const sessao = getWbot(dispositivo_id);
		const numero = `${numero_destinatario}@s.whatsapp.net`;
		const sendedMessage = await sessao.sendMessage(numero, { text: msg });

		await prisma.mensagem.create({
			data: {
				mensagemId: sendedMessage.key.id,
				mensagemJid: sendedMessage.key.remoteJid,
				mensagemNome: sessao.user.name,
				mensagemCorpo: sendedMessage.message.extendedTextMessage.text,
			},
		});

		return res.status(200).json({ message: "Mensagem enviada..." });
	}
}

export default new MessageController();