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

//function findUsers
const findUsers = async (req, res) => {
    try {
        //get all users from database
        const users = await prisma.user.findMany({
            where: {
                email: { not: 'admin@admin.com' },
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                id: 'desc',
            },
        });

        //send response
        res.status(200).send({
            success: true,
            message: 'Get all users successfully',
            data: users,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

//function createUser
const createUser = async (req, res) => {
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

    //hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try {
        //insert data
        const user = await prisma.user.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            },
        });

        res.status(201).send({
            success: true,
            message: 'User created successfully',
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

//function deleteUser
const deleteUser = async (req, res) => {
    //get ID from params
    const { id } = req.params;

    try {
        //delete user
        const users = await prisma.user.delete({
            where: {
                id: Number(id),
                NOT: { email: 'admin@admin.com' },
            },
        });

        //send response
        res.status(200).send({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

module.exports = { findUsers, createUser, deleteUser };
