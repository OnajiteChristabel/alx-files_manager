import { ObjectID } from 'mongodb';
import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Import any necessary models or database connections

// Create a new Bull queue for background tasks if needed
const userQueue = new Queue('userQueue');

// Define the UsersController object
const UsersController = {
  // Endpoint for creating a new user
  createUser: async (req, res) => {
    try {
      // Check if email and password are provided in the request body
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      // Check if the email already exists in the database
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exists' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);

      // Create a new user object
      const newUser = {
        email,
        password: hashedPassword, // Store the hashed password
      };

      // Save the new user to the database
      const savedUser = await User.create(newUser);

      // Add any additional tasks you want to perform asynchronously here
      await userQueue.add('sendWelcomeEmail', { email: savedUser.email });

      // Return the new user with a status code of 201
      return res.status(201).json({
        id: savedUser._id, // Assuming MongoDB generates the id
        email: savedUser.email,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default UsersController;
