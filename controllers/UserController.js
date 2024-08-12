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
        // Get page and limit from query params, with default values
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Calculate offset
        const offset = (page - 1) * limit;

        // Get all users from the database with pagination, excluding the admin user
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
            skip: offset,
            take: limit,
        });

        // Get the total number of users, excluding the admin user
        const totalUsers = await prisma.user.count({
            where: {
                email: { not: 'admin@admin.com' },
            },
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalUsers / limit);

        // Send response
        res.status(200).send({
            success: true,
            message: 'Get all users successfully',
            data: users,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
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

//function findUserById
const findUserById = async (req, res) => {

    //get ID from params
    const { id } = req.params;

    try {

        //get user by ID
        const user = await prisma.user.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        //send response
        res.status(200).send({
            success: true,
            message: `Get user By ID :${id}`,
            data: user,
        });

    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Internal server error",
        });
    }
};

//function updateUser
const updateUser = async (req, res) => {

    //get ID from params
    const { id } = req.params;

    // Periksa hasil validasi
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Jika ada error, kembalikan error ke pengguna
        return res.status(422).json({
            success: false,
            message: "Validation error",
            errors: errors.array(),
        });
    }

    //hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try {

        //update user
        const user = await prisma.user.update({
            where: {
                id: Number(id),
            },
            data: {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            },
        });

        //send response
        res.status(200).send({
            success: true,
            message: 'User updated successfully',
            data: user,
        });

    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Internal server error",
        });
    }
};

//function deleteUser
const deleteUser = async (req, res) => {

    // Get ID from params
    const { id } = req.params;

    try {

        // Fetch the user by ID to check their email
        const loggedInUser = await prisma.user.findUnique({
            where: {
                id: Number(req.userId),
            },
        });

        if (loggedInUser.email !== 'admin@admin.com') {
            return res.status(403).send({
                success: false,
                message: 'You do not have permission to delete users.',
            });
        }
        
        // Fetch the user by ID to check their email
        const user = await prisma.user.findUnique({
            where: {
                id: Number(id),
            },
        });

        // Check if the user exists
        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'User not found',
            });
        }

        // Prevent deletion if the user is the admin
        if (user.email === 'admin@admin.com') {
            return res.status(403).send({
                success: false,
                message: 'Admin user cannot be deleted',
            });
        }

        // Delete the user if they are not an admin
        await prisma.user.delete({
            where: {
                id: Number(id),
            },
        });

        // Send response
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


module.exports = { findUsers, createUser, findUserById, updateUser, deleteUser };