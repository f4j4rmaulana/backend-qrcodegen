//import express
const express = require('express');

// Import validationResult from express-validator
const { validationResult } = require('express-validator');

//import bcrypt
const bcrypt = require('bcryptjs');

//import jsonwebtoken
const jwt = require('jsonwebtoken');

//import prisma client
const prisma = require('../prisma/client');

//function login
const login = async (req, res) => {
    // Periksa hasil validasi
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Jika ada error, kembalikan error ke pengguna
        return res.status(422).json({
            success: false,
            message: 'Validation error',
            errors: errors.array(),
        });
    }
    
    try {
        //find user
        const user = await prisma.user.findFirst({
            where: {
                email: req.body.email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
            },
        });
        

        //user not found
        if (!user)
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });

        //compare password
        const validPassword = await bcrypt.compare(req.body.password, user.password);

        //password incorrect
        if (!validPassword)
            return res.status(401).json({
                success: false,
                message: 'Invalid password',
            });

        //generate token JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        // Destructure to remove password from user object
        const { password, ...userWithoutPassword } = user;

        //return response
        res.status(200).send({
            success: true,
            message: 'Login successfully',
            data: {
                user: userWithoutPassword,
                token: token,
            },
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Logout function in Express
const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,  // Adjust based on how the cookie was set
            secure: process.env.NODE_ENV === 'production',  // Set to `true` if using HTTPS
            sameSite: 'Strict'  // Adjust based on your requirements
        });

        return res.status(200).json({
            success: true,
            message: 'Logout successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};


module.exports = { login, logout };

