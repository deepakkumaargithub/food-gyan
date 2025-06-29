const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { getSession } = require('../config/db');
const { createUser, findUserByEmail } = require('../models/userModel');

exports.register = async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    const session = getSession();

    try {
       
        const existingUser = await findUserByEmail(session, email);
        if (existingUser) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

       
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        
        const newUser = await createUser(session, username, email, hashedPassword);

        const payload = { 
            user: { 
                id: newUser.id,
                username: newUser.username 
            } 
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).send('Server error');
    } finally {
        await session.close();
    }
};

exports.login = async (req, res) => {
   
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const session = getSession();

    try {
       
        const user = await findUserByEmail(session, email);
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

       
         const payload = { 
            user: { 
                id: user.id,
                username: user.username 
            } 
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).send('Server error');
    } finally {
        await session.close();
    }
};