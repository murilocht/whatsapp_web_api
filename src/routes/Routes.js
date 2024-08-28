import devices from './devices';
import messages from './messages';

export default router => {
	router.use(devices);
	router.use(messages);

	router.all("*", (req, res) => {
		return res.status(404).json({ message: "URL não encontrada" });
	});
}