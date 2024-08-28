import { isEmpty } from '../helpers/func';
import { prisma } from '../libs/db'
import { startSession } from '../libs/whatsapp';

class DeviceController {
	async index(req, res) {
		var dispositivos = await prisma.dispositivo.findMany();

		return res.status(200).json(dispositivos);
	}

	async store(req, res) {
		const { dispositivo_nome } = req.body;

		if (isEmpty(dispositivo_nome)) {
			return res.status(400).json({ message: "dispositivo_nome obrigatório" })
		}

		var dispositivo = await prisma.dispositivo.findFirst({ where: { dispositivoNome: dispositivo_nome } });
		if (dispositivo != null && !dispositivo.isEmpty) {
			return res.status(400).json({ message: "dispositivo_nome já utilizado" })
		}

		dispositivo = await prisma.dispositivo.create({
			data: { dispositivoNome: dispositivo_nome, dispositivoStatus: "Pendente" },
		});

		await startSession(dispositivo.dispositivoId);

		return res.status(200).json({ message: "Dispositivo adicionado. Iniciando sessão..." });
	}

	async show(req, res) {
		const { dispositivo_id } = req.params;

		if (isEmpty(dispositivo_id)) {
			return res.status(400).json({ message: "dispositivo_id obrigatório" })
		}

		var dispositivo = await prisma.dispositivo.findFirst({ where: { dispositivoId: Number(dispositivo_id) } });
		if (dispositivo == null || dispositivo.isEmpty) {
			return res.status(400).json({ message: "Dispositivo não encontrado" });
		}

		dispositivo = await prisma.dispositivo.findUnique({ where: { dispositivoId: Number(dispositivo_id) } });

		return res.status(200).json(dispositivo || {});
	}

	async update(req, res) {
		const { dispositivo_id } = req.params;
		const { dispositivo_nome } = req.body;

		if (isEmpty(dispositivo_id)) {
			return res.status(400).json({ message: "dispositivo_id obrigatório" })
		}

		if (isEmpty(dispositivo_nome)) {
			return res.status(400).json({ message: "dispositivo_nome obrigatório" })
		}

		const dispositivo = await prisma.dispositivo.findFirst({ where: { dispositivoId: Number(dispositivo_id) } });
		if (dispositivo == null || dispositivo.isEmpty) {
			return res.status(400).json({ message: "Dispositivo não encontrado" });
		}

		await prisma.dispositivo.update({
			data: { dispositivoSessao: "", dispositivoStatus: "Pendente", dispositivoNome: dispositivo_nome },
			where: { dispositivoId: Number(dispositivo_id) },
		});

		// removeWbot(+whatsappId);

		await startSession(dispositivo_id);

		return res.status(200).json({ message: "Dispositivo atualizado. Iniciando sessão..." });
	}

	async delete(req, res) {
		const { dispositivo_id } = req.params;

		if (isEmpty(dispositivo_id)) {
			return res.status(400).json({ message: "dispositivo_id obrigatório" });
		}

		const dispositivo = await prisma.dispositivo.findFirst({ where: { dispositivoId: Number(dispositivo_id) } });
		if (dispositivo == null || dispositivo.isEmpty) {
			return res.status(400).json({ message: "Dispositivo não encontrado" });
		}

		await prisma.dispositivo.delete({ where: { dispositivoId: Number(dispositivo_id) } });

		// removeWbot(+whatsappId);

		return res.status(200).json({ message: "Dispositivo deletado" });
	}
}

export default new DeviceController();