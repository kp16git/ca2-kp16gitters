import { fetchAllUsers, fetchUserByUsername, createUser as insertUser, updateUser as updateUserByUsername, deleteUser as deleteUserByUsername } from '../models/userModel.js';
import { removeAllCardsFromUser } from '../models/collectionModel.js';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (req, res) => {
  try {
    const users = await fetchAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserByUsername = async (req, res) => {
  try {
    const user = await fetchUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username query parameter is required' });
    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createNewUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const existing = await fetchUserByUsername(username);
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const user = await insertUser({ username, password: hashedPassword, coins: 10000 });

    const { password: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateExistingUser = async (req, res) => {
  try {
    const { username } = req.params;
    const { newUsername } = req.body;
    if (!newUsername) return res.status(400).json({ error: 'New username is required' });
    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const existing = await fetchUserByUsername(newUsername);
    if (existing) return res.status(409).json({ error: 'Username already taken' });
    const updated = await updateUserByUsername(username, { username: newUsername });
    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteExistingUser = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await removeAllCardsFromUser(user.user_id);
    await deleteUserByUsername(username);
    res.status(200).json({ message: 'User and their collection deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};