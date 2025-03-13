const Message = require('../models/messages');

//get message history
exports.messages = async (req, res) => {
    try {
      const messages = await Message.find({
        $or: [
          { sender: req.user.userId, receiver: req.params.receiverId },
          { sender: req.params.receiverId, receiver: req.user.userId },
        ],
      }).sort({ timestamp: 1 });
  
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Error retrieving messages" });
    }}