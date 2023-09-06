import { v4 as uuidv4 } from 'uuid';

// Import your User and File models here
import User from '../models/User'; // Replace with your actual User model import
import File from '../models/File'; // Replace with your actual File model import

// Define the FilesController object
const FilesController = {
  // Endpoint for creating a new file in the DB and on disk
  createFile: async (req, res) => {
    try {
      // Extract the user's ID from the token
      const userId = req.user.id; // Assuming you have a middleware to extract user from token

      // Parse the request body
      const { name, type, parentId, isPublic, data } = req.body;

      // Validate the required fields
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if ((type !== 'folder') && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Validate parentId if provided
      if (parentId) {
        const parentFile = await File.findOne({ _id: parentId });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Handle file data for non-folder types
      let localPath;
      if (type !== 'folder') {
        // Generate a unique filename using UUID
        const filename = `${uuidv4()}.dat`;

        // Store the file in the local path
        localPath = `${process.env.FOLDER_PATH || '/tmp/files_manager'}/${filename}`;

        // Assuming data is Base64 encoded, you need to decode it
        const fileData = Buffer.from(data, 'base64');

        // Save the file locally
        require('fs').writeFileSync(localPath, fileData);
      }

      // Create a new file document
      const newFile = new File({
        userId,
        name,
        type,
        isPublic: !!isPublic,
        parentId,
        localPath,
      });

      // Save the file to the database
      await newFile.save();

      // Return the new file document with a status code 201
      return res.status(201).json(newFile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default FilesController;
